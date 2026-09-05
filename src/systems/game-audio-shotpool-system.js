import { WEAPON_SHOT_AUDIO_ASSETS } from './game-static-data';
import { DIFFICULTY_CONFIGS } from './game-config-constants';

export function getDifficultyConfig() {
  const key = this.gameState?.selectedDifficulty || 'normal';
  return DIFFICULTY_CONFIGS[key] || DIFFICULTY_CONFIGS.normal;
}

export function initShotSoundPools() {
  const POOL_SIZE = 6;
  this._shotSoundPools = {};
  WEAPON_SHOT_AUDIO_ASSETS.forEach(({ key }) => {
    if (this.cache?.audio?.exists(key)) {
      this._shotSoundPools[key] = {
        pool: Array.from({ length: POOL_SIZE }, () => this.sound.add(key, { loop: false })),
        idx: 0,
      };
    }
  });
  this._shotWindowStart = 0;
  this._shotWindowCount = 0;
}

export function getPooledShot(key) {
  const entry = this._shotSoundPools?.[key];
  if (!entry) return null;

  const now = this.time?.now || 0;
  if (now - this._shotWindowStart > 60) {
    this._shotWindowStart = now;
    this._shotWindowCount = 0;
  }
  if (this._shotWindowCount >= 2) {
    return null;
  }
  this._shotWindowCount++;

  for (let i = 0; i < entry.pool.length; i++) {
    const candidate = entry.pool[(entry.idx + i) % entry.pool.length];
    if (!candidate.isPlaying) {
      entry.idx = (entry.idx + i + 1) % entry.pool.length;
      return candidate;
    }
  }
  const snd = entry.pool[entry.idx % entry.pool.length];
  entry.idx = (entry.idx + 1) % entry.pool.length;
  return snd;
}