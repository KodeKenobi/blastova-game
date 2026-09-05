import {
  BASE_HEIGHT,
  BASE_WIDTH,
  BOARD_HEIGHT,
  BOARD_WIDTH,
} from './game-config-constants';
import { createBoardScalers } from './game-core-utils';
import { LAYOUT_GAMEPLAY_RULES } from './game-layout-data';

const { sx, sy } = createBoardScalers({
  baseWidth: BASE_WIDTH,
  baseHeight: BASE_HEIGHT,
  boardWidth: BOARD_WIDTH,
  boardHeight: BOARD_HEIGHT,
});

const LIGHTNING_TRIGGER_MAP_OFFSET_Y = 15;

const WORLD_LIGHTNING_TRIGGER_POINT_GROUPS = {
  // World 2 (worldId: 1) uses a fixed trigger placement.
  1: [
    { x: 843, y: 392 },
    { x: 853, y: 392 },
    { x: 863, y: 392 },
  ],
  // World 4 (worldId: 3) uses a fixed trigger placement.
  3: [
    { x: 1416, y: 295 },
    { x: 1426, y: 295 },
    { x: 1436, y: 295 },
    { x: 1446, y: 295 },
  ],
  // World 5 (worldId: 4) uses a fixed trigger placement.
  4: [
    { x: 681, y: 379 },
    { x: 691, y: 379 },
    { x: 701, y: 379 },
    { x: 711, y: 379 },
    { x: 721, y: 379 },
    { x: 731, y: 379 },
    { x: 741, y: 379 },
    { x: 751, y: 379 },
    { x: 761, y: 379 },
  ],
  // World 6 (worldId: 5) uses a fixed trigger placement.
  5: [
    { x: 669, y: 448 },
    { x: 679, y: 448 },
    { x: 689, y: 448 },
    { x: 699, y: 448 },
    { x: 709, y: 448 },
    { x: 719, y: 448 },
    { x: 729, y: 448 },
  ],
  2: [
    { x: 1402, y: 359 },
    { x: 1412, y: 359 },
    { x: 1422, y: 359 },
    { x: 1432, y: 359 },
    { x: 1442, y: 359 },
  ],
  11: [
    { x: 1429, y: 178 },
    { x: 1439, y: 178 },
    { x: 1449, y: 178 },
    { x: 1459, y: 178 },
    { x: 1469, y: 178 },
    { x: 1479, y: 178 },
    { x: 1489, y: 178 },
    { x: 1499, y: 178 },
  ],
  6: [
    { x: 811, y: 197 },
    { x: 821, y: 197 },
    { x: 831, y: 197 },
    { x: 841, y: 197 },
    { x: 851, y: 197 },
    { x: 861, y: 197 },
    { x: 871, y: 197 },
  ],
  7: [
    { x: 923, y: 541 },
    { x: 933, y: 541 },
    { x: 943, y: 541 },
    { x: 953, y: 541 },
    { x: 963, y: 541 },
    { x: 973, y: 541 },
    { x: 983, y: 541 },
  ],
  8: [
    { x: 1406, y: 570 },
    { x: 1416, y: 570 },
    { x: 1426, y: 570 },
    { x: 1436, y: 570 },
    { x: 1446, y: 570 },
    { x: 1456, y: 570 },
    { x: 1466, y: 570 },
  ],
  9: [
    { x: 739, y: 251 },
    { x: 749, y: 251 },
    { x: 759, y: 251 },
    { x: 769, y: 251 },
    { x: 779, y: 251 },
    { x: 789, y: 251 },
    { x: 799, y: 251 },
  ],
  10: [
    { x: 1371, y: 244 },
    { x: 1381, y: 244 },
    { x: 1391, y: 244 },
    { x: 1401, y: 244 },
    { x: 1411, y: 244 },
    { x: 1421, y: 244 },
    { x: 1431, y: 244 },
  ],
};

const WORLD_LIGHTNING_TRIGGER_POINT_GROUPS_MOBILE = {
  11: [
    { x: 876, y: 41 },
    { x: 895, y: 41 },
    { x: 913, y: 45 },
    { x: 931, y: 32 },
    { x: 942, y: 32 },
  ],
};

const WORLD_LIGHTNING_TRIGGER_ANCHOR_Y = {
  1: 248,
  3: 270,
};

const WORLD_LIGHTNING_TRIGGER_X_OFFSET = {
  6: 26,
};

const WORLD_LIGHTNING_TRIGGER_X_OFFSET_MOBILE = {
  11: -42,
};

const WORLD_LIGHTNING_TRIGGER_Y_OFFSET = {
  11: 180,
};

const LIGHTNING_TRIGGER_CONTROL_Y_OFFSET_MOBILE = 10;
const WORLD1_LIGHTNING_TRIGGER_Y_OFFSET_DESKTOP = 24;
const WORLD_LIGHTNING_DRAGGABLE_MIN_INDEX = 1;

const WORLD_LIGHTNING_TRIGGER_ANCHOR_BY_WORLD = {
  0: { x: 538, y: 112 },
  1: { x: 900, y: 248 },
  2: { x: 891, y: 267 },
  3: { x: 900, y: 270 },
  4: { x: 904, y: 206 },
  5: { x: 906, y: 222 },
  6: { x: 930, y: 142 },
  7: { x: 902, y: 198 },
  8: { x: 904, y: 390 },
  9: { x: 770, y: 292 },
  10: { x: 906, y: 218 },
  11: { x: 86, y: 426 },
};

function getLightningTriggerAnchor(scene, worldIndex, layoutId, worldMapCoordinateYOffset = 0) {
  const normalizedWorldIndex = Math.max(0, Math.floor(Number(worldIndex) || 0));
  const isMobileViewport = typeof window !== 'undefined' && window.innerWidth <= 900;

  // Exact per-world points are always source-of-truth for saved positions.
  const explicitPoints = (isMobileViewport
    ? (WORLD_LIGHTNING_TRIGGER_POINT_GROUPS_MOBILE[normalizedWorldIndex] || null)
    : null) || WORLD_LIGHTNING_TRIGGER_POINT_GROUPS[normalizedWorldIndex];
  if (Array.isArray(explicitPoints) && explicitPoints.length > 0) {
    const sum = explicitPoints.reduce((acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y,
    }), { x: 0, y: 0 });
    return {
      x: sum.x / explicitPoints.length,
      y: sum.y / explicitPoints.length,
    };
  }

  const xOffset = (WORLD_LIGHTNING_TRIGGER_X_OFFSET[normalizedWorldIndex] || 0)
    + (isMobileViewport ? (WORLD_LIGHTNING_TRIGGER_X_OFFSET_MOBILE[normalizedWorldIndex] || 0) : 0);
  const yOffset = isMobileViewport ? (WORLD_LIGHTNING_TRIGGER_Y_OFFSET[normalizedWorldIndex] || 0) : 0;
  const layoutAnchorY = LAYOUT_GAMEPLAY_RULES[layoutId]?.lightningControlAnchorY;

  // World 1 keeps the trigger anchored above its lightning tower landmark.
  if (normalizedWorldIndex === 0 && scene?.lightningLandmarkSprite?.active) {
    const desktopOffset = isMobileViewport ? 0 : sy(WORLD1_LIGHTNING_TRIGGER_Y_OFFSET_DESKTOP);
    return {
      x: scene.lightningLandmarkSprite.x,
      y: scene.lightningLandmarkSprite.y - sy(72) + desktopOffset,
    };
  }

  const worldAnchor = WORLD_LIGHTNING_TRIGGER_ANCHOR_BY_WORLD[normalizedWorldIndex];
  if (worldAnchor) {
    return {
      x: sx(worldAnchor.x + xOffset),
      y: sy(worldAnchor.y) + LIGHTNING_TRIGGER_MAP_OFFSET_Y + worldMapCoordinateYOffset + sy(yOffset),
    };
  }

  return {
    x: BOARD_WIDTH - sx(96) + sx(xOffset),
    y: sy(layoutAnchorY || WORLD_LIGHTNING_TRIGGER_ANCHOR_Y[normalizedWorldIndex] || 142),
  };
}

