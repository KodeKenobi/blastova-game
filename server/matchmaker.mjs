import { WebSocketServer } from 'ws';
import { randomUUID } from 'node:crypto';

const port = Number(process.env.PORT || process.env.BLASTOVA_MATCHMAKER_PORT || 8787);
const host = process.env.HOST || '0.0.0.0';
const statsHeartbeatMs = Math.max(400, Number(process.env.BLASTOVA_MATCH_STATS_HEARTBEAT_MS || 900));
const wss = new WebSocketServer({ port, host });

const clients = new Map();
const matches = new Map();
const lobbies = new Map();

function getLobbyStatsPayload() {
  let online = 0;
  let searching = 0;
  clients.forEach((client) => {
    if (client?.ws?.readyState === client?.ws?.OPEN) {
      online += 1;
    }
    if (client?.searching && !client?.matchId) {
      searching += 1;
    }
  });

  const openLobbies = Array.from(lobbies.values()).filter((lobby) => !lobby.guestId).length;

  return {
    type: 'lobby_stats',
    online,
    openLobbies: searching,
    openLobbyHosts: openLobbies,
    updatedAt: Date.now(),
  };
}

function normalizeRole(role) {
  return role === 'enemyCommander' ? 'enemyCommander' : 'defender';
}

function oppositeRole(role) {
  return normalizeRole(role) === 'enemyCommander' ? 'defender' : 'enemyCommander';
}

function removeLobbyByHost(hostId) {
  for (const [lobbyId, lobby] of lobbies.entries()) {
    if (lobby.hostId === hostId) {
      lobbies.delete(lobbyId);
    }
  }
}

function serializeLobby(lobby) {
  return {
    lobbyId: lobby.id,
    hostRole: lobby.hostRole,
    neededRole: oppositeRole(lobby.hostRole),
    hostLevel: lobby.hostLevel,
    createdAt: lobby.createdAt,
    ageSec: Math.max(0, Math.floor((Date.now() - lobby.createdAt) / 1000)),
  };
}

function getCompatibleLobbies(rolePreference) {
  const desiredRole = normalizeRole(rolePreference);
  return Array.from(lobbies.values())
    .filter((lobby) => !lobby.guestId && oppositeRole(lobby.hostRole) === desiredRole)
    .sort((a, b) => a.createdAt - b.createdAt)
    .map(serializeLobby);
}

function sendLobbyList(clientId) {
  const client = clients.get(clientId);
  if (!client) return;
  const rolePreference = normalizeRole(client.browseRole || client.rolePreference || 'defender');
  safeSend(client.ws, {
    type: 'lobby_list',
    rolePreference,
    lobbies: getCompatibleLobbies(rolePreference),
    updatedAt: Date.now(),
  });
}

function broadcastLobbyLists() {
  clients.forEach((_, clientId) => {
    sendLobbyList(clientId);
  });
}

function broadcastLobbyStats() {
  const payload = getLobbyStatsPayload();
  clients.forEach((client) => {
    safeSend(client?.ws, payload);
  });
}

setInterval(() => {
  broadcastLobbyStats();
}, statsHeartbeatMs);

function safeSend(ws, payload) {
  if (!ws || ws.readyState !== ws.OPEN) return;
  try {
    ws.send(JSON.stringify(payload));
  } catch (_) {}
}

function createMatchFromLobby(lobby, guestId) {
  const host = clients.get(lobby.hostId);
  const guest = clients.get(guestId);
  if (!host || !guest) return false;
  if (host.ws.readyState !== host.ws.OPEN || guest.ws.readyState !== guest.ws.OPEN) return false;

  const matchId = randomUUID();
  const hostRole = normalizeRole(lobby.hostRole);
  const guestRole = oppositeRole(hostRole);

  matches.set(matchId, {
    id: matchId,
    hostId: lobby.hostId,
    players: [lobby.hostId, guestId],
    roleByClient: {
      [lobby.hostId]: hostRole,
      [guestId]: guestRole,
    },
  });

  host.matchId = matchId;
  guest.matchId = matchId;
  host.rolePreference = hostRole;
  guest.rolePreference = guestRole;

  safeSend(host.ws, {
    type: 'matched',
    matchId,
    role: hostRole,
    peerId: guestId,
    authoritativeRole: 'defender',
    host: true,
    playerLevel: Number(lobby.hostLevel || 1),
    opponentLevel: Number(guest.playerLevel || 1),
  });

  safeSend(guest.ws, {
    type: 'matched',
    matchId,
    role: guestRole,
    peerId: lobby.hostId,
    authoritativeRole: 'defender',
    host: false,
    playerLevel: Number(guest.playerLevel || 1),
    opponentLevel: Number(lobby.hostLevel || 1),
  });

  lobbies.delete(lobby.id);
  return true;
}

