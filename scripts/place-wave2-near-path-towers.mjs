import fs from 'node:fs';
import path from 'node:path';

const BASE_WIDTH = 1000;
const BASE_HEIGHT = 600;
const BOARD_WIDTH = 1600;
const BOARD_HEIGHT = 900;
const FORTRESS_GRID_SIZE = 62;
const MAP_OFFSET_Y = sy(10);
const PATH_HALF_WIDTH = sx(14.5);

const WAVE2_PATH_POINTS = [
  { x: 40, y: 145 },
  { x: 140, y: 145 },
  { x: 140, y: 468 },
  { x: 478, y: 468 },
  { x: 478, y: 198 },
  { x: 748, y: 198 },
  { x: 748, y: 424 },
  { x: 960, y: 424 },
];

const WAVE2_SLOT_CELLS = [
  { col: 1.9, row: 2.55 }, { col: 2.9, row: 2.55 }, { col: 3.9, row: 2.55 },
  { col: 1.9, row: 3.55 }, { col: 2.9, row: 3.55 }, { col: 3.9, row: 3.55 },
  { col: 11.45, row: 4.55 }, { col: 12.45, row: 4.55 }, { col: 13.45, row: 4.55 },
  { col: 11.45, row: 5.55 }, { col: 12.45, row: 5.55 }, { col: 13.45, row: 5.55 },
  { col: 6.35, row: 1.95 }, { col: 7.35, row: 1.95 }, { col: 8.35, row: 1.95 },
  { col: 6.35, row: 2.95 }, { col: 7.35, row: 2.95 }, { col: 8.35, row: 2.95 },
  { col: 6.35, row: 5.05 }, { col: 7.35, row: 5.05 }, { col: 8.35, row: 5.05 },
  { col: 6.35, row: 6.05 }, { col: 7.35, row: 6.05 }, { col: 8.35, row: 6.05 },
];

function sx(value) {
  return (value / BASE_WIDTH) * BOARD_WIDTH;
}

function sy(value) {
  return (value / BASE_HEIGHT) * BOARD_HEIGHT;
}

function parseArgs(argv) {
  const args = {
    count: 12,
    safeMargin: 14,
    nearMax: 140,
    output: 'reports/wave2-near-path-tower-placements.json',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--count') {
      const value = Number.parseInt(argv[i + 1], 10);
      if (Number.isInteger(value) && value > 0) {
        args.count = value;
      }
      i += 1;
    } else if (token === '--safe-margin') {
      const value = Number.parseFloat(argv[i + 1]);
      if (Number.isFinite(value) && value >= 0) {
        args.safeMargin = value;
      }
      i += 1;
    } else if (token === '--near-max') {
      const value = Number.parseFloat(argv[i + 1]);
      if (Number.isFinite(value) && value > 0) {
        args.nearMax = value;
      }
      i += 1;
    } else if (token === '--output') {
      if (argv[i + 1]) {
        args.output = argv[i + 1];
      }
      i += 1;
    }
  }

  return args;
}

function toWorldPath(pathPoints) {
  return pathPoints.map((point) => ({
    x: sx(point.x),
    y: sy(point.y) + MAP_OFFSET_Y,
  }));
}

function toWorldSlots(slotCells) {
  return slotCells.map((cell, index) => ({
    slotIndex: index,
    x: sx((cell.col * FORTRESS_GRID_SIZE) + (FORTRESS_GRID_SIZE * 0.5)),
    y: sy((cell.row * FORTRESS_GRID_SIZE) + (FORTRESS_GRID_SIZE * 0.5)) + MAP_OFFSET_Y,
  }));
}

