export function syncGameplayPauseState() {
  const shouldPause = !!(this.gameplayPausedByPlayer || this.gameplayPausedBySettings || this.gameplayPausedByBlueprint);

  if (shouldPause && !this.gameplayPauseActive) {
    this.gameplayPauseActive = true;
    this.gameplayPauseStartedAt = this.time.now;
    this.physics?.world?.pause();
    this.stopThemeMusic();
    this.updatePauseHudButton();
    return;
  }

  if (!shouldPause && this.gameplayPauseActive) {
    const pausedFor = Math.max(0, this.time.now - this.gameplayPauseStartedAt);
    this.gameplayPauseActive = false;
    this.gameplayPauseStartedAt = 0;
    this.physics?.world?.resume();

    if (typeof this.nextEnemyTime === 'number') {
      this.nextEnemyTime += pausedFor;
    }
    if (this.lastSpawnMeta && typeof this.lastSpawnMeta.spawnTime === 'number') {
      this.lastSpawnMeta.spawnTime += pausedFor;
    }

    if (!this.gameState?.prepPhase && !this.gameState?.gameOver) {
      this.playBattleThemeMusic();
    } else {
      this.stopThemeMusic();
    }
  }

  this.updatePauseHudButton();
}

export function updatePauseHudButton() {
  const isLandingAttractMode = typeof window !== 'undefined' && window.__landingAttractMode === true;

  if (isLandingAttractMode) {
    if (this.pauseHudButton) {
      this.pauseHudButton.setVisible(false);
      this.pauseHudButton.disableInteractive?.();
    }
    if (this.pauseHudButtonLabel) {
      this.pauseHudButtonLabel.setVisible(false);
      this.pauseHudButtonLabel.disableInteractive?.();
      this.pauseHudButtonLabel.setText('');
    }
    if (this.htmlHudPauseButton) {
      this.htmlHudPauseButton.style.display = 'none';
      this.htmlHudPauseButton.textContent = '';
      this.htmlHudPauseButton.className = this.htmlHudPauseButton.className.replace(/\bstart-wave\b|\bwave-active\b/g, '');
    }
    return;
  }

  if (!this.pauseHudButton || !this.pauseHudButtonLabel) {
    return;
  }

  const isAttackPrep = !!this.isMultiplayerEnemyCommanderRole?.() && !!this.gameState?.prepPhase && !this.gameState?.gameOver;
  const paused = !!this.gameplayPauseActive;
  this.pauseHudButton.setFillStyle(paused ? 0x614a17 : 0x19364e, 0.96);
  this.pauseHudButton.setStrokeStyle(1, paused ? 0xf0ce74 : 0x6cb8e0, 0.85);
  this.pauseHudButtonLabel.setText(isAttackPrep ? '' : (paused ? 'RESUME' : 'PAUSE'));
  this.pauseHudButtonLabel.setColor(paused ? '#fff0bf' : '#def4ff');
  this.pauseHudButton.setVisible(!isAttackPrep);
  this.pauseHudButtonLabel.setVisible(!isAttackPrep);
  if (isAttackPrep) {
    this.pauseHudButton.disableInteractive();
  } else {
    this.pauseHudButton.setInteractive({ useHandCursor: true });
  }

  if (this.htmlHudPauseButton) {
    const inPrep = !!this.gameState?.prepPhase && !this.gameState?.gameOver;
    const paused = !!this.gameplayPauseActive;
    if (isAttackPrep) {
      this.htmlHudPauseButton.style.display = 'none';
      this.htmlHudPauseButton.textContent = '';
      this.htmlHudPauseButton.className = this.htmlHudPauseButton.className.replace(/\bstart-wave\b|\bwave-active\b/g, '');
    } else if (inPrep) {
      this.htmlHudPauseButton.style.display = '';
      this.htmlHudPauseButton.textContent = 'START WAVE';
      this.htmlHudPauseButton.className = this.htmlHudPauseButton.className.replace(/\bwave-active\b/g, '') + ' start-wave';
    } else if (paused) {
      this.htmlHudPauseButton.style.display = '';
      this.htmlHudPauseButton.textContent = 'RESUME';
      this.htmlHudPauseButton.className = this.htmlHudPauseButton.className.replace(/\bstart-wave\b|\bwave-active\b/g, '');
    } else {
      this.htmlHudPauseButton.style.display = '';
      this.htmlHudPauseButton.textContent = 'PAUSE';
      this.htmlHudPauseButton.className = this.htmlHudPauseButton.className.replace(/\bstart-wave\b|\bwave-active\b/g, '');
    }
  }
}

export function togglePlayerPause() {
  if (this.audioSettingsPointerGuard) {
    return;
  }
  if (this.gameState?.gameOver) {
    return;
  }

  this.gameplayPausedByPlayer = !this.gameplayPausedByPlayer;
  this.syncGameplayPauseState();

  this.setStatus(this.gameplayPausedByPlayer ? 'Game paused.' : 'Game resumed.', '#9edfff');
}