function relayToPeer(senderId, message) {
  const sender = clients.get(senderId);
  if (!sender?.matchId) return;

  const match = matches.get(sender.matchId);
  if (!match) return;

  const peerId = match.players.find((id) => id !== senderId);
  if (!peerId) return;

  const peer = clients.get(peerId);
  if (!peer) return;

  safeSend(peer.ws, message);
}

wss.on('connection', (ws) => {
  const clientId = randomUUID();
  clients.set(clientId, {
    id: clientId,
    ws,
    matchId: '',
    rolePreference: 'defender',
    browseRole: 'defender',
    playerLevel: 1,
    searching: false,
    searchingSince: 0,
  });

  safeSend(ws, getLobbyStatsPayload());
  sendLobbyList(clientId);
  broadcastLobbyStats();
  broadcastLobbyLists();

  ws.on('message', (raw) => {
    let message;
    try {
      message = JSON.parse(String(raw || '{}'));
    } catch {
      return;
    }

    const client = clients.get(clientId);
    if (!client) return;

    if (message.type === 'lobby_subscribe' || message.type === 'lobby_list_request') {
      client.browseRole = normalizeRole(message.rolePreference || client.browseRole || client.rolePreference);
      client.playerLevel = Math.max(1, Number(message.playerLevel || client.playerLevel || 1));
      sendLobbyList(clientId);
      safeSend(ws, getLobbyStatsPayload());
      return;
    }

    if (message.type === 'lobby_create') {
      const hostRole = normalizeRole(message.hostRole || client.rolePreference || 'defender');
      client.rolePreference = hostRole;
      client.playerLevel = Math.max(1, Number(message.playerLevel || client.playerLevel || 1));
      client.searching = true;
      client.searchingSince = Date.now();
      removeLobbyByHost(clientId);

      // Directly pair compatible searching clients, even if no lobby snapshot is available.
      const compatibleSearcher = Array.from(clients.values())
        .filter((entry) => entry.id !== clientId)
        .filter((entry) => entry.searching && !entry.matchId)
        .filter((entry) => entry.ws?.readyState === entry.ws?.OPEN)
        .filter((entry) => normalizeRole(entry.rolePreference) === oppositeRole(hostRole))
        .sort((a, b) => Number(a.searchingSince || 0) - Number(b.searchingSince || 0))[0];

      if (compatibleSearcher) {
        const hostClient = Number(compatibleSearcher.searchingSince || 0) <= Number(client.searchingSince || 0)
          ? compatibleSearcher
          : client;
        const guestClient = hostClient.id === client.id ? compatibleSearcher : client;
        const virtualLobby = {
          id: '',
          hostId: hostClient.id,
          hostRole: normalizeRole(hostClient.rolePreference || 'defender'),
          hostLevel: Math.max(1, Number(hostClient.playerLevel || 1)),
          createdAt: Date.now(),
          guestId: '',
        };

        const created = createMatchFromLobby(virtualLobby, guestClient.id);
        if (created) {
          client.searching = false;
          client.searchingSince = 0;
          compatibleSearcher.searching = false;
          compatibleSearcher.searchingSince = 0;
          removeLobbyByHost(client.id);
          removeLobbyByHost(compatibleSearcher.id);
          broadcastLobbyStats();
          broadcastLobbyLists();
          return;
        }
      }

      // If a compatible host is already waiting, immediately join and match.
      const compatibleLobby = Array.from(lobbies.values())
        .filter((lobby) => !lobby.guestId && lobby.hostId !== clientId && oppositeRole(lobby.hostRole) === hostRole)
        .sort((a, b) => a.createdAt - b.createdAt)[0];

      if (compatibleLobby) {
        const created = createMatchFromLobby(compatibleLobby, clientId);
        if (!created) {
          // Drop stale or invalid candidate and continue to create a fresh lobby below.
          lobbies.delete(compatibleLobby.id);
        }
        if (created) {
          const hostClient = clients.get(compatibleLobby.hostId);
          if (hostClient) {
            hostClient.searching = false;
            hostClient.searchingSince = 0;
          }
          client.searching = false;
          client.searchingSince = 0;
          broadcastLobbyStats();
          broadcastLobbyLists();
          return;
        }
      }

      const lobbyId = randomUUID();
      const lobby = {
        id: lobbyId,
        hostId: clientId,
        hostRole,
        hostLevel: client.playerLevel,
        createdAt: Date.now(),
        guestId: '',
      };
      lobbies.set(lobbyId, lobby);

      safeSend(ws, {
        type: 'lobby_created',
        lobby: serializeLobby(lobby),
      });

      broadcastLobbyStats();
      broadcastLobbyLists();
      return;
    }

    if (message.type === 'lobby_join') {
      const lobbyId = String(message.lobbyId || '');
      const lobby = lobbies.get(lobbyId);
      if (!lobby || lobby.hostId === clientId || lobby.guestId) {
        safeSend(ws, { type: 'lobby_join_failed', reason: 'Lobby unavailable.' });
        sendLobbyList(clientId);
        return;
      }

      const requestedRole = normalizeRole(message.rolePreference || client.rolePreference || 'defender');
      const neededRole = oppositeRole(lobby.hostRole);
      if (requestedRole !== neededRole) {
        safeSend(ws, { type: 'lobby_join_failed', reason: 'Role does not match this lobby.' });
        sendLobbyList(clientId);
        return;
      }

      client.rolePreference = requestedRole;
      client.playerLevel = Math.max(1, Number(message.playerLevel || client.playerLevel || 1));
      client.searching = true;

      const created = createMatchFromLobby(lobby, clientId);
      if (!created) {
        safeSend(ws, { type: 'lobby_join_failed', reason: 'Failed to join lobby.' });
        client.searching = false;
        client.searchingSince = 0;
      } else {
        const hostClient = clients.get(lobby.hostId);
        if (hostClient) {
          hostClient.searching = false;
          hostClient.searchingSince = 0;
        }
        client.searching = false;
        client.searchingSince = 0;
      }

      broadcastLobbyStats();
      broadcastLobbyLists();
      return;
    }

    if (message.type === 'lobby_leave' || message.type === 'queue_leave') {
      client.searching = false;
      client.searchingSince = 0;
      removeLobbyByHost(clientId);
      broadcastLobbyStats();
      broadcastLobbyLists();
      return;
    }

    if (message.type === 'lobby_stats_request') {
      safeSend(ws, getLobbyStatsPayload());
      return;
    }

    if (message.type === 'match_start') {
      const matchId = String(message.matchId || client.matchId || '');
      const match = matches.get(matchId);
      if (!match || match.hostId !== clientId) {
        return;
      }
      relayToPeer(clientId, {
        type: 'match_start',
        matchId,
        world: Number(message.world || 0),
        difficulty: String(message.difficulty || 'normal'),
        startedBy: clientId,
        startedAt: Date.now(),
      });
      return;
    }

    if (message.type === 'match_world_selected') {
      const matchId = String(message.matchId || client.matchId || '');
      const match = matches.get(matchId);
      if (!match || match.hostId !== clientId) {
        return;
      }
      relayToPeer(clientId, {
        type: 'match_world_selected',
        matchId,
        world: Number(message.world || 0),
        difficulty: String(message.difficulty || 'normal'),
        selectedBy: clientId,
        selectedAt: Date.now(),
      });
      return;
    }

    if (message.type === 'wave_start' || message.type === 'commander_spawn' || message.type === 'state_update') {
      relayToPeer(clientId, message);
    }
  });

  ws.on('close', () => {
    const client = clients.get(clientId);
    if (client) {
      client.searching = false;
      client.searchingSince = 0;
    }
    removeLobbyByHost(clientId);
    broadcastLobbyStats();
    broadcastLobbyLists();

    if (client?.matchId) {
      const match = matches.get(client.matchId);
      if (match) {
        const peerId = match.players.find((id) => id !== clientId);
        if (peerId) {
          const peer = clients.get(peerId);
          if (peer) {
            peer.matchId = '';
            safeSend(peer.ws, { type: 'peer_disconnected' });
          }
        }
        matches.delete(client.matchId);
      }
    }

    clients.delete(clientId);
    broadcastLobbyStats();
    broadcastLobbyLists();
  });
});

console.log('[matchmaker] running on ws://' + host + ':' + port);
