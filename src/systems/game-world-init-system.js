import Phaser from 'phaser';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  DEBUG_FLAGS,
} from './game-config-constants';
import { WORLDS } from './game-static-data';

export function initializeGameplayAfterWorldSelection(helpers = {}) {
  const { EmbossPipeline } = helpers;
    const isLandingAttractMode = typeof window !== 'undefined' && window.__landingAttractMode === true;
    this.teardownBlueprintOverlay();
    this.updateWorldOneSmokeState();
    this.applyWaveAtmosphereProfile(Math.max(1, this.gameState.wave || 1), true);

    // Persist selected world so refresh restores it
    try {
      if (!isLandingAttractMode) {
      sessionStorage.setItem('tdActiveWorld', JSON.stringify({
        worldIndex: this.gameState.selectedWorldIndex,
        difficulty: this.gameState.selectedDifficulty || 'normal',
        selectedMode: this.gameState.selectedMode === 'vsAiDefense' || this.gameState.selectedMode === 'vsAiAttack'
          ? this.gameState.selectedMode
          : (this.gameState.selectedMode === 'multiplayer' ? 'multiplayer' : 'singleplayer'),
        multiplayerRole: this.gameState.multiplayerRole === 'defender' ? 'defender' : 'enemyCommander',
        multiplayerVariant: this.gameState.multiplayerVariant === 'ai'
          ? 'ai'
          : (this.gameState.multiplayerVariant === 'nearby' ? 'nearby' : 'online'),
        wave: Math.max(1, Number(this.gameState.wave || 1)),
        level: Math.max(1, Number(this.gameState.level || this.gameState.wave || 1)),
      }));
      }
    } catch (_) {}

    this._terrainSampleData = null; // clear terrain cache for new world

    // First, clear any remaining splash screen elements
    const childrenToRemove = [];
    this.children.list.forEach((child) => {
      if (child && child.depth >= 999) {
        childrenToRemove.push(child);
      }
    });
    childrenToRemove.forEach((child) => child.destroy());

    // Apply difficulty settings
    const diff = this.getDifficultyConfig();
    if (!DEBUG_FLAGS.overpowerForWaveTesting) {
      this.gameState.gold  = DEBUG_FLAGS.extraGoldForTesting
        ? Math.max(diff.startGold, Number(DEBUG_FLAGS.testingStartingGold) || 0)
        : diff.startGold;
      this.gameState.lives = isLandingAttractMode ? 9999 : diff.lives;
    }

    // Apply the selected world's path and fortress layout
    this.applyPathLayoutForWave(1, false);
    this.applyFortressLayoutForWave(1);
    
    // Continue with the rest of game initialization
    this.enemyCount = 0;
    this.enemiesSpawned = 0;
    this.enemiesResolved = 0;
    this.enemiesDefeated = 0;
    this.enemyVariantIndex = 0;
    this.planeVariantIndex = 0;

    this.drawBackdrop();
    this.drawPath();
    this.drawTowerBases();

    if (this.cameras?.main) {
      this.cameras.main.setZoom(1);
      this.cameras.main.centerOn(BOARD_WIDTH * 0.5, BOARD_HEIGHT * 0.5);
    }
    
    this.setupUI();
    if (isLandingAttractMode) {
      this.lightningTestingBypassWindow = true;
      this.refreshLightningBlobControl?.();
    }
    this.setupFireDebugOverlay();
    this.setupPlacementPreview();
    this.setupBuildPhaseControls();
    this.initializeMultiplayerMode();
    this.syncMultiplayerCommanderVisibility?.();
    this.updateWeaponUnlockState?.({ silent: true });

    const restoredBlueprintState = this.restoreBlueprintRuntimeState();
    if (restoredBlueprintState) {
      this.updateWeaponUnlockState({ silent: true });
      this.updateHud();
    }
    
    if (DEBUG_FLAGS.autoFillTestTowers) {
      this.populateTestTowerLoadout();
    }

    this.playSettingsThemeMusic();

    if (DEBUG_FLAGS.fireTestMode || (DEBUG_FLAGS.tower1TestWeaponId && DEBUG_FLAGS.tower1TestWeaponId > 0)) {
      this.setupWeaponFireTestRig();
    }

    this.initShotSoundPools();

    if (isLandingAttractMode) {
      this.setStatus('', '#89ffd0');
      this.time.delayedCall(120, () => {
        if (!this.gameState?.gameOver) {
          window.parent?.postMessage?.('blastova-game-ready', '*');
          this.startWave();
        }
      });
    } else {
      const worldName = WORLDS[this.gameState.selectedWorldIndex]?.name || 'Unknown World';
      this.setStatus('Ready for battle! Wave starts in 8s.', '#89ffd0');
      this.time.delayedCall(800, () => this.startWaveCountdown(8));
      window.__blastovaOnboarding?.notify('gameplay-ready');
    }

    if (this.renderer?.type === Phaser.WEBGL && typeof EmbossPipeline === 'function') {
      try {
        this.renderer.addPipeline('EmbossEffect', new EmbossPipeline(this.game));
      } catch (_) {}
    }

    if (this.routeTwoEntranceImg) {
      try { this.routeTwoEntranceImg.resetPipeline(); } catch (_) {}
    }

    // Register physics overlaps here so they're set up regardless of
    // whether the game was launched fresh or restored from sessionStorage.
    this.physics.add.overlap(this.projectiles, this.enemies, this.projectileHit, null, this);
    this.physics.add.overlap(this.enemyProjectiles, this.towers, this.enemyProjectileHitTower, null, this);
}