export function restartFromHud() {
  if (this.audioSettingsPointerGuard) {
    return;
  }

  try {
    const settingsOverlay = document.getElementById('settings-overlay');
    if (settingsOverlay) {
      settingsOverlay.style.display = 'none';
      settingsOverlay.style.pointerEvents = 'auto';
    }

    const worldSelectOverlay = document.getElementById('world-select-overlay');
    if (worldSelectOverlay) {
      worldSelectOverlay.style.pointerEvents = 'auto';
      worldSelectOverlay.style.display = 'none';
    }

    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.style.visibility = 'visible';
      gameContainer.style.pointerEvents = 'auto';
    }

    if (document?.body?.style) {
      document.body.style.pointerEvents = 'auto';
    }

    document.querySelectorAll('[data-wave-clear-root]').forEach((node) => {
      node.style.pointerEvents = 'none';
      node.style.display = 'none';
    });

    const upgradeModal = document.getElementById('upgrade-modal-root');
    if (upgradeModal?.parentNode) {
      upgradeModal.parentNode.removeChild(upgradeModal);
    }
  } catch (_) {}

  if (this.audioSettingsPanel?.visible) {
    this.toggleAudioSettingsPanel(false);
  }
  this.toggleBlueprintOverlay(false);
  this.teardownBlueprintOverlay();
  this.audioSettingsPointerGuard = false;
  this.audioSettingsActiveDrag = null;
  this.stopThemeMusic();
  this.gameplayPausedByPlayer = false;
  this.gameplayPausedBySettings = false;
  this.gameplayPauseActive = false;
  this.physics?.world?.resume();
  if (this.input) {
    this.input.enabled = true;
  }
  this.scene.restart();
}

export function setPathGuideVisible(visible) {
  const allowPathGuide = typeof this.isPathGuideFeatureAvailable === 'function'
    ? this.isPathGuideFeatureAvailable()
    : false;
  this.showPathGuide = allowPathGuide && !!visible;
  this.persistGameplaySettings();
  if (this.pathRoadOverlay) {
    this.pathRoadOverlay.setVisible(this.showPathGuide);
  }
  if (this.pathGuideOverlay) {
    this.pathGuideOverlay.setVisible(this.showPathGuide);
  }
  if (this.secondaryPathOverlay) {
    this.secondaryPathOverlay.setVisible(this.showPathGuide);
  }
  if (this.tertiaryPathOverlay) {
    this.tertiaryPathOverlay.setVisible(this.showPathGuide);
  }
  if (this.quaternaryPathOverlay) {
    this.quaternaryPathOverlay.setVisible(this.showPathGuide);
  }
  if (Array.isArray(this.extraVisualPathOverlays)) {
    this.extraVisualPathOverlays.forEach((overlay) => overlay?.setVisible(this.showPathGuide));
  }
  if (Array.isArray(this.customEntranceMarkers)) {
    this.customEntranceMarkers.forEach((marker) => marker?.setVisible(this.showPathGuide));
  }
  if (this.allowedBuildZoneOverlay) {
    this.allowedBuildZoneOverlay.setVisible(this.showPathGuide);
  }
  if (this.routeGuideToggleButton?.active) {
    this.routeGuideToggleButton.setFillStyle(this.showPathGuide ? 0x235a8f : 0x5b3b24, 0.98);
  }
  if (this.routeGuideToggleLabel?.active) {
    this.routeGuideToggleLabel.setText(this.showPathGuide ? 'ON' : 'OFF');
    this.routeGuideToggleLabel.setColor(this.showPathGuide ? '#effbff' : '#ffd8bf');
  }
  if (this.routeGuideTogglePanel?.active) {
    this.routeGuideTogglePanel.setAlpha(this.showPathGuide ? 1 : 0.92);
  }
  if (this.routeGuideEntryText) this.routeGuideEntryText.setVisible(this.showPathGuide);
  if (this.routeGuideCoreText) this.routeGuideCoreText.setVisible(this.showPathGuide);
  if (this.routeGuideMarker1) this.routeGuideMarker1.setVisible(this.showPathGuide);
  if (this.routeGuideLabel1) this.routeGuideLabel1.setVisible(this.showPathGuide);
  if (this.routeGuideMarker2) this.routeGuideMarker2.setVisible(this.showPathGuide);
  if (this.routeGuideLabel2) this.routeGuideLabel2.setVisible(this.showPathGuide);
  if (this.routeGuideMarker3) this.routeGuideMarker3.setVisible(this.showPathGuide);
  if (this.routeGuideLabel3) this.routeGuideLabel3.setVisible(this.showPathGuide);
  if (this.routeTwoEntranceGroundShadow) this.routeTwoEntranceGroundShadow.setVisible(this.showPathGuide);
  if (this.routeTwoEntranceShadow) this.routeTwoEntranceShadow.setVisible(this.showPathGuide);
  if (this.routeTwoEntranceTerrainWash) this.routeTwoEntranceTerrainWash.setVisible(this.showPathGuide);
  if (this.routeTwoEntranceBezel) this.routeTwoEntranceBezel.setVisible(this.showPathGuide);
  if (this.routeTwoEntranceHighlight) this.routeTwoEntranceHighlight.setVisible(this.showPathGuide);
  if (this.routeTwoEntranceImg) this.routeTwoEntranceImg.setVisible(this.showPathGuide);
}

export function togglePathGuide() {
  if (typeof this.isPathGuideFeatureAvailable === 'function' && !this.isPathGuideFeatureAvailable()) {
    this.setPathGuideVisible(false);
    return;
  }
  this.setPathGuideVisible(!this.showPathGuide);
}