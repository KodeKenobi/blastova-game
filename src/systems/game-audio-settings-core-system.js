import Phaser from 'phaser';
import { MASTER_AUDIO_ATTENUATION } from './game-config-constants';

export function isPathGuideFeatureAvailable() {
  const host = String(globalThis?.location?.hostname || '').toLowerCase();
  const protocol = String(globalThis?.location?.protocol || '').toLowerCase();
  const isLocalHttp = (protocol === 'http:' || protocol === 'https:')
    && (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local'));

  // Keep this available in local dev workflows even when host checks vary.
  return Boolean(import.meta?.env?.DEV) || isLocalHttp;
}

export function initAudioSettings() {
  const defaults = {
    weapon: 0.2,
    explosion: 0.88,
    other: 0.4,
    music: 0.45,
  };

  let persisted = null;
  try {
    const raw = window?.localStorage?.getItem('tdAudioSettingsV1');
    if (raw) {
      persisted = JSON.parse(raw);
    }
  } catch (error) {
    persisted = null;
  }

  this.audioSettings = {
    weapon: Phaser.Math.Clamp(Number(persisted?.weapon ?? defaults.weapon), 0, 1),
    explosion: Phaser.Math.Clamp(Number(persisted?.explosion ?? defaults.explosion), 0, 1),
    other: Phaser.Math.Clamp(Number(persisted?.other ?? defaults.other), 0, 1),
    music: Phaser.Math.Clamp(Number(persisted?.music ?? defaults.music), 0, 1),
  };

  this.audioSettings.weapon = Math.min(this.audioSettings.weapon, Math.max(0, this.audioSettings.explosion - 0.24));

  const nearSilentMix = this.audioSettings.weapon <= 0.08
    && this.audioSettings.explosion <= 0.12
    && this.audioSettings.music <= 0.12;
  if (nearSilentMix) {
    this.audioSettings.weapon = defaults.weapon;
    this.audioSettings.explosion = defaults.explosion;
    this.audioSettings.other = defaults.other;
    this.audioSettings.music = defaults.music;
    this.persistAudioSettings();
  }
}

export function persistAudioSettings() {
  if (!this.audioSettings) {
    return;
  }

  try {
    window?.localStorage?.setItem('tdAudioSettingsV1', JSON.stringify(this.audioSettings));
  } catch (error) {
    // Ignore persistence failures (private mode, storage unavailable, etc.).
  }
}

export function loadGameplaySettings() {
  try {
    const raw = window?.localStorage?.getItem('tdGameplaySettingsV1');
    const parsed = raw ? JSON.parse(raw) : {};
    if (!isPathGuideFeatureAvailable()) {
      parsed.showPathGuide = false;
    }
    return parsed;
  } catch (_) {
    return { showPathGuide: false };
  }
}

export function persistGameplaySettings() {
  try {
    const current = this.loadGameplaySettings();
    current.showPathGuide = isPathGuideFeatureAvailable() && this.showPathGuide !== false;
    window?.localStorage?.setItem('tdGameplaySettingsV1', JSON.stringify(current));
  } catch (_) {
    // Ignore persistence failures.
  }
}

export function getAudioBusLevel(bus) {
  if (!this.audioSettings) {
    return 1;
  }
  return Phaser.Math.Clamp(Number(this.audioSettings[bus] ?? 1), 0, 1);
}

export function getConfiguredAudioVolume(bus, baseVolume = 1) {
  const safeBase = Phaser.Math.Clamp(Number(baseVolume) || 0, 0, 1);
  return Phaser.Math.Clamp(safeBase * this.getAudioBusLevel(bus) * MASTER_AUDIO_ATTENUATION, 0, 1);
}

export function setAudioBusLevel(bus, level, announce = false) {
  if (!this.audioSettings || !(bus in this.audioSettings)) {
    return;
  }

  this.audioSettings[bus] = Phaser.Math.Clamp(Number(level) || 0, 0, 1);
  if (bus === 'weapon' || bus === 'explosion') {
    this.audioSettings.weapon = Math.min(this.audioSettings.weapon, Math.max(0, this.audioSettings.explosion - 0.24));
  }
  this.syncThemeMusicVolumes();
  this.persistAudioSettings();
  this.refreshAudioSettingsPanel();

  if (announce) {
    const label = bus === 'weapon'
      ? 'Weapon SFX'
      : bus === 'explosion'
        ? 'Explosion SFX'
        : bus === 'music'
          ? 'Music'
          : 'Other SFX';
    this.setStatus(label + ' volume: ' + Math.round(this.audioSettings[bus] * 100) + '%', '#9edfff');
  }
}