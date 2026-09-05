import {
  BASE_HEIGHT,
  BASE_WIDTH,
  BOARD_HEIGHT,
  BOARD_WIDTH,
} from './game-config-constants';
import { createBoardScalers } from './game-core-utils';

const { sx, sy } = createBoardScalers({
  baseWidth: BASE_WIDTH,
  baseHeight: BASE_HEIGHT,
  boardWidth: BOARD_WIDTH,
  boardHeight: BOARD_HEIGHT,
});

export function setupBuildPhaseControls(helpers = {}) {
    const {
      getWeaponTrayLabel = (weapon) => String(weapon?.name || ''),
      vibrateImpact = () => {},
      vibrateSelectionChanged = () => {},
    } = helpers;

    // HTML tray mode: do not create Phaser tray or chevron fallback objects.
    if (this.useHtmlWeaponTray) {
      if (!Array.isArray(this.weaponHudCards) || this.weaponHudCards.length !== 3) {
        this.weaponHudCards = [0, 1, 2].map((slotIndex) => ({
          card: null,
          image: null,
          numberLabel: null,
          towerDef: null,
          slotIndex,
        }));
      }
      this.trayTowers = [];
      this.blueprintOverlayPendingOpen = false;
      this.setupBlueprintOverlay();
      this.updateBlueprintChevronState();
      this.renderWeaponCarousel();
      return;
    }

    // Guard: tray already exists — just refresh weapon carousel
    if (this.trayBackground) {
      this.renderWeaponCarousel();
      return;
    }

    const trayBottomGap = sy(14);
    const trayHeight = sy(86);
    const trayTop = BOARD_HEIGHT - trayBottomGap - trayHeight;
    const trayCenterY = trayTop + (trayHeight * 0.5);
    const innerPanelHeight = sy(58);
    const innerPanelTop = trayCenterY - (innerPanelHeight * 0.5);

    const tray = this.add.graphics();
    tray.fillStyle(0x0a1422, 0.96);
    tray.lineStyle(2, 0x59bfff, 0.2);
    tray.fillRoundedRect(sx(22), trayTop, sx(956), trayHeight, sx(18));
    tray.strokeRoundedRect(sx(22), trayTop, sx(956), trayHeight, sx(18));
    this.trayBackground = tray;

    const chevronX = BOARD_WIDTH * 0.5;
    const chevronY = trayTop - sy(8);
    this.blueprintChevronButton = this.add.circle(chevronX, chevronY, sx(13), 0x15314f, 0.95)
      .setStrokeStyle(2, 0x5faee2, 0.86)
      .setDepth(9)
      .setInteractive({ useHandCursor: true });
    this.blueprintChevronLabel = this.add.text(chevronX, chevronY - sy(0.5), '⌃', {
      fontFamily: 'Trebuchet MS',
      fontSize: '16px',
      color: '#d5eeff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);

    this.blueprintChevronButton.on('pointerdown', () => this.toggleBlueprintOverlay());
    this.blueprintChevronLabel.setInteractive({ useHandCursor: true });
    this.blueprintChevronLabel.on('pointerdown', () => this.toggleBlueprintOverlay());
    this.blueprintOverlayPendingOpen = false;
    this.setupBlueprintOverlay();
    this.updateBlueprintChevronState();

    const drawPanel = (x, y, width, height) => {
      tray.fillStyle(0x112947, 0.92);
      tray.fillRoundedRect(x, y, width, height, sx(10));
      tray.lineStyle(2, 0x3a7bb7, 0.65);
      tray.strokeRoundedRect(x, y, width, height, sx(10));
    };

    drawPanel(sx(34), innerPanelTop, sx(120), innerPanelHeight);
    drawPanel(sx(172), innerPanelTop, sx(404), innerPanelHeight);
    drawPanel(sx(804), innerPanelTop, sx(154), innerPanelHeight);

    this.weaponPreviewCenterY = trayCenterY;
    this.weaponPreviewHalo = this.add.circle(sx(96), this.weaponPreviewCenterY, sx(33), 0x70deff, 0.08)
      .setStrokeStyle(4, 0x5bc8ff, 0.5);
    this.weaponPreviewRing = this.add.circle(sx(96), this.weaponPreviewCenterY, sx(28), 0x102849, 0.96)
      .setStrokeStyle(3, 0x2f88d3, 0.95);
    this.weaponDetailImage = this.add.image(sx(96), this.weaponPreviewCenterY - sy(2), this.selectedTowerDef?.key || this.towerCatalog[0]?.key || 'gsTurret1');
    this.weaponDetailImage.setScale(1.08).setDepth(6);
    this.weaponDetailImage.setInteractive({ draggable: true, useHandCursor: true });
    this.weaponDetailImage.setData('homeX', sx(96));
    this.weaponDetailImage.setData('homeY', this.weaponPreviewCenterY - sy(2));
    this.weaponPreviewLabel = this.add.text(sx(96), this.weaponPreviewCenterY, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '14px',
      color: '#bdefff',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5).setDepth(7).setVisible(false);

    const visibleSlots = [sx(270), sx(378), sx(486)];
    this.trayTowers = [];
    this.weaponHudCards = [];

    this.weaponCarouselPrev = this.add.text(sx(192), trayCenterY, '‹', {
      fontFamily: 'Trebuchet MS',
      fontSize: '28px',
      color: '#5bd7ff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.weaponCarouselNext = this.add.text(sx(562), trayCenterY, '›', {
      fontFamily: 'Trebuchet MS',
      fontSize: '28px',
      color: '#5bd7ff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.weaponCarouselPrev.on('pointerdown', () => this.shiftWeaponCarousel(-1));
    this.weaponCarouselNext.on('pointerdown', () => this.shiftWeaponCarousel(1));

    visibleSlots.forEach((slotX, index) => {
      const card = this.add.rectangle(slotX, trayCenterY + sy(1), sx(86), sy(32), 0x15345a, 0.98)
        .setStrokeStyle(2, 0x4d88bd, 0.55)
        .setInteractive({ useHandCursor: true })
        .setDepth(3);
      const trayTower = this.add.image(slotX, trayCenterY - sy(2), this.towerCatalog[index]?.key || this.towerCatalog[0].key)
        .setScale(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(4);
      trayTower.setData('homeX', slotX);
      trayTower.setData('homeY', trayCenterY - sy(2));
      trayTower.setData('baseScale', 0.5);
      this.input.setDraggable(trayTower);
      const towerNumber = this.add.text(slotX, trayCenterY + sy(12), '', {
        fontFamily: 'Trebuchet MS',
        fontSize: '10px',
        color: '#effbff',
        stroke: '#112338',
        strokeThickness: 3,
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(6);

      const entry = { card, image: trayTower, numberLabel: towerNumber, towerDef: null, slotIndex: index };
      const clickSelect = () => {
        if (entry.towerDef) {
          const shiftAmount = entry.slotIndex - 1;
          if (shiftAmount !== 0) {
            this.shiftWeaponCarousel(shiftAmount);
          } else {
            this.selectTowerDef(entry.towerDef);
          }
        }
      };

      card.on('pointerdown', clickSelect);
      // trayTower stays draggable but does NOT handle click — avoids triple-fire bug
      towerNumber.setInteractive({ useHandCursor: true });
      // towerNumber click delegates to card via propagation

      this.trayTowers.push(trayTower);
      this.weaponHudCards.push(entry);
    });

    this.weaponDetailBadge = this.add.text(sx(600), innerPanelTop + sy(2), 'WEAPON DETAILS', {
      fontFamily: 'Trebuchet MS',
      fontSize: '9px',
      color: '#92ebff',
      letterSpacing: 1.2,
      fontStyle: 'bold',
    });
    this.weaponDetailPanel = null;
    this.weaponDetailTitle = this.add.text(sx(600), innerPanelTop + sy(10), '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '13px',
      color: '#f5fcff',
      fontStyle: 'bold',
    });
    this.weaponDetailRole = this.add.text(sx(600), innerPanelTop + sy(22), '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '9px',
      color: '#99dfff',
      fontStyle: 'bold',
      wordWrap: {
        width: sx(188),
        useAdvancedWrap: true,
      },
    });
    this.weaponDetailStats = this.add.text(sx(600), innerPanelTop + sy(31), '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '9px',
      color: '#c4dff0',
      wordWrap: {
        width: sx(188),
        useAdvancedWrap: true,
      },
      lineSpacing: 5,
    });
    this.weaponDetailFlavor = null;
    this.weaponInfoText = null;

    this.removeTowerButton = this.add.rectangle(sx(800), trayCenterY, sx(76), sy(24), 0x3d2f2f, 0.92)
      .setStrokeStyle(2, 0x8f6969, 0.44)
      .setInteractive({ useHandCursor: true })
      .setVisible(false)
      .disableInteractive();
    this.removeTowerButtonLabel = this.add.text(sx(800), trayCenterY, 'REMOVE', {
      fontFamily: 'Trebuchet MS',
      fontSize: '11px',
      color: '#ffd7d7',
      fontStyle: 'bold',
      letterSpacing: 0.6,
    }).setOrigin(0.5)
      .setVisible(false);
    this.removeTowerButton.on('pointerdown', () => this.removeSelectedPlacedTower());
    this.removeTowerButtonLabel.setInteractive({ useHandCursor: true });
    this.removeTowerButtonLabel.on('pointerdown', () => this.removeSelectedPlacedTower());

    this.startWaveButton = this.add.rectangle(sx(882), trayCenterY, sx(128), sy(28), 0x164469, 0.98)
      .setInteractive({ useHandCursor: true });
    this.startWaveButtonLabel = this.add.text(sx(882), trayCenterY, 'START WAVE', {
      fontFamily: 'Trebuchet MS',
      fontSize: '14px',
      color: '#f3fcff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.waveCountdownText = this.add.text(sx(882), trayCenterY - sy(18), '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '11px',
      color: '#ffcf7a',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(7).setVisible(false);

    this.startWaveButton.on('pointerdown', () => {
      if (this.gameState.gameOver || !this.gameState.prepPhase) {
        return;
      }
      this.beginCombatPhase();
    });
    this.startWaveButtonLabel.setInteractive({ useHandCursor: true });
    this.startWaveButtonLabel.on('pointerdown', () => {
      if (this.gameState.gameOver || !this.gameState.prepPhase) {
        return;
      }
      this.beginCombatPhase();
    });

    this.input.on('pointermove', (pointer) => {
      if (this.draggingFromTray && this.selectedTowerDef) {
        this.updateWeaponReachGlow(pointer.worldX, pointer.worldY);
      }
    });

    this.input.on('dragstart', (pointer, gameObject) => {
      if (this.gameState.gameOver) {
        return;
      }

      const trayEntry = this.weaponHudCards.find((entry) => entry.image === gameObject);
      const fromPreviewBadge = gameObject === this.weaponDetailImage;
      if (!fromPreviewBadge && !trayEntry) {
        return;
      }

      const chosenTowerDef = fromPreviewBadge ? this.selectedTowerDef : trayEntry?.towerDef;
      if (!chosenTowerDef) {
        return;
      }

      this.draggingFromTray = true;
      if (trayEntry?.towerDef) {
        this.selectTowerDef(trayEntry.towerDef);
      }

      this.activeTrayTowerDef = chosenTowerDef;
      this._lastDragPlacementValid = false;
      this.updateWeaponReachGlow(gameObject.x, gameObject.y);
      this.previewTower.setTexture(chosenTowerDef.key);
      this.previewTower.setVisible(true);
      const unlocked = this.isWeaponUnlockedForPlayer(chosenTowerDef);
      this.previewTowerLabel.setText(unlocked ? getWeaponTrayLabel(chosenTowerDef) : ('LVL ' + chosenTowerDef.unlockLevel));
      this.previewTowerLabel.setVisible(true);
      this.previewTower.setPosition(gameObject.x, gameObject.y);
      this.previewTowerLabel.setPosition(gameObject.x, gameObject.y + sy(26));
      gameObject.setScale(fromPreviewBadge ? 1.14 : 0.62);
    });

    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      const fromPreviewBadge = gameObject === this.weaponDetailImage;
      const fromTrayCard = this.weaponHudCards.some((entry) => entry.image === gameObject);
      if (!this.draggingFromTray || (!fromPreviewBadge && !fromTrayCard)) {
        return;
      }

      gameObject.setPosition(dragX, dragY);
      this.previewTower.setPosition(dragX, dragY);
      this.previewTowerLabel.setPosition(dragX, dragY + sy(26));
      this.updateWeaponReachGlow(dragX, dragY);

      // Haptic pulse when drag enters a valid placement zone
      const nowValid = this.canPlaceTowerAt(dragX, dragY);
      if (nowValid !== this._lastDragPlacementValid) {
        if (nowValid) {
          vibrateImpact('Medium');
        } else {
          vibrateSelectionChanged();
        }
        this._lastDragPlacementValid = nowValid;
      }
    });

    this.input.on('dragend', (pointer, gameObject) => {
      const trayEntry = this.weaponHudCards.find((entry) => entry.image === gameObject);
      const fromPreviewBadge = gameObject === this.weaponDetailImage;
      if (!this.draggingFromTray || (!fromPreviewBadge && !trayEntry)) {
        return;
      }

      const towerDef = this.activeTrayTowerDef || this.selectedTowerDef;
      if (towerDef && this.tryPlaceTower(gameObject.x, gameObject.y, towerDef)) {
        this.setStatus(towerDef.name + ' turret mounted.', '#89ffd0');
      }

      this.draggingFromTray = false;
      this.activeTrayTowerDef = null;
      this._lastDragPlacementValid = false;
      this.updateWeaponReachGlow();
      this.updateTowerBaseIndicators();
      this.previewTower.setVisible(false);
      this.previewTowerLabel.setVisible(false);
      gameObject.setPosition(gameObject.getData('homeX'), gameObject.getData('homeY'));
      gameObject.setScale(fromPreviewBadge ? 1.08 : (gameObject.getData('baseScale') || 0.5));
    });

    this.animateLoadoutHud();
    this.renderWeaponCarousel();
    this.selectTowerDef(this.selectedTowerDef || this.towerCatalog[0] || null, false, { silent: true });
    this.refreshSelectedPlacedTowerDetails();
    this.restoreHudAndTrayVisibility();
}

