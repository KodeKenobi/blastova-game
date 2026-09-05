import {
  BOARD_HEIGHT,
  BASE_HEIGHT,
  BASE_WIDTH,
  BOARD_WIDTH,
} from './game-config-constants';
import { createBoardScalers } from './game-core-utils';

const { sx, sy } = createBoardScalers({
  baseWidth: BASE_WIDTH,
  baseHeight: BASE_HEIGHT,
  boardWidth: BOARD_WIDTH,
  boardHeight: BOARD_HEIGHT,
});

export function setupUI() {
    // Guard: HUD already exists — just refresh values and make visible
    if (this.hudPanel) {
      this.setupLightningBlobControl?.();
      this.updateHud();
      return;
    }

    const panelTop = sy(14);
    const panelHeight = sy(78);

    const panel = this.add.graphics();
    panel.fillStyle(0x000000, 1);
    panel.lineStyle(2, 0x222222, 0.6);
    panel.fillRoundedRect(sx(24), panelTop, BOARD_WIDTH - sx(48), panelHeight, sx(14));
    panel.strokeRoundedRect(sx(24), panelTop, BOARD_WIDTH - sx(48), panelHeight, sx(14));
    panel.lineStyle(1, 0x333333, 0.4);
    panel.lineBetween(sx(300), sy(24), sx(300), sy(84));
    panel.lineBetween(sx(760), sy(24), sx(760), sy(84));
    this.hudPanel = panel;
    // Keep Phaser panel invisible when HTML overlay is active
    if (this.useHtmlHudOverlay) panel.setVisible(false);

    const commanderName = this.getCommanderDisplayName ? this.getCommanderDisplayName() : (this.loadCommanderData?.().name || 'Player');
    const hudTitle = this.add.text(sx(40), sy(28), commanderName, {
      fontFamily: 'Trebuchet MS',
      fontSize: '20px',
      color: '#f3fbff',
      fontStyle: 'bold',
      letterSpacing: 1.5,
    });
    this.hudCommanderNameText = hudTitle;

    const labelStyle = {
      fontFamily: 'Trebuchet MS',
      fontSize: '11px',
      color: '#77a7bf',
      letterSpacing: 1.2,
    };
    const valueStyle = {
      fontFamily: 'Trebuchet MS',
      fontSize: '18px',
      color: '#f5fcff',
      fontStyle: 'bold',
    };

    const goldLabel = this.add.text(sx(40), sy(50), 'GOLD', labelStyle);
    this.goldText = this.add.text(sx(40), sy(64), '', valueStyle);
    const livesLabel = this.add.text(sx(126), sy(50), 'LIVES', labelStyle);
    this.livesText = this.add.text(sx(126), sy(64), '', valueStyle);
    const waveLabel = this.add.text(sx(214), sy(50), 'WAVE', labelStyle);
    this.waveText = this.add.text(sx(214), sy(64), '', valueStyle);

    const playerLevelLabel = this.add.text(sx(286), sy(50), 'PLAYER LVL', labelStyle);
    this.playerLevelText = this.add.text(sx(286), sy(64), '', valueStyle);

    this.scoreText = this.add.text(sx(372), sy(34), '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '20px',
      color: '#ffd58b',
      fontStyle: 'bold',
    });

    this.statusText = this.add.text(sx(372), sy(58), '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '13px',
      color: '#9ad8ee',
      wordWrap: {
        width: sx(360),
        useAdvancedWrap: true,
      },
    });

    const protocolTextX = sx(560);
    const protocolCenterY = panelTop + (panelHeight * 0.5);
    const protocolLineGap = sy(20);

    const protocolTitle = this.add.text(protocolTextX, protocolCenterY - protocolLineGap, 'DEFENSE PROTOCOL', {
      fontFamily: 'Trebuchet MS',
      fontSize: '15px',
      color: '#f4fbff',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const protocolHint = this.add.text(protocolTextX, protocolCenterY, 'Select a weapon to arm it, move your mouse/finger to aim, then tap the map to place. Drag still works too.', {
      fontFamily: 'Trebuchet MS',
      fontSize: '12px',
      color: '#9bc8db',
      wordWrap: {
        width: sx(170),
        useAdvancedWrap: true,
      },
    }).setOrigin(0, 0.5);

    const protocolMeta = this.add.text(protocolTextX, protocolCenterY + protocolLineGap, 'Costs vary • Auto-target • Defend the core', {
      fontFamily: 'Trebuchet MS',
      fontSize: '11px',
      color: '#ffd58b',
    }).setOrigin(0, 0.5);

    const settingsGearX = BOARD_WIDTH - sx(58);
    const settingsY = panelTop + (panelHeight * 0.5);
    const settingsGearY = panelTop + (panelHeight * 0.32);
    const homeButtonY = panelTop + (panelHeight * 0.68);
    const hudControlX = settingsGearX - sx(135);
    const hudControlWidth = sx(90);
    const hudControlHeight = sy(20);

    this.pauseHudButton = this.add.rectangle(hudControlX, settingsY - sy(11), hudControlWidth, hudControlHeight, 0x19364e, 0.96)
      .setInteractive({ useHandCursor: true });
    this.pauseHudButtonLabel = this.add.text(hudControlX, settingsY - sy(11), 'PAUSE', {
      fontFamily: 'Trebuchet MS',
      fontSize: '10px',
      color: '#def4ff',
      fontStyle: 'bold',
      letterSpacing: 0.8,
    }).setOrigin(0.5);

    this.restartHudButton = this.add.rectangle(hudControlX, settingsY + sy(11), hudControlWidth, hudControlHeight, 0x244a33, 0.96)
      .setInteractive({ useHandCursor: true });
    this.restartHudButtonLabel = this.add.text(hudControlX, settingsY + sy(11), 'RESTART', {
      fontFamily: 'Trebuchet MS',
      fontSize: '10px',
      color: '#e9fff3',
      fontStyle: 'bold',
      letterSpacing: 0.8,
    }).setOrigin(0.5);

    this.pauseHudButton.on('pointerdown', () => {
      this.togglePlayerPause();
    });
    this.pauseHudButtonLabel.setInteractive({ useHandCursor: true });
    this.pauseHudButtonLabel.on('pointerdown', () => {
      this.togglePlayerPause();
    });
    this.restartHudButton.on('pointerdown', () => {
      this.restartFromHud();
    });
    this.restartHudButtonLabel.setInteractive({ useHandCursor: true });
    this.restartHudButtonLabel.on('pointerdown', () => {
      this.restartFromHud();
    });

    this.audioSettingsButton = this.add.circle(settingsGearX, settingsGearY, sx(11), 0x173a5e, 0.96)
      .setInteractive({ useHandCursor: true });
    this.audioSettingsGearShape = this.add.star(settingsGearX, settingsGearY, 8, sx(4.2), sx(7.1), 0xdef4ff, 1)
      .setDepth(6.2);
    this.audioSettingsGearCore = this.add.circle(settingsGearX, settingsGearY, sx(2.15), 0x173a5e, 1)
      .setDepth(6.3);

    this.audioSettingsButtonLabel = this.add.text(settingsGearX + sx(18), settingsGearY, 'SETTINGS', {
      fontFamily: 'Trebuchet MS',
      fontSize: '8px',
      color: '#def4ff',
      fontStyle: 'bold',
      letterSpacing: 0.9,
    }).setOrigin(0, 0.5);

    this.audioSettingsButton.on('pointerdown', () => {
      this.toggleAudioSettingsPanel();
    });

    this.audioSettingsButtonLabel.setInteractive({ useHandCursor: true });
    this.audioSettingsButtonLabel.on('pointerdown', () => {
      this.toggleAudioSettingsPanel();
    });

    this.homeButton = this.add.circle(settingsGearX, homeButtonY, sx(11), 0x173a5e, 0.96)
      .setInteractive({ useHandCursor: true });
    this.homeButtonIcon = this.add.text(settingsGearX, homeButtonY, '⌂', {
      fontFamily: 'Trebuchet MS',
      fontSize: '22px',
      color: '#def4ff',
    }).setOrigin(0.5, 0.55)
      .setDepth(6.2);
    this.homeButtonLabel = this.add.text(settingsGearX + sx(18), homeButtonY, 'HOME', {
      fontFamily: 'Trebuchet MS',
      fontSize: '8px',
      color: '#def4ff',
      fontStyle: 'bold',
      letterSpacing: 0.9,
    }).setOrigin(0, 0.5);

    const onHomeClick = () => this.returnToWorldSelectFromHud();
    this.homeButton.on('pointerdown', onHomeClick);
    this.homeButtonLabel.setInteractive({ useHandCursor: true });
    this.homeButtonLabel.on('pointerdown', onHomeClick);

    this.phaserTopHudElements = [
      this.hudPanel,
      hudTitle,
      goldLabel,
      this.goldText,
      livesLabel,
      this.livesText,
      waveLabel,
      this.waveText,
      playerLevelLabel,
      this.playerLevelText,
      this.scoreText,
      this.statusText,
      protocolTitle,
      protocolHint,
      protocolMeta,
      this.pauseHudButton,
      this.pauseHudButtonLabel,
      this.restartHudButton,
      this.restartHudButtonLabel,
      this.audioSettingsButton,
      this.audioSettingsGearShape,
      this.audioSettingsGearCore,
      this.audioSettingsButtonLabel,
      this.homeButton,
      this.homeButtonIcon,
      this.homeButtonLabel,
    ].filter(Boolean);

    this.hudStaticTexts = [
      hudTitle,
      goldLabel,
      livesLabel,
      waveLabel,
      playerLevelLabel,
      protocolTitle,
      protocolHint,
      protocolMeta,
      this.pauseHudButton,
      this.pauseHudButtonLabel,
      this.restartHudButton,
      this.restartHudButtonLabel,
      this.audioSettingsButton,
      this.audioSettingsGearShape,
      this.audioSettingsGearCore,
      this.audioSettingsButtonLabel,
      this.homeButton,
      this.homeButtonIcon,
      this.homeButtonLabel,
      this.startWaveButton,
      this.startWaveButtonLabel,
      this.waveCountdownText,
    ];

    this.updatePauseHudButton();

    if (this.useHtmlHudOverlay) {
      this.setupHtmlHudOverlay();
      this.setPhaserTopHudVisible(false);
    }

    this.setupAudioSettingsPanel();
    this.setupLightningBlobControl();

    if (this.input?.keyboard) {
      this.input.keyboard.on('keydown-ESC', () => {
        if (this.audioSettingsPanel?.visible) {
          this.toggleAudioSettingsPanel(false);
        }
      });
    }

    this.updateHud();
    this.restoreHudAndTrayVisibility();
}