function setLightningControlPosition(scene, centerX, centerY) {
  scene.lightningBlobOuter?.setPosition(centerX, centerY);
  scene.lightningBlobPulse?.setPosition(centerX, centerY);
  scene.lightningBlobCore?.setPosition(centerX, centerY);
  scene.lightningBlobIcon?.setPosition(centerX, centerY);
  scene.lightningBlobLabel?.setPosition(centerX, centerY + sy(28));
  scene.lightningBlobHitZone?.setPosition(centerX, centerY);
}

function buildLightningSavePoints(anchorX, anchorY, pointCount = 7) {
  const count = Math.max(1, Math.min(12, Number(pointCount) || 7));
  const center = (count - 1) / 2;
  const spacing = 10;
  return Array.from({ length: count }, (_, idx) => ({
    x: Math.round(anchorX + ((idx - center) * spacing)),
    y: Math.round(anchorY),
  }));
}

async function persistDraggedLightningAnchor(scene) {
  const worldIndex = Math.max(0, Math.floor(Number(scene?.gameState?.selectedWorldIndex ?? 0) || 0));
  if (worldIndex < WORLD_LIGHTNING_DRAGGABLE_MIN_INDEX) {
    scene?.setStatus?.('Lightning save is disabled for this world.', '#ffb18b');
    return;
  }
  const anchor = scene?.lightningDragPendingAnchor;
  if (!anchor || !Number.isFinite(anchor.x) || !Number.isFinite(anchor.y)) {
    scene?.setStatus?.('No dragged lightning position to save yet.', '#ffb18b');
    return;
  }

  const existingCount = Array.isArray(WORLD_LIGHTNING_TRIGGER_POINT_GROUPS[worldIndex])
    ? WORLD_LIGHTNING_TRIGGER_POINT_GROUPS[worldIndex].length
    : 7;
  const points = buildLightningSavePoints(anchor.x, anchor.y, existingCount);
  WORLD_LIGHTNING_TRIGGER_POINT_GROUPS[worldIndex] = points;

  try {
    const response = await fetch('/__lightning-trigger-points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ worldId: worldIndex, points }),
    });
    if (!response.ok) {
      throw new Error('save_failed_http_' + response.status);
    }
    scene?.setStatus?.('Saved lightning anchor to source for World ' + (worldIndex + 1) + '.', '#9df8ff');
  } catch (error) {
    const message = error && error.message ? error.message : 'save_failed';
    scene?.setStatus?.('Save failed: ' + message, '#ff9aa5');
  }
}

function enableLightningDragForWorld(scene, worldIndex) {
  if (worldIndex < WORLD_LIGHTNING_DRAGGABLE_MIN_INDEX || !scene?.lightningBlobHitZone) {
    return;
  }

  if (!scene.lightningBlobHitZone.input?.enabled) {
    scene.lightningBlobHitZone.setInteractive({ useHandCursor: true });
  }
  if (scene.input?.setDraggable && scene.lightningBlobHitZone.input) {
    scene.input.setDraggable(scene.lightningBlobHitZone, true);
  }

  if (!scene.lightningDragBound) {
    scene.lightningDragBound = true;

    scene.lightningBlobHitZone.on('dragstart', () => {
      scene.lightningDragActive = true;
    });

    scene.lightningBlobHitZone.on('drag', (_pointer, dragX, dragY) => {
      setLightningControlPosition(scene, dragX, dragY);
      scene.lightningDragPendingAnchor = { x: dragX, y: dragY };
    });

    scene.lightningBlobHitZone.on('dragend', () => {
      scene.lightningDragActive = false;
      scene.setStatus?.('Lightning moved. Press K to save this position to source.', '#9df8ff');
    });

    const keyHandler = (event) => {
      if (!event || String(event.key || '').toLowerCase() !== 'k') {
        return;
      }
      const activeWorld = Number(scene?.gameState?.selectedWorldIndex ?? 0);
      if (activeWorld < WORLD_LIGHTNING_DRAGGABLE_MIN_INDEX) {
        scene?.setStatus?.('Lightning save is disabled for this world.', '#ffb18b');
        return;
      }
      persistDraggedLightningAnchor(scene);
    };
    scene.lightningDragKeyHandler = keyHandler;
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', keyHandler);
    }
  }
}

