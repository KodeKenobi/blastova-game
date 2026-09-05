import { commanderXpForLevel } from './game-core-utils';
import {
  countClearedByTier as countCommanderClearedByTier,
  earnCommanderXP as earnCommanderXPProgress,
  getCommanderDisplayName as getCommanderDisplayNameFromStorage,
  isWorldUnlocked as isCommanderWorldUnlocked,
  loadCommanderLeaderboard as loadCommanderLeaderboardFromStorage,
  loadCommanderData as loadCommanderDataFromStorage,
  recordCommanderLeaderboardEntry as recordCommanderLeaderboardEntryFromStorage,
  recordWorldCleared as recordCommanderWorldCleared,
  saveCommanderData as saveCommanderDataToStorage,
  ONLINE_EXCLUSIVE_WEAPON_IDS,
  ONLINE_WEAPON_UNLOCK_TRIGGERS,
} from './commander-progress-system';
import { WORLDS } from './game-static-data';

function resetGlobalUiInteractivity() {
  try {
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.style.visibility = 'visible';
      gameContainer.style.pointerEvents = 'auto';
    }

    if (document?.body?.style) {
      document.body.style.pointerEvents = 'auto';
    }

    const settingsOverlay = document.getElementById('settings-overlay');
    if (settingsOverlay) {
      settingsOverlay.style.display = 'none';
      settingsOverlay.style.pointerEvents = 'auto';
    }

    const worldSelectOverlay = document.getElementById('world-select-overlay');
    if (worldSelectOverlay) {
      worldSelectOverlay.style.pointerEvents = 'auto';
    }

    const waveClearRoots = document.querySelectorAll('[data-wave-clear-root]');
    waveClearRoots.forEach((node) => {
      node.style.pointerEvents = 'none';
      node.style.display = 'none';
    });

    const upgradeModal = document.getElementById('upgrade-modal-root');
    if (upgradeModal?.parentNode) {
      upgradeModal.parentNode.removeChild(upgradeModal);
    }
  } catch (_) {}
}

export function returnToWorldSelectFromHud() {
  resetGlobalUiInteractivity();
  try {
    sessionStorage.removeItem('tdActiveWorld');
  } catch (_) {}
  try {
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.style.visibility = 'hidden';
    }
  } catch (_) {}
  if (this.hudStaticTexts) {
    this.hudStaticTexts.forEach((el) => el?.setVisible(false));
  }
  this.setPhaserTopHudVisible(false);
  if (typeof window.__setHtmlTrayVisible === 'function') {
    window.__setHtmlTrayVisible(false);
  }
  if (this.htmlHudRoot?.isConnected) {
    this.htmlHudRoot.remove();
  }
  this.teardownHtmlHudOverlay();
  this.teardownBlueprintOverlay();
  this.audioSettingsPointerGuard = false;
  this.audioSettingsActiveDrag = null;
  if (this.battleThemeMusic?.isPlaying) this.battleThemeMusic.stop();
  if (this.settingsThemeMusic?.isPlaying) this.settingsThemeMusic.stop();

  // Fully kill the game — destroy all entities, stop all timers and tweens
  if (this.gameState) {
    this.gameState.gameOver = true;
    this.gameState.prepPhase = false;
  }
  try { this.enemies?.clear(true, true); } catch (_) {}
  try { this.towers?.clear(true, true); } catch (_) {}
  try { this.projectiles?.clear(true, true); } catch (_) {}
  try { this.tweens?.killAll(); } catch (_) {}
  try { this.time?.removeAllEvents(); } catch (_) {}
  try { this.sound?.stopAll(); } catch (_) {}

  try {
    if (this.input) {
      this.input.enabled = true;
    }
  } catch (_) {}

  window.__blastovaOnboarding?.notify('session-mode');

  // Quitting from an active match goes straight to the world grid, not the mode-select screen.
  this.showWorldSelectionSplashScreen(true);
}

export function loadCommanderData() {
  return loadCommanderDataFromStorage(window?.localStorage);
}

