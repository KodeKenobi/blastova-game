function syncSettingsTransitionSound(scene, shouldPlay) {
  if (shouldPlay) {
    if (!scene.settingsTransitionSound) {
      scene.settingsTransitionSound = new Audio('/assets/audio/transition.mp3');
      scene.settingsTransitionSound.loop = false;
      scene.settingsTransitionSound.volume = 0.5;
    }
    void scene.settingsTransitionSound.play().catch(() => {});
    return;
  }

  if (scene.settingsTransitionSound) {
    scene.settingsTransitionSound.pause();
    scene.settingsTransitionSound.currentTime = 0;
  }
}

export function toggleAudioSettingsPanel(forceOpen = null) {
  const overlay = document.getElementById('settings-overlay');
  if (overlay) {
    const isVisible = overlay.style.display === 'flex';
    const shouldShow = forceOpen === null ? !isVisible : !!forceOpen;
    if (shouldShow) {
      this.playerPauseStateBeforeSettingsOpen = !!this.gameplayPausedByPlayer;
      this.gameplayPausedBySettings = true;
    } else {
      this.gameplayPausedBySettings = false;
      if (this.playerPauseStateBeforeSettingsOpen) {
        this.gameplayPausedByPlayer = true;
      }
      this.playerPauseStateBeforeSettingsOpen = false;
    }
    if (shouldShow) {
      if (typeof window.__showSettings === 'function') window.__showSettings();
    } else {
      if (typeof window.__hideSettings === 'function') window.__hideSettings();
    }
    syncSettingsTransitionSound(this, shouldShow);
    if (this.audioSettingsButton?.active) {
      this.audioSettingsButton.setFillStyle(shouldShow ? 0x235a8f : 0x173a5e, 0.98);
    }
    this.syncGameplayPauseState();
    return;
  }

  if (!this.audioSettingsPanel) return;

  const wasVisible = this.audioSettingsPanel.visible;
  const shouldShow = forceOpen === null ? !this.audioSettingsPanel.visible : !!forceOpen;
  if (shouldShow === wasVisible) {
    return;
  }

  syncSettingsTransitionSound(this, shouldShow);

  this.audioSettingsPointerGuard = true;
  this.time.delayedCall(140, () => {
    this.audioSettingsPointerGuard = false;
  });

  this.audioSettingsPanel.setVisible(shouldShow);
  if (!shouldShow) {
    this.audioSettingsActiveDrag = null;
  }
  if (this.audioSettingsButton?.active) {
    this.audioSettingsButton.setFillStyle(shouldShow ? 0x235a8f : 0x173a5e, 0.98);
  }
  if (this.audioSettingsButtonLabel?.active) {
    this.audioSettingsButtonLabel.setText('SETTINGS');
    this.audioSettingsButtonLabel.setColor(shouldShow ? '#f3fcff' : '#def4ff');
  }

  if (shouldShow) {
    this.playerPauseStateBeforeSettingsOpen = !!this.gameplayPausedByPlayer;
    this.gameplayPausedBySettings = true;
    this.refreshAudioSettingsPanel();
  } else {
    this.gameplayPausedBySettings = false;
    if (this.playerPauseStateBeforeSettingsOpen) {
      this.gameplayPausedByPlayer = true;
    }
    this.playerPauseStateBeforeSettingsOpen = false;
    if (this.gameplayPausedByPlayer) {
      this.stopThemeMusic();
    }
  }

  this.syncGameplayPauseState();
}

export function refreshAudioSettingsPanel() {
  if (this.audioSettingsRows?.length && this.audioSettings) {
    this.audioSettingsRows.forEach((row) => {
      const value = this.getAudioBusLevel(row.key);
      const fillWidth = Math.max(2, row.trackWidth * value);
      row.fill.width = fillWidth;
      row.knob.x = row.trackX + (row.trackWidth * value);
      row.valueText.setText(Math.round(value * 100) + '%');
    });
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
}