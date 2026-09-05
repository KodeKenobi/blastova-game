import {
  BASE_HEIGHT,
  BASE_WIDTH,
  BOARD_HEIGHT,
  BOARD_WIDTH,
  DEBUG_FLAGS,
} from './game-config-constants';
import { createBoardScalers } from './game-core-utils';

const { sx, sy } = createBoardScalers({
  baseWidth: BASE_WIDTH,
  baseHeight: BASE_HEIGHT,
  boardWidth: BOARD_WIDTH,
  boardHeight: BOARD_HEIGHT,
});

export function setupFireDebugOverlay() {
  this.fireDebugOverlayText = this.add.text(sx(26), sy(96), '', {
    fontFamily: 'Trebuchet MS',
    fontSize: '11px',
    color: '#bfe7ff',
    backgroundColor: 'rgba(5, 17, 28, 0.75)',
    padding: { x: 7, y: 5 },
    lineSpacing: 2,
  }).setDepth(20).setVisible(false);
}

export function setupDebugHotkeys() {
  if (!this.input?.keyboard) {
    return;
  }

  if (DEBUG_FLAGS.fireDebugOverlay) {
    this.input.keyboard.on('keydown-F3', () => {
      this.fireDebugOverlayEnabled = !this.fireDebugOverlayEnabled;
      if (this.fireDebugOverlayText) {
        this.fireDebugOverlayText.setVisible(this.fireDebugOverlayEnabled);
      }
      this.setStatus(
        this.fireDebugOverlayEnabled ? 'Fire debug overlay enabled.' : 'Fire debug overlay disabled.',
        '#8cf3ff'
      );
    });
  }

  if (DEBUG_FLAGS.deterministicTestScene) {
    this.input.keyboard.on('keydown-F4', () => {
      if (this.deterministicWeaponLoopEvent) {
        this.stopDeterministicWeaponLoop();
        this.setStatus('Deterministic weapon loop stopped.', '#ffd58b');
      } else {
        this.startDeterministicWeaponLoop();
        this.setStatus('Deterministic weapon loop started (tower 2).', '#89ffd0');
      }
    });
  }

  this.input.keyboard.on('keydown-P', () => {
    this.togglePlayerPause();
  });

  this.input.keyboard.on('keydown-K', () => {
    const hasPreview = Array.isArray(this.testPreviewSoldiers) && this.testPreviewSoldiers.some((entry) => entry?.active);
    if (hasPreview) {
      this.clearSoldierVisibilityTestRig?.();
      this.setStatus('TEST: Soldier preview squad cleared.', '#ffd58b');
      return;
    }
    this.setupSoldierVisibilityTestRig?.();
  });

  this.input.keyboard.on('keydown-J', () => {
    this.startSingleSoldierPathTest?.();
  });

  this.input.keyboard.on('keydown-R', () => {
    this.restartFromHud();
  });

  this.input.keyboard.on('keydown-LEFT', () => {
    if (!this.gameState?.prepPhase) return;
    this.shiftWeaponCarousel(-1);
  });
  this.input.keyboard.on('keydown-RIGHT', () => {
    if (!this.gameState?.prepPhase) return;
    this.shiftWeaponCarousel(1);
  });

  ['ONE', 'TWO', 'THREE'].forEach((keyName, i) => {
    this.input.keyboard.on('keydown-' + keyName, () => {
      if (!this.gameState?.prepPhase) return;
      const entry = this.weaponHudCards?.[i];
      if (entry?.towerDef) this.selectTowerDef(entry.towerDef);
    });
  });

  this.input.keyboard.on('keydown-ENTER', () => {
    if (!this.gameState?.prepPhase) return;
    if (this.selectedTowerDef) this.selectTowerDef(this.selectedTowerDef);
  });
  this.input.keyboard.on('keydown-SPACE', () => {
    if (this.gameState?.prepPhase && !this.gameState?.gameOver) {
      this.beginCombatPhase();
    }
  });
}

export function startDeterministicWeaponLoop() {
  if (!DEBUG_FLAGS.deterministicTestScene) {
    return;
  }

  this.stopDeterministicWeaponLoop();
  this.deterministicWeaponLoopIndex = 0;
  this.runDeterministicWeaponStep();
  this.deterministicWeaponLoopEvent = this.time.addEvent({
    delay: 1600,
    loop: true,
    callback: () => this.runDeterministicWeaponStep(),
  });

  if (this.cameras?.main) {
    this.cameras.main.setZoom(1);
    this.cameras.main.centerOn(BOARD_WIDTH * 0.5, BOARD_HEIGHT * 0.52);
  }
}

export function stopDeterministicWeaponLoop() {
  if (this.deterministicWeaponLoopEvent) {
    this.deterministicWeaponLoopEvent.remove(false);
    this.deterministicWeaponLoopEvent = null;
  }
}

export function runDeterministicWeaponStep() {
  if (!this.towerBaseSlots || this.towerBaseSlots.length < 2 || !this.towerCatalog?.length) {
    return;
  }

  const slot = this.towerBaseSlots[1];
  const weapon = this.towerCatalog[this.deterministicWeaponLoopIndex % this.towerCatalog.length];
  this.deterministicWeaponLoopIndex += 1;

  this.gameState.gold = 9999;
  this.updateHud();
  this.towers.children.entries.slice().forEach((tower) => this.destroyTower(tower));
  this.tryPlaceTower(slot.x, slot.y, weapon);
  this.setStatus('Deterministic loop: ' + weapon.name + ' on tower 2.', '#9df8ff');
}