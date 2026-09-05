export function commanderXpForLevel(level) {
  const lvl = Math.max(1, Number(level) || 1);
  return Math.round(400 * Math.pow(lvl, 1.55));
}

export function getWeaponBuildCost(weapon, defaultWeaponBuildCost = 55) {
  const explicitCost = Number(weapon?.cost);
  if (Number.isFinite(explicitCost) && explicitCost > 0) {
    return Math.round(explicitCost * 1.72);
  }

  const weaponId = Math.max(1, Number(weapon?.id) || 1);
  const tierBand = Math.floor((weaponId - 1) / 4);
  const withinBand = (weaponId - 1) % 4;
  return defaultWeaponBuildCost + (tierBand * 18) + (withinBand * 8);
}

export function getWeaponTrayLabel(weapon) {
  const rawName = String(weapon?.name || '').trim();
  if (!rawName) {
    return 'ID ' + String(weapon?.id || '?');
  }

  const mkMatch = rawName.match(/^(.*)\s+(Mk\s*\d+)$/i);
  if (!mkMatch) {
    return rawName.toUpperCase();
  }

  const family = mkMatch[1].trim().toUpperCase();
  const mk = mkMatch[2].trim().toUpperCase().replace(/\s+/g, ' ');
  return family + '\n' + mk;
}

export function getWeaponTrayCardLabel(weapon) {
  return getWeaponTrayLabel(weapon).replace('\n', ' ');
}

export function createBoardScalers({ baseWidth, baseHeight, boardWidth, boardHeight }) {
  const sx = (value) => (value / baseWidth) * boardWidth;
  const sy = (value) => (value / baseHeight) * boardHeight;
  return { sx, sy };
}
