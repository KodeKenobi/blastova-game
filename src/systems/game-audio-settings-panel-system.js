import Phaser from 'phaser';
import { hapticTap } from '../utils/native-haptics';
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

export function setupAudioSettingsPanel() {
    if (this.audioSettingsPanel) {
      this.audioSettingsPanel.destroy(true);
    }

    const pageX = sx(54);
    const pageY = sy(34);
    const pageWidth = BOARD_WIDTH - sx(108);
    const pageHeight = BOARD_HEIGHT - sy(68);
    const titleY = pageY + sy(20);
    const rowStartY = pageY + sy(86);
    const rowGap = sy(60);
    const trackX = pageX + sx(212);
    const trackWidth = sx(420);
    const minusX = pageX + sx(652);
    const plusX = pageX + sx(690);

    const container = this.add.container(0, 0).setDepth(60).setVisible(false);

    // Landing image background
    if (this.textures.exists('landingBg')) {
      const settingsBg = this.add.image(BOARD_WIDTH / 2, BOARD_HEIGHT / 2, 'landingBg')
        .setDisplaySize(BOARD_WIDTH, BOARD_HEIGHT);
      container.add(settingsBg);
    }

    const blocker = this.add.rectangle(BOARD_WIDTH * 0.5, BOARD_HEIGHT * 0.5, BOARD_WIDTH, BOARD_HEIGHT, 0x02070d, 0.72)
      .setInteractive();
    blocker.on('pointerdown', () => {
      // Swallow clicks behind the settings page.
    });
    container.add(blocker);

    const bg = this.add.rectangle(pageX + (pageWidth * 0.5), pageY + (pageHeight * 0.5), pageWidth, pageHeight, 0x04111e, 0.78)
      .setStrokeStyle(3, 0x6bc9ff, 0.42);
    container.add(bg);

    const title = this.add.text(pageX + sx(24), titleY, 'SETTINGS', {
      fontFamily: 'Trebuchet MS',
      fontSize: '26px',
      color: '#e3f6ff',
      fontStyle: 'bold',
      letterSpacing: 1.3,
    });
    const subtitle = this.add.text(pageX + sx(24), titleY + sy(24), 'Audio and gameplay settings.', {
      fontFamily: 'Trebuchet MS',
      fontSize: '13px',
      color: '#a4d4f0',
    });

    const closeButton = this.add.rectangle(pageX + pageWidth - sx(62), pageY + sy(26), sx(88), sy(24), 0x1f4d75, 0.98)
      .setStrokeStyle(2, 0x8ee6ff, 0.65)
      .setInteractive({ useHandCursor: true });
    const closeLabel = this.add.text(pageX + pageWidth - sx(62), pageY + sy(26), 'CLOSE', {
      fontFamily: 'Trebuchet MS',
      fontSize: '12px',
      color: '#effbff',
      fontStyle: 'bold',
      letterSpacing: 1,
    }).setOrigin(0.5);

    closeButton.on('pointerdown', () => {
      hapticTap();
      this.toggleAudioSettingsPanel(false);
    });
    closeLabel.setInteractive({ useHandCursor: true });
    closeLabel.on('pointerdown', () => {
      hapticTap();
      this.toggleAudioSettingsPanel(false);
    });

    container.add(title);
    container.add(subtitle);
    container.add(closeButton);
    container.add(closeLabel);

    this.audioSettingsRows = [];

    const rows = [
      { key: 'weapon', label: 'WEAPON SHOTS' },
      { key: 'explosion', label: 'EXPLOSIONS' },
      { key: 'other', label: 'OTHER GAME SFX' },
      { key: 'music', label: 'MUSIC (FUTURE TRACKS)' },
    ];

    const applyRowValueFromWorldX = (rowRef, worldX, announce = false) => {
      const ratio = Phaser.Math.Clamp((worldX - rowRef.trackX) / rowRef.trackWidth, 0, 1);
      this.setAudioBusLevel(rowRef.key, ratio, announce);
    };

    rows.forEach((row, index) => {
      const y = rowStartY + (index * rowGap);
      const label = this.add.text(pageX + sx(24), y, row.label, {
        fontFamily: 'Trebuchet MS',
        fontSize: '14px',
        color: '#95cae6',
        fontStyle: 'bold',
      }).setOrigin(0, 0.5);

      const trackBg = this.add.rectangle(trackX, y, trackWidth, sy(10), 0x16334d, 1)
        .setOrigin(0, 0.5)
        .setStrokeStyle(1, 0x4f8ab0, 0.8)
        .setInteractive({ useHandCursor: true });

      const fill = this.add.rectangle(trackX, y, 2, sy(10), 0x77d7ff, 0.95)
        .setOrigin(0, 0.5);

      const knob = this.add.circle(trackX, y, sx(6), 0xe8f8ff, 1)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(1, 0x74c8f8, 0.95);

      const valueText = this.add.text(pageX + sx(640), y, '0%', {
        fontFamily: 'Trebuchet MS',
        fontSize: '13px',
        color: '#d9f2ff',
      }).setOrigin(0, 0.5);

      const minusBtn = this.add.rectangle(minusX, y, sx(28), sy(20), 0x19364e, 1)
        .setStrokeStyle(1, 0x5aa2cf, 0.85)
        .setInteractive({ useHandCursor: true });
      const minusLabel = this.add.text(minusX, y, '-', {
        fontFamily: 'Trebuchet MS',
        fontSize: '17px',
        color: '#d2efff',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      const plusBtn = this.add.rectangle(plusX, y, sx(28), sy(20), 0x19364e, 1)
        .setStrokeStyle(1, 0x5aa2cf, 0.85)
        .setInteractive({ useHandCursor: true });
      const plusLabel = this.add.text(plusX, y, '+', {
        fontFamily: 'Trebuchet MS',
        fontSize: '16px',
        color: '#d2efff',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      const rowRef = {
        key: row.key,
        trackX,
        trackWidth,
      };

      const beginRowDrag = (pointer, announce = false) => {
        this.audioSettingsActiveDrag = rowRef;
        applyRowValueFromWorldX(rowRef, pointer.worldX, announce);
      };

      trackBg.on('pointerdown', (pointer) => beginRowDrag(pointer, true));
      trackBg.on('pointermove', (pointer) => {
        if (!pointer.isDown || this.audioSettingsActiveDrag !== rowRef) {
          return;
        }
        applyRowValueFromWorldX(rowRef, pointer.worldX, false);
      });
      knob.on('pointerdown', (pointer) => beginRowDrag(pointer, true));
      knob.on('pointermove', (pointer) => {
        if (!pointer.isDown || this.audioSettingsActiveDrag !== rowRef) {
          return;
        }
        applyRowValueFromWorldX(rowRef, pointer.worldX, false);
      });
      minusBtn.on('pointerdown', () => {
        hapticTap();
        this.setAudioBusLevel(row.key, this.getAudioBusLevel(row.key) - 0.05, true);
      });
      plusBtn.on('pointerdown', () => {
        hapticTap();
        this.setAudioBusLevel(row.key, this.getAudioBusLevel(row.key) + 0.05, true);
      });
      minusLabel.setInteractive({ useHandCursor: true });
      plusLabel.setInteractive({ useHandCursor: true });
      minusLabel.on('pointerdown', () => {
        hapticTap();
        this.setAudioBusLevel(row.key, this.getAudioBusLevel(row.key) - 0.05, true);
      });
      plusLabel.on('pointerdown', () => {
        hapticTap();
        this.setAudioBusLevel(row.key, this.getAudioBusLevel(row.key) + 0.05, true);
      });

      container.add([label, trackBg, fill, knob, valueText, minusBtn, minusLabel, plusBtn, plusLabel]);
      this.audioSettingsRows.push({
        key: row.key,
        trackX,
        trackWidth,
        fill,
        knob,
        valueText,
      });
    });

    const routeToggleY = rowStartY + (rows.length * rowGap) + sy(34);
    const routeTitle = this.add.text(pageX + sx(24), routeToggleY - sy(16), 'MAP ROUTE GUIDES', {
      fontFamily: 'Trebuchet MS',
      fontSize: '14px',
      color: '#95cae6',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    const routeDesc = this.add.text(pageX + sx(24), routeToggleY + sy(5), 'Toggle route numbers, paths, ENTRY, CORE, and the route dots.', {
      fontFamily: 'Trebuchet MS',
      fontSize: '12px',
      color: '#a4d4f0',
      wordWrap: {
        width: sx(520),
        useAdvancedWrap: true,
      },
    }).setOrigin(0, 0.5);
    this.routeGuideToggleButton = this.add.rectangle(pageX + sx(664), routeToggleY, sx(116), sy(24), 0x235a8f, 0.98)
      .setStrokeStyle(1, 0x8ee6ff, 0.75)
      .setInteractive({ useHandCursor: true });
    this.routeGuideToggleLabel = this.add.text(pageX + sx(664), routeToggleY, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '12px',
      color: '#effbff',
      fontStyle: 'bold',
      letterSpacing: 0.8,
    }).setOrigin(0.5);
    this.routeGuideTogglePanel = this.add.container(0, 0);
    this.routeGuideTogglePanel.add([routeTitle, routeDesc, this.routeGuideToggleButton, this.routeGuideToggleLabel]);
    container.add(this.routeGuideTogglePanel);

    this.routeGuideToggleButton.on('pointerdown', () => {
      hapticTap();
      this.togglePathGuide();
    });
    this.routeGuideToggleLabel.setInteractive({ useHandCursor: true });
    this.routeGuideToggleLabel.on('pointerdown', () => {
      hapticTap();
      this.togglePathGuide();
    });

    const upgradesY = routeToggleY + sy(54);
    const upgradesButton = this.add.rectangle(pageX + sx(664), upgradesY, sx(182), sy(26), 0x235a8f, 0.98)
      .setStrokeStyle(1, 0x8ee6ff, 0.75)
      .setInteractive({ useHandCursor: true });
    const upgradesLabel = this.add.text(pageX + sx(664), upgradesY, 'WEAPON UPGRADES', {
      fontFamily: 'Trebuchet MS',
      fontSize: '11px',
      color: '#effbff',
      fontStyle: 'bold',
      letterSpacing: 0.7,
    }).setOrigin(0.5);
    const openUpgrades = () => {
      hapticTap();
      if (this.openWeaponUpgradesFromSettings) {
        this.openWeaponUpgradesFromSettings();
      }
    };
    upgradesButton.on('pointerdown', openUpgrades);
    upgradesLabel.setInteractive({ useHandCursor: true });
    upgradesLabel.on('pointerdown', openUpgrades);
    container.add([upgradesButton, upgradesLabel]);

    if (!this.audioSettingsDragHandlersBound && this.input) {
      this.input.on('pointermove', (pointer) => {
        if (!pointer.isDown || !this.audioSettingsPanel?.visible || !this.audioSettingsActiveDrag) {
          return;
        }
        applyRowValueFromWorldX(this.audioSettingsActiveDrag, pointer.worldX, false);
      });

      const clearActiveDrag = () => {
        this.audioSettingsActiveDrag = null;
      };

      this.input.on('pointerup', clearActiveDrag);
      this.input.on('gameout', clearActiveDrag);
      this.audioSettingsDragHandlersBound = true;
    }

    this.audioSettingsPanel = container;
    this.refreshAudioSettingsPanel();
}