function buildSegments(pathPoints) {
  const segments = [];
  for (let i = 0; i < pathPoints.length - 1; i += 1) {
    const start = pathPoints[i];
    const end = pathPoints[i + 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    if (length === 0) {
      continue;
    }

    segments.push({
      index: i,
      start,
      end,
      dx,
      dy,
      length,
    });
  }
  return segments;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distanceToSegment(px, py, segment) {
  const { start, dx, dy } = segment;
  const denom = (dx * dx) + (dy * dy);
  const t = denom === 0 ? 0 : clamp((((px - start.x) * dx) + ((py - start.y) * dy)) / denom, 0, 1);
  const closestX = start.x + (t * dx);
  const closestY = start.y + (t * dy);
  return Math.hypot(px - closestX, py - closestY);
}

function minDistanceToPath(px, py, segments) {
  let minDistance = Number.POSITIVE_INFINITY;
  let segmentIndex = -1;

  for (let i = 0; i < segments.length; i += 1) {
    const dist = distanceToSegment(px, py, segments[i]);
    if (dist < minDistance) {
      minDistance = dist;
      segmentIndex = segments[i].index;
    }
  }

  return { minDistance, segmentIndex };
}

function selectPlacements(slots, segments, options) {
  const forbiddenRadius = PATH_HALF_WIDTH + options.safeMargin;
  const nearRadius = PATH_HALF_WIDTH + options.nearMax;

  const scoredSlots = slots.map((slot) => {
    const distanceInfo = minDistanceToPath(slot.x, slot.y, segments);
    return {
      ...slot,
      distanceToPath: distanceInfo.minDistance,
      nearestSegmentIndex: distanceInfo.segmentIndex,
      valid: distanceInfo.minDistance > forbiddenRadius,
      closeEnough: distanceInfo.minDistance <= nearRadius,
    };
  });

  const preferred = scoredSlots
    .filter((slot) => slot.valid && slot.closeEnough)
    .sort((a, b) => a.distanceToPath - b.distanceToPath);

  const fallback = scoredSlots
    .filter((slot) => slot.valid)
    .sort((a, b) => a.distanceToPath - b.distanceToPath);

  const picked = (preferred.length > 0 ? preferred : fallback).slice(0, options.count);

  return {
    forbiddenRadius,
    nearRadius,
    scoredSlots,
    picked,
  };
}

function buildRuntimeSnippet(picked) {
  const positions = picked.map((slot) => ({
    x: Math.round(slot.x),
    y: Math.round(slot.y),
    slotIndex: slot.slotIndex,
  }));

  return [
    '(() => {',
    '  const scene = window.__tdScene;',
    "  if (!scene) throw new Error('Game scene hook not available');",
    '  scene.gameState.wave = 2;',
    '  scene.gameState.level = 2;',
    '  scene.gameState.prepPhase = true;',
    '  scene.applyFortressLayoutForWave?.(2);',
    '  scene.applyPathLayoutForWave?.(2, true);',
    '  const liveTowers = scene.towers?.children?.entries ? scene.towers.children.entries.slice() : [];',
    '  liveTowers.forEach((tower) => { if (tower?.active) { tower.destroy(); } });',
    '  (scene.towerBaseSlots || []).forEach((slot) => { slot.occupied = false; });',
    '  const placements = ' + JSON.stringify(positions) + ';',
    '  placements.forEach((p) => scene.tryPlaceTower(p.x, p.y));',
    '  scene.updateHud?.();',
    '  return { placedAttemptCount: placements.length, activeTowers: scene.towers?.countActive?.() || 0 };',
    '})();',
  ].join('\n');
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const worldPath = toWorldPath(WAVE2_PATH_POINTS);
  const worldSlots = toWorldSlots(WAVE2_SLOT_CELLS);
  const segments = buildSegments(worldPath);
  const selection = selectPlacements(worldSlots, segments, options);

  const report = {
    generatedAt: new Date().toISOString(),
    wave: 2,
    layoutId: 'south-detour',
    board: {
      width: BOARD_WIDTH,
      height: BOARD_HEIGHT,
      mapOffsetY: MAP_OFFSET_Y,
    },
    path: {
      halfWidth: PATH_HALF_WIDTH,
      forbiddenRadius: selection.forbiddenRadius,
      nearRadius: selection.nearRadius,
      centerline: worldPath.map((point) => ({
        x: Number(point.x.toFixed(3)),
        y: Number(point.y.toFixed(3)),
      })),
    },
    options,
    placements: selection.picked.map((slot) => ({
      slotIndex: slot.slotIndex,
      x: Number(slot.x.toFixed(3)),
      y: Number(slot.y.toFixed(3)),
      distanceToPath: Number(slot.distanceToPath.toFixed(3)),
      nearestSegmentIndex: slot.nearestSegmentIndex,
    })),
    allSlots: selection.scoredSlots.map((slot) => ({
      slotIndex: slot.slotIndex,
      x: Number(slot.x.toFixed(3)),
      y: Number(slot.y.toFixed(3)),
      distanceToPath: Number(slot.distanceToPath.toFixed(3)),
      nearestSegmentIndex: slot.nearestSegmentIndex,
      valid: slot.valid,
      closeEnough: slot.closeEnough,
    })),
    runtimePlacementSnippet: buildRuntimeSnippet(selection.picked),
  };

  fs.mkdirSync(path.dirname(options.output), { recursive: true });
  fs.writeFileSync(options.output, JSON.stringify(report, null, 2));

  console.log('Wrote:', options.output);
  console.log('Wave 2 placements selected:', report.placements.length);
  report.placements.forEach((placement, idx) => {
    console.log(
      [
        String(idx + 1).padStart(2, '0') + '.',
        'slot',
        placement.slotIndex,
        'x=' + Math.round(placement.x),
        'y=' + Math.round(placement.y),
        'distance=' + placement.distanceToPath.toFixed(2),
      ].join(' ')
    );
  });
}

main();
