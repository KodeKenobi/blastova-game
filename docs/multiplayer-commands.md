# Multiplayer Commands Runbook

All commands below are run from:

```bash
cd "/Users/mac/Desktop/Personal Work/PC/blastova-game"
```

## 1) First-time setup

```bash
npm install
```

## 2) Run game locally (for two browser clients)

Run renderer only so you can open multiple tabs/devices:

```bash
npm run dev:renderer -- --host 0.0.0.0 --port 5173
```

Open clients:

- Client A: `http://127.0.0.1:5173`
- Client B: `http://127.0.0.1:5173`

If second device is on LAN:

```bash
ipconfig getifaddr en0
```

Then open `http://<YOUR_LAN_IP>:5173` on the second device.

## 3) Deploy/redeploy matchmaking server to Railway

Login (only when needed):

```bash
railway login
```

Deploy server payload only:

```bash
railway up ./server --path-as-root -y --project 2e361a2e-e7c7-4d6e-8c22-d89201fa6f25 --environment 1dcbeb56-5bb3-4685-a10e-00e6d8853fe0 --service fa0031f5-d596-4fad-9d0d-41ffbf9d3bbf
```

## 4) Check Railway status/logs

Project/service status:

```bash
railway status --json
```

Service logs:

```bash
railway logs --project 2e361a2e-e7c7-4d6e-8c22-d89201fa6f25 --environment 1dcbeb56-5bb3-4685-a10e-00e6d8853fe0 --service fa0031f5-d596-4fad-9d0d-41ffbf9d3bbf
```

## 5) Domain commands

Create service domain (run once):

```bash
railway domain --project 2e361a2e-e7c7-4d6e-8c22-d89201fa6f25 --environment 1dcbeb56-5bb3-4685-a10e-00e6d8853fe0 --service fa0031f5-d596-4fad-9d0d-41ffbf9d3bbf
```

Check domain state:

```bash
railway domain status 3eea2f31-526b-4e04-828f-9fae21be4d30
```

Live endpoint used by game:

```text
wss://blastova-matchmaker-production.up.railway.app
```

## 6) Multiplayer test flow (new UX)

1. Open world select.
2. Choose Multiplayer.
3. Click a world card.
4. In the queue modal:
   - See online/waiting counts.
   - Choose role (Play Defend or Play Attack).
   - Click Find Match.
5. When matched:
   - Host sees Start Match enabled.
   - Host clicks Start Match.
   - Both clients launch into the same match.

## 7) Common command mistakes

Wrong (causes `exit 126`):

```bash
"/Users/mac/Desktop/Personal Work/PC/blastova-game" && railway up ...
```

Correct:

```bash
cd "/Users/mac/Desktop/Personal Work/PC/blastova-game" && railway up ...
```

## 8) Optional reset if browser had stale matchmaking flags

```js
localStorage.removeItem('blastova.onlineMatchmaking.enabled');
```

Then refresh the page.
