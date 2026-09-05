import {
  DEBUG_FLAGS,
  DEFAULT_WEAPON_BUILD_COST,
} from './game-config-constants';
import {
  FORTRESS_LAYOUT_TEMPLATES,
  PATH_LAYOUT_TEMPLATES,
} from './game-layout-data';
import {
  WEAPON_LIBRARY,
  WEAPON_SHOT_SOUND_PROFILE,
  WEAPON_VFX_TABLE,
} from './game-weapon-data';
import { getWeaponBuildCost } from './game-core-utils';

export function createScene() {
    this.cameras.main.setRoundPixels(true);
    if (this.input) {
      this.input.enabled = true;
      if (this.input.mouse) {
        this.input.mouse.enabled = true;
      }
    }
    this.createTextures();
    this.createTerrainSubtextures(0);
    this.ensureLightningSpriteAnimations();

    // Hide the HTML settings overlay from world select screen - use Phaser panel instead
    const settingsOverlay = document.getElementById('settings-overlay');
    if (settingsOverlay) {
      settingsOverlay.style.display = 'none';
    }

    this.gameState = {
      gold: DEBUG_FLAGS.overpowerForWaveTesting ? 99999 : 150,
      lives: DEBUG_FLAGS.overpowerForWaveTesting ? 250 : 20,
      level: 1,
      wave: 1,
      playerLevel: DEBUG_FLAGS.developerUnlocksMaxed ? 99 : 1,
      score: 0,
      techParts: 0,
      prepPhase: true,
      gameOver: false,
      selectedWorldIndex: 0,
      selectedDifficulty: 'normal',
      selectedMode: 'singleplayer',
      multiplayerRole: 'enemyCommander',
      multiplayerVariant: 'nearby',
      weaponUpgradeLevels: {},
    };

    this.towers = this.physics.add.group();
    this.enemies = this.physics.add.group();
    this.projectiles = this.physics.add.group();
    this.enemyProjectiles = this.physics.add.group();
    this.activePathLayoutIndex = 0;
    this.activePathLayoutId = PATH_LAYOUT_TEMPLATES[0].id;
    this.activePathLayoutName = PATH_LAYOUT_TEMPLATES[0].name;
    this.activeFortressLayoutIndex = 0;
    this.activeFortressLayoutId = FORTRESS_LAYOUT_TEMPLATES[0].id;
    this.activeFortressLayoutName = FORTRESS_LAYOUT_TEMPLATES[0].name;
    
    this.enemyCount = 0;
    this.enemiesSpawned = 0;
    this.enemiesResolved = 0;
    this.enemiesDefeated = 0;
    this.enemyDefeatStats = {
      soldier: 0,
      tank: 0,
      plane: 0,
    };
    this.nextEnemyTime = 0;
    this.enemyVariantIndex = 0;
    this.planeVariantIndex = 0;
    this.draggingFromTray = false;
    this.trayTowers = [];
    this.activeTrayTowerDef = null;
    this.selectedTowerDef = null;
    this.weaponHudCards = [];
    this.weaponCarouselIndex = 0;
    this.weaponCarouselPrev = null;
    this.battleThemeMusic = null;
    this.settingsThemeMusic = null;
    this.tankEngineLoop = null;
    this.activeThemeMusicMode = 'none';
    this.weaponCarouselNext = null;
    this.weaponInfoText = null;
    this.weaponDetailPanel = null;
    this.weaponDetailImage = null;
    this.weaponDetailTitle = null;
    this.weaponDetailRole = null;
    this.weaponDetailStats = null;
    this.weaponDetailFlavor = null;
    this.weaponDetailBadge = null;
    this.weaponPreviewRing = null;
    this.weaponPreviewHalo = null;
    this.weaponPreviewLabel = null;
    this.selectedPlacedTower = null;
    this.removeTowerButton = null;
    this.removeTowerButtonLabel = null;
    this.weaponPreviewCenterY = 0;
    this.fireDebugOverlayText = null;
    this.fireDebugOverlayEnabled = false;
    this.fireDebugShots = [];
    this.fireDebugLastTowerId = null;
    this.fireDebugLastTargetArmor = null;
    this.blueprintWeaponRuntimeStateByName = new Map();
    this.deterministicWeaponLoopEvent = null;
    this.deterministicWeaponLoopIndex = 0;
    this.configureFortressLayout();
    if (this.isFreePlacementEnabled()) {
      this.activeFortressLayoutIndex = -1;
      this.activeFortressLayoutId = 'free-placement';
      this.activeFortressLayoutName = 'Free Placement';
      this.towerStructures = [];
      this.towerBaseSlots = [];
    }
    this.towerCatalog = WEAPON_LIBRARY.map((weapon) => {
      const boosted = !!DEBUG_FLAGS.overpowerForWaveTesting;
      const damageMult = boosted ? 4.4 : 1;
      const rangeMult = boosted ? 1.42 : 1;
      const fireRateScale = boosted ? 0.42 : 1;
      const reloadScale = boosted ? 0.38 : 1;
      const speedMult = boosted ? 1.35 : 1;
      const splashMult = boosted ? 1.4 : 1;

      const shotSfx = WEAPON_SHOT_SOUND_PROFILE[weapon.id] || WEAPON_SHOT_SOUND_PROFILE[1];
      const baseDamage = weapon.damage || 0;
      const powerTier = this.getWeaponPowerTierInfo(baseDamage);
      return {
      id: weapon.id,
      key: weapon.textureKey,
      previewKey: weapon.textureKey + 'Preview',
      name: weapon.name,
      cost: boosted ? 1 : getWeaponBuildCost(weapon, DEFAULT_WEAPON_BUILD_COST),
      range: weapon.range * rangeMult,
      fireRate: Math.max(90, Math.round(weapon.fireRate * fireRateScale)),
      magSize: weapon.magSize,
      reloadTime: Math.max(220, Math.round(weapon.reloadTime * reloadScale)),
      damage: weapon.damage * damageMult,
      baseDamage,
      powerTierKey: powerTier.key,
      powerTierLabel: powerTier.label,
      firePattern: weapon.firePattern,
      burstCount: weapon.burstCount,
      burstSpacing: weapon.burstSpacing,
      spreadAngles: weapon.spreadAngles,
      barrelSpacing: weapon.barrelSpacing,
      projectileSpeed: weapon.projectileSpeed * speedMult,
      projectileScale: weapon.projectileScale,
      armorPen: boosted ? (weapon.armorPen * 2.6) : weapon.armorPen,
      lightBonus: boosted ? Math.max(weapon.lightBonus || 1, (weapon.lightBonus || 1) * 1.35) : weapon.lightBonus,
      heavyBonus: boosted ? Math.max(weapon.heavyBonus || 1, (weapon.heavyBonus || 1) * 1.65) : weapon.heavyBonus,
      slowAmount: boosted ? Math.min(0.82, (weapon.slowAmount || 0.22) + 0.28) : weapon.slowAmount,
      slowDuration: boosted ? Math.max(weapon.slowDuration || 0, Math.round((weapon.slowDuration || 700) * 1.7)) : weapon.slowDuration,
      splashRadius: weapon.splashRadius ? weapon.splashRadius * splashMult : weapon.splashRadius,
      splashDamageFactor: boosted && weapon.splashDamageFactor ? Math.min(1.8, weapon.splashDamageFactor * 1.5) : weapon.splashDamageFactor,
      targetPreference: weapon.targetPreference,
      fireAnimSheet: weapon.fireAnimSheet,
      fireAnimKey: weapon.fireAnimKey,
      moduleIntegrity: boosted ? Math.max(3, (weapon.moduleIntegrity || 0) + 2) : weapon.moduleIntegrity,
      unlockLevel: weapon.unlockLevel || (weapon.id <= 3 ? 1 : weapon.id - 1),
      role: weapon.role,
      description: weapon.description,
      rocketCount: boosted && weapon.firePattern === 'rocket' ? (weapon.rocketCount || 6) + 4 : weapon.rocketCount,
      rocketInterval: boosted && weapon.firePattern === 'rocket' ? Math.max(26, Math.round((weapon.rocketInterval || 55) * 0.58)) : weapon.rocketInterval,
      rocketSplashRadius: boosted && weapon.rocketSplashRadius ? weapon.rocketSplashRadius * splashMult : weapon.rocketSplashRadius,
      rocketSplashDamageFactor: boosted && weapon.rocketSplashDamageFactor ? Math.min(1.5, weapon.rocketSplashDamageFactor * 1.38) : weapon.rocketSplashDamageFactor,
      barrelOffsets: weapon.barrelOffsets,
      barrelLateralOffsets: weapon.barrelLateralOffsets,
      barrelForwardOffset: weapon.barrelForwardOffset,
      towerArmor: boosted ? Math.max(1.6, (weapon.towerArmor || 0.3) + 0.95) : weapon.towerArmor,
      assetPath: weapon.assetPath || '',
      vfxProfile: {
        ...(WEAPON_VFX_TABLE[weapon.vfxProfileId || weapon.id] || WEAPON_VFX_TABLE[1]),
        shotSfxKey: shotSfx.key,
        shotSfxRate: shotSfx.rate,
        shotSfxVolume: shotSfx.volume,
      },
      };
    });
    this.selectedTowerDef = this.towerCatalog[0] || null;
    window.WEAPON_LIBRARY_MAP = Object.fromEntries(WEAPON_LIBRARY.map((w) => [w.id, w]));
    this.startWaveButton = null;
    this.startWaveButtonLabel = null;
    this.waveCountdownText = null;
    this.waveTransitionSplash = null;
    this.waveTransitionConfettiFx = null;
    this.hudPanel = null;
    this.trayBackground = null;
    this.hudStaticTexts = [];
    this.playerLevelText = null;
    this.activeVisualTheme = null;
    this.lakeShimmers = [];
    this.mapLayer = null;
    this.lightningLandmarkSprite = null;
    this.activeTerrainRow = -1;
    this.lastSynthShotAt = -9999;
    this.lastExplosionSfxAt = -9999;
    this.lastEliteDeathGroanAt = -9999;
    this.lastPlaneSfxAt = -9999;
    this.lastAnnouncedBarrageTag = null;
    this.barrageLightningWindowOpen = false;
    this.barrageNearLightningTower = false;
    this.lightningTestingBypassWindow = false;
    this.audioSettings = null;
    this.audioSettingsRows = [];
    this.audioSettingsPanel = null;
    this.audioSettingsButton = null;
    this.audioSettingsButtonLabel = null;
    this.showPathGuide = false;
    this.routeGuideTogglePanel = null;
    this.routeGuideToggleButton = null;
    this.routeGuideToggleLabel = null;
    this.audioSettingsGearShape = null;
    this.audioSettingsGearCore = null;
    this.pauseHudButton = null;
    this.pauseHudButtonLabel = null;
    this.restartHudButton = null;
    this.restartHudButtonLabel = null;
    this.audioSettingsPointerGuard = false;
    this.audioSettingsActiveDrag = null;
    this.audioSettingsDragHandlersBound = false;
    this.gameplayPausedByPlayer = false;
    this.gameplayPausedBySettings = false;
    this.gameplayPausedByBlueprint = false;
    this.playerPauseStateBeforeSettingsOpen = false;
    this.gameplayPauseActive = false;
    this.gameplayPauseStartedAt = 0;
    this.useHtmlHudOverlay = true;
    this.useHtmlWeaponTray = true;
    this.htmlWeaponTrayRoot = null;
    this.htmlHudRoot = null;
    this.htmlHudOverlayNode = null;
    this.htmlHudValues = null;
    this.htmlHudPauseButton = null;
    this.htmlWaveClearRoot = null;
    this.htmlWaveClearOverlayNode = null;
    this.htmlWaveClearElements = null;
    this.htmlWaveClearMountPromise = null;
    this.htmlMultiplayerRoot = null;
    this.htmlMultiplayerOverlayNode = null;
    this.htmlMultiplayerValues = null;
    this.htmlMultiplayerResizeHandler = null;
    this.htmlMultiplayerScaleResizeHandler = null;
    this.nextMultiplayerHudUpdateAt = 0;
    this.playerLightningCooldownMs = 3000;
    this.playerLightningReadyAt = 0;
    this.nextLightningControlRefreshAt = 0;
    this.lightningBlobCore = null;
    this.lightningBlobOuter = null;
    this.lightningBlobPulse = null;
    this.lightningBlobLabel = null;
    this.lightningBlobIcon = null;
    this.lightningBlobHitZone = null;
    this.lightningBlobPulseTween = null;
    this.htmlHudResizeHandler = null;
    this.htmlHudScaleResizeHandler = null;
    this.phaserTopHudElements = [];
    this.useBlueprintOverlay = true;
    this.blueprintOverlayRoot = null;
    this.blueprintOverlayVisible = false;
    this.blueprintOverlayMountPending = false;
    this.blueprintOverlayPendingOpen = null;
    this.blueprintChevronButton = null;
    this.blueprintChevronLabel = null;
    this.worldOneSmokeRoot = null;
    this.worldOneSmokeRenderer = null;
    this.worldOneSmokeScene = null;
    this.worldOneSmokeCamera = null;
    this.worldOneSmokeSprites = [];
    this.worldOneSmokeElapsed = 0;
    this.worldOneSmokeBounds = { width: 0, height: 0 };
    this.worldOneSmokeResizeHandler = null;
    this.worldOneSmokeScaleResizeHandler = null;
    this.worldOneAtmosphereConfig = null;
    this.worldOneAtmosphereCurrent = null;
    this.worldOneAtmosphereTarget = null;
    this.worldOneAtmosphereLerp = null;
    this.worldOneAtmosphereKey = null;
    this.lightningProtectionOverlays = [];
    this.waveDamageDealt = 0;
    this.waveSuppliesEarned = 0;
    this.testPreviewSoldiers = [];
    this.testPreviewAnimLoopEvent = null;

    this.events.once('shutdown', this.destroyWorldOneSmoke, this);
    this.events.once('destroy', this.destroyWorldOneSmoke, this);
    this.events.once('shutdown', this.destroyLightningProtectionOverlays, this);
    this.events.once('destroy', this.destroyLightningProtectionOverlays, this);
    this.events.once('shutdown', this.teardownHtmlHudOverlay, this);
    this.events.once('destroy', this.teardownHtmlHudOverlay, this);
    this.events.once('shutdown', this.teardownMultiplayerCommanderOverlay, this);
    this.events.once('destroy', this.teardownMultiplayerCommanderOverlay, this);

    this.initAudioSettings();
    try {
      const gp = typeof this.loadGameplaySettings === 'function'
        ? this.loadGameplaySettings()
        : {};
      const allowPathGuide = typeof this.isPathGuideFeatureAvailable === 'function'
        ? this.isPathGuideFeatureAvailable()
        : false;
      this.showPathGuide = allowPathGuide && gp?.showPathGuide === true;
    } catch (_) {
      this.showPathGuide = false;
    }

    this.ensureAudioReady(false);
    if (this.input) {
      this.input.once('pointerdown', () => {
        this.ensureAudioReady(true);
        if (!this.gameState?.prepPhase && !this.gameState?.gameOver && !this.gameplayPauseActive) {
          this.playBattleThemeMusic();
        }
      });
      this.input.keyboard?.once('keydown', () => this.ensureAudioReady(true));
    }

    this.updateTerrainThemeAssets();

    // Always expose scene hook so HTML overlays can access audio/settings
    if (typeof window !== 'undefined') {
      window.__tdScene = this;
      window.__spawnSoldierPreview = () => window.__tdScene?.setupSoldierVisibilityTestRig?.();
      window.__clearSoldierPreview = () => window.__tdScene?.clearSoldierVisibilityTestRig?.();
      window.__runSingleSoldierPathTest = () => window.__tdScene?.startSingleSoldierPathTest?.();
    }

    const isLandingAttractMode = typeof window !== 'undefined' && window.__landingAttractMode === true;
    if (isLandingAttractMode) {
      if (typeof window.__dismissSplash === 'function') {
        window.__dismissSplash();
      }
      this.gameState.selectedWorldIndex = 0;
      this.gameState.selectedDifficulty = 'normal';
      this.gameState.selectedMode = 'singleplayer';
      this.gameState.multiplayerRole = 'defender';
      this.gameState.wave = 1;
      this.gameState.level = 1;
      this.gameState.gameOver = false;
      this.initializeGameplayAfterWorldSelection();
      return;
    }

    // Check if user was mid-game before refresh — restore directly
    try {
      const saved = sessionStorage.getItem('tdActiveWorld');
      if (saved) {
        const { worldIndex, difficulty, selectedMode, multiplayerRole, multiplayerVariant, wave, level, playerLevel } = JSON.parse(saved);
        sessionStorage.removeItem('tdActiveWorld');
        this.gameState.selectedWorldIndex = Math.max(0, Math.floor(Number(worldIndex) || 0));
        this.gameState.selectedDifficulty = difficulty ?? 'normal';
        const isLegacyAiMode = selectedMode === 'vsAi'
          || (selectedMode === 'multiplayer' && multiplayerVariant === 'ai');
        this.gameState.selectedMode = selectedMode === 'vsAiAttack'
          || (isLegacyAiMode && multiplayerRole === 'enemyCommander')
          ? 'vsAiAttack'
          : (selectedMode === 'vsAiDefense' || isLegacyAiMode
            ? 'vsAiDefense'
            : (selectedMode === 'multiplayer' ? 'multiplayer' : 'singleplayer'));
        this.gameState.multiplayerRole = multiplayerRole === 'defender' ? 'defender' : 'enemyCommander';
        this.gameState.multiplayerVariant = multiplayerVariant === 'ai'
          ? 'ai'
          : (multiplayerVariant === 'nearby' ? 'nearby' : 'online');
        this.gameState.wave = Math.max(1, Number(wave || 1));
        this.gameState.level = Math.max(1, Number(level || wave || this.gameState.wave || 1));
        this.gameState.playerLevel = Math.max(1, Number(playerLevel || this.gameState.playerLevel || 1));
        if (typeof window.__dismissSplash === 'function') window.__dismissSplash();
        this.initializeGameplayAfterWorldSelection();
        return;
      }
    } catch (_) {}

    // No saved session — show landing page
    this.showWorldSelectionSplashScreen();
    console.log('World selection screen shown');
    this.setupDebugHotkeys();
    if (DEBUG_FLAGS.autoStartWave) {
      this.time.delayedCall(1200, () => {
        if (this.gameState && this.gameState.prepPhase) {
          this.beginCombatPhase();
        }
      });
    }
    this.createEnemyAnimations();
    this.createWeaponAnimations();
}