export function setupLightningBlobControl() {
  const isMobileViewport = typeof window !== 'undefined' && window.innerWidth <= 900;
    const worldIndex = Math.max(0, Math.floor(Number(this.gameState?.selectedWorldIndex) || 0));
    const layoutId = this.activePathLayoutId || '';
    const anchor = getLightningTriggerAnchor(
      this,
      worldIndex,
      layoutId,
      Number.isFinite(this.activeWorldMapCoordinateYOffset) ? this.activeWorldMapCoordinateYOffset : 0
    );
    const anchorX = anchor.x;
    const anchorY = anchor.y + (isMobileViewport ? sy(LIGHTNING_TRIGGER_CONTROL_Y_OFFSET_MOBILE) : 0);

    if (this.lightningBlobHitZone?.active) {
      setLightningControlPosition(this, anchorX, anchorY);
      enableLightningDragForWorld(this, worldIndex);
      this.refreshLightningBlobControl();
      return;
    }

    this.lightningBlobOuter = this.add.rectangle(anchorX, anchorY, sx(150), sy(34), 0x214b86, 0.22)
      .setStrokeStyle(2, 0x7cb6ff, 0.52)
      .setDepth(70)
      .setVisible(false);
    this.lightningBlobPulse = this.add.rectangle(anchorX, anchorY, sx(136), sy(24), 0x8cb9ff, 0.18)
      .setDepth(71)
      .setVisible(false);
    this.lightningBlobCore = this.add.rectangle(anchorX, anchorY, sx(122), sy(18), 0xe4f2ff, 0.94)
      .setStrokeStyle(1, 0xffffff, 0.48)
      .setDepth(72)
      .setVisible(false);
    this.lightningBlobIcon = this.add.text(anchorX, anchorY, 'TRIGGER LIGHTNING', {
      fontFamily: 'BlackOpsOne, Trebuchet MS, sans-serif',
      fontSize: '10px',
      color: '#204a9d',
      fontStyle: 'bold',
      letterSpacing: 0.8,
    })
      .setOrigin(0.5)
      .setDepth(73)
      .setVisible(false);
    this.lightningBlobLabel = this.add.text(anchorX, anchorY + sy(28), 'BARRAGE WINDOW ONLY', {
      fontFamily: 'BlackOpsOne, Trebuchet MS, sans-serif',
      fontSize: '10px',
      color: '#b9d8ff',
      fontStyle: 'bold',
      letterSpacing: 0.8,
    })
      .setOrigin(0.5)
      .setDepth(73)
      .setVisible(false);

    this.lightningBlobHitZone = this.add.rectangle(anchorX, anchorY, sx(152), sy(36), 0xffffff, 0.001)
      .setDepth(74)
      .setVisible(false);

    this.lightningBlobHitZone.on('pointerdown', () => {
      if (this.lightningDragActive) {
        return;
      }
      this.triggerPlayerLightningFromControl();
    });

    this.lightningBlobPulseTween = this.tweens.add({
      targets: [this.lightningBlobOuter, this.lightningBlobPulse],
      scaleX: 1.05,
      scaleY: 1.1,
      alpha: { from: 0.3, to: 0.12 },
      duration: 760,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      paused: true,
    });

    enableLightningDragForWorld(this, worldIndex);
    this.refreshLightningBlobControl();
}