export function saveCommanderData(data) {
  saveCommanderDataToStorage(data, window?.localStorage);
  // Sync to Supabase if signed in — fire and forget.
  const userId = window.__supabaseUserId;
  if (userId) {
    import('./game-supabase-auth-system.js').then(({ saveProfileToSupabase }) => {
      saveProfileToSupabase(userId, {
        ...data,
        weaponUpgradeLevels: this?.gameState?.weaponUpgradeLevels || {},
      }).catch(() => {});
    }).catch(() => {});
  }
}

export function getCommanderDisplayName() {
  const data = this.loadCommanderData();
  return getCommanderDisplayNameFromStorage(data);
}

export function loadCommanderLeaderboard() {
  return loadCommanderLeaderboardFromStorage(window?.localStorage);
}

export function recordCommanderLeaderboardEntry(score) {
  const data = this.loadCommanderData();
  return recordCommanderLeaderboardEntryFromStorage(data, score, window?.localStorage);
}

export function earnCommanderXP(amount) {
  const data = this.loadCommanderData();
  const updated = earnCommanderXPProgress({
    data,
    amount,
    xpForLevel: commanderXpForLevel,
    onLevelUp: (level) => {
      this.setStatus('⭐ Commander Level ' + level + '! Keep pushing.', '#ffd700');
    },
  });
  this.saveCommanderData(updated);
  return updated;
}

export function recordWorldCleared(worldId) {
  const data = this.loadCommanderData();
  const updated = recordCommanderWorldCleared(data, worldId);
  this.saveCommanderData(updated);
  return updated;
}

export function countClearedByTier(tier) {
  const data = this.loadCommanderData();
  return countCommanderClearedByTier(tier, WORLDS, data.worldsCleared);
}

export function isWorldUnlocked(world) {
  const data = this.loadCommanderData();
  return isCommanderWorldUnlocked(world, WORLDS, data.worldsCleared);
}

export function isOnlineWeaponUnlocked(weaponId) {
  const data = this.loadCommanderData();
  return Array.isArray(data?.onlineUnlocks?.weaponsGranted)
    && data.onlineUnlocks.weaponsGranted.includes(Number(weaponId));
}

// Called at the end of any online wave (as defender). Evaluates all triggers and
// returns an array of weapon defs that were newly unlocked this call (may be empty).
export function checkOnlineWeaponUnlocks(options = {}) {
  const { gamePlayed = false, waveSurvived = 0, matchWon = false } = options;
  if (this.isMultiplayerEnemyCommanderRole?.()) return [];

  const data = this.loadCommanderData();
  const ou = data.onlineUnlocks || { gamesPlayed: 0, wins: 0, maxWaveSurvived: 0, weaponsGranted: [] };

  if (gamePlayed)   ou.gamesPlayed   = (ou.gamesPlayed || 0) + 1;
  if (matchWon)     ou.wins          = (ou.wins || 0) + 1;
  if (waveSurvived) ou.maxWaveSurvived = Math.max(ou.maxWaveSurvived || 0, waveSurvived);

  ou.weaponsGranted = Array.isArray(ou.weaponsGranted) ? ou.weaponsGranted.map(Number) : [];

  const newlyGranted = [];
  ONLINE_WEAPON_UNLOCK_TRIGGERS.forEach(({ weaponId, condition }) => {
    if (ou.weaponsGranted.includes(weaponId)) return;
    let earned = false;
    if (condition === 'game_played'    && ou.gamesPlayed >= 1)      earned = true;
    if (condition === 'wave5_survived' && ou.maxWaveSurvived >= 5)  earned = true;
    if (condition === 'match_won'      && ou.wins >= 1)             earned = true;
    if (condition === 'wins3'          && ou.wins >= 3)             earned = true;
    if (earned) {
      ou.weaponsGranted.push(weaponId);
      newlyGranted.push(weaponId);
    }
  });

  data.onlineUnlocks = ou;
  this.saveCommanderData(data);

  if (!newlyGranted.length) return [];

  return newlyGranted.map((id) =>
    (this.towerCatalog || []).find((def) => def.id === id) || null
  ).filter(Boolean);
}