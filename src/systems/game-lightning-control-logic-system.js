import { DEBUG_FLAGS } from './game-config-constants';

function isWorldTwoLightningTestBypassEnabled(scene) {
  const worldIndex = scene?.gameState?.selectedWorldIndex || 0;
  return worldIndex === 1 && !!DEBUG_FLAGS.world2LightningTestBypass;
}

export function getPlayerLightningCooldownRemainingMs() {
  const now = this.time?.now || 0;
  return Math.max(0, (this.playerLightningReadyAt || 0) - now);
}

export function shouldBypassLightningWindowRequirement(options = {}) {
  return !!(options?.allowOutsideBarrageWindow || this.lightningTestingBypassWindow);
}

export function canTriggerPlayerLightning(options = {}) {
  const isAttackRole = this.gameState?.multiplayerRole === 'enemyCommander'
    || !!this.isMultiplayerEnemyCommanderRole?.();
  if (isAttackRole) {
    return false;
  }
  const bypassWindowRequirement = this.shouldBypassLightningWindowRequirement(options);
  const bypassWorldTwoLightningTestGate = isWorldTwoLightningTestBypassEnabled(this);
  if (this.gameState?.gameOver) {
    return false;
  }
  if (!bypassWindowRequirement && !bypassWorldTwoLightningTestGate && !this.barrageLightningWindowOpen) {
    return false;
  }
  if (!bypassWindowRequirement && !bypassWorldTwoLightningTestGate && !this.barrageNearLightningTower) {
    return false;
  }
  if (this.gameplayPauseActive) {
    return false;
  }
  return this.getPlayerLightningCooldownRemainingMs() <= 0;
}

export function refreshLightningBlobControl() {
  if (!this.lightningBlobCore || !this.lightningBlobHitZone || !this.lightningBlobLabel || !this.lightningBlobOuter || !this.lightningBlobPulse || !this.lightningBlobIcon) {
    return;
  }

  const remainingMs = this.getPlayerLightningCooldownRemainingMs();
  const bypassWindowRequirement = this.shouldBypassLightningWindowRequirement();
  const bypassWorldTwoLightningTestGate = isWorldTwoLightningTestBypassEnabled(this);
  const isAttackRole = this.gameState?.multiplayerRole === 'enemyCommander'
    || !!this.isMultiplayerEnemyCommanderRole?.();
  const canTrigger = this.canTriggerPlayerLightning({ allowOutsideBarrageWindow: bypassWindowRequirement });
  const visible = !this.gameState?.gameOver && !isAttackRole;

  [
    this.lightningBlobOuter,
    this.lightningBlobPulse,
    this.lightningBlobCore,
    this.lightningBlobIcon,
    this.lightningBlobLabel,
    this.lightningBlobHitZone,
  ].forEach((obj) => obj.setVisible(visible));

  if (!visible) {
    if (this.lightningBlobHitZone.input?.enabled) {
      this.lightningBlobHitZone.disableInteractive();
    }
    if (this.lightningBlobPulseTween) {
      this.lightningBlobPulseTween.pause();
    }
    return;
  }

  if (remainingMs > 0) {
    const seconds = Math.max(1, Math.ceil(remainingMs / 1000));
    this.lightningBlobLabel.setText('LIGHTNING ' + seconds + 's');
    this.lightningBlobCore.setFillStyle(0x8fb5ef, 0.72);
    this.lightningBlobIcon.setColor('#335d9d');
    this.lightningBlobOuter.setFillStyle(0x3f6ccc, 0.24);
    this.lightningBlobPulse.setFillStyle(0x7ea9ef, 0.16);
  } else if (!bypassWindowRequirement && !bypassWorldTwoLightningTestGate && !this.barrageLightningWindowOpen) {
    this.lightningBlobLabel.setText('BARRAGE WINDOW ONLY');
    this.lightningBlobCore.setFillStyle(0x88a0c8, 0.68);
    this.lightningBlobIcon.setColor('#445f8f');
    this.lightningBlobOuter.setFillStyle(0x2f4770, 0.2);
    this.lightningBlobPulse.setFillStyle(0x506e9f, 0.12);
  } else if (!bypassWindowRequirement && !bypassWorldTwoLightningTestGate && !this.barrageNearLightningTower) {
    this.lightningBlobLabel.setText('BARRAGE TOO FAR');
    this.lightningBlobCore.setFillStyle(0x88a0c8, 0.68);
    this.lightningBlobIcon.setColor('#445f8f');
    this.lightningBlobOuter.setFillStyle(0x2f4770, 0.2);
    this.lightningBlobPulse.setFillStyle(0x506e9f, 0.12);
  } else {
    this.lightningBlobLabel.setText('LIGHTNING READY');
    this.lightningBlobCore.setFillStyle(0xeaf4ff, 0.95);
    this.lightningBlobIcon.setColor('#1d4ea8');
    this.lightningBlobOuter.setFillStyle(0x67a5ff, 0.28);
    this.lightningBlobPulse.setFillStyle(0xa5ceff, 0.2);
  }

  if (!this.lightningBlobHitZone.input?.enabled) {
    this.lightningBlobHitZone.setInteractive({ useHandCursor: true });
  }

  if (canTrigger) {
    this.lightningBlobPulseTween?.resume();
  } else {
    this.lightningBlobPulseTween?.pause();
  }
}

export function triggerPlayerLightningFromControl(options = {}) {
  const isAttackRole = this.gameState?.multiplayerRole === 'enemyCommander'
    || !!this.isMultiplayerEnemyCommanderRole?.();
  if (isAttackRole) {
    return;
  }
  const bypassWindowRequirement = this.shouldBypassLightningWindowRequirement(options);
  const bypassWorldTwoLightningTestGate = isWorldTwoLightningTestBypassEnabled(this);
  if (!this.canTriggerPlayerLightning({ allowOutsideBarrageWindow: bypassWindowRequirement })) {
    const remainingMs = this.getPlayerLightningCooldownRemainingMs();
    if (remainingMs > 0) {
      const seconds = Math.max(1, Math.ceil(remainingMs / 1000));
      this.setStatus('Lightning recharging: ' + seconds + 's', '#9ad8ee');
    } else if (!bypassWindowRequirement && !bypassWorldTwoLightningTestGate && !this.barrageLightningWindowOpen) {
      this.setStatus('Lightning can only be triggered during barrage windows.', '#ffb18b');
    } else if (!bypassWindowRequirement && !bypassWorldTwoLightningTestGate && !this.barrageNearLightningTower) {
      this.setStatus('Hold until barrage units get near the lightning tower.', '#ffb18b');
    }
    this.refreshLightningBlobControl();
    return;
  }

  const lightningSound = new Audio('/assets/audio/trigger-lightning.wav');
  lightningSound.volume = 0.6;
  const stopLightningSound = () => {
    lightningSound.pause();
    lightningSound.currentTime = 0;
  };
  const lightningSequenceMs = this.triggerBarrageLightningSequence(2, {
    onComplete: () => {
      stopLightningSound();
      this.playerLightningReadyAt = (this.time?.now || 0) + this.playerLightningCooldownMs;
      this.refreshLightningBlobControl();
    },
  });
  void lightningSound.play().catch(() => {});
  this.playerLightningReadyAt = (this.time?.now || 0) + Math.max(0, lightningSequenceMs) + this.playerLightningCooldownMs;
  this.setStatus('⚡ Player-triggered lightning barrage deployed!', '#b5ebff');
  this.refreshLightningBlobControl();
}
