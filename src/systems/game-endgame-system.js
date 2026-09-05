import {
  BASE_HEIGHT,
  BASE_WIDTH,
  BOARD_HEIGHT,
  BOARD_WIDTH,
} from './game-config-constants';
import { createBoardScalers } from './game-core-utils';
import { WORLDS } from './game-static-data';

const { sx, sy } = createBoardScalers({
  baseWidth: BASE_WIDTH,
  baseHeight: BASE_HEIGHT,
  boardWidth: BOARD_WIDTH,
  boardHeight: BOARD_HEIGHT,
});

const ATTACK_COMMANDER_PROGRESS_STORAGE_KEY = 'tdAttackCommanderV1';

function loadAttackCommanderData() {
  try {
    const raw = globalThis?.localStorage?.getItem?.(ATTACK_COMMANDER_PROGRESS_STORAGE_KEY);
    if (!raw) {
      return { level: 1, wins: 0, worldsCleared: [] };
    }
    const parsed = JSON.parse(raw);
    return {
      level: Math.max(1, Number(parsed?.level) || 1),
      wins: Math.max(0, Number(parsed?.wins) || 0),
      worldsCleared: Array.isArray(parsed?.worldsCleared) ? parsed.worldsCleared.slice() : [],
    };
  } catch (_) {
    return { level: 1, wins: 0, worldsCleared: [] };
  }
}

function saveAttackCommanderData(data) {
  try {
    globalThis?.localStorage?.setItem?.(ATTACK_COMMANDER_PROGRESS_STORAGE_KEY, JSON.stringify(data));
  } catch (_) {
    // Ignore storage failures.
  }
}

function recordAttackCommanderVictory(worldId, worldCleared) {
  const next = loadAttackCommanderData();
  next.wins = Math.max(0, Number(next.wins || 0)) + 1;
  const computedLevel = 1 + Math.floor(next.wins / 2);
  next.level = Math.max(1, Number(next.level || 1), computedLevel);
  const numericWorldId = Number(worldId);
  if (worldCleared && Number.isFinite(numericWorldId) && !next.worldsCleared.includes(numericWorldId)) {
    next.worldsCleared.push(numericWorldId);
  }
  saveAttackCommanderData(next);
  return next;
}

export function endGame() {
  const isAttackRole = this.isMultiplayerEnemyCommanderRole?.();
    const attackEndReason = String(this.gameState?.attackEndReason || '');
    const isAttackDefeat = !!(isAttackRole && attackEndReason === 'defenderHold');
    const isAttackVictory = !!(isAttackRole && !isAttackDefeat);
    this.stopAllActiveGameAudio();
    this.stopTankEngineLoop();
    this.playGameOverSfx(1, 0.96);
    this.gameState.gameOver = true;
    this.recordCommanderLeaderboardEntry?.(Math.max(0, Number(this.gameState?.score || 0)));
    if (this.mapLayer?.active) {
      this.mapLayer.setAlpha(0.2);
    }
    if (this.pathGuideOverlay?.active) {
      this.pathGuideOverlay.setVisible(false);
    }
    if (this.secondaryPathOverlay?.active) {
      this.secondaryPathOverlay.setVisible(false);
    }
    if (this.tertiaryPathOverlay?.active) {
      this.tertiaryPathOverlay.setVisible(false);
    }
    if (this.quaternaryPathOverlay?.active) {
      this.quaternaryPathOverlay.setVisible(false);
    }
    if (Array.isArray(this.extraVisualPathOverlays)) {
      this.extraVisualPathOverlays.forEach((overlay) => overlay?.active && overlay.setVisible(false));
    }
    if (Array.isArray(this.customEntranceMarkers)) {
      this.customEntranceMarkers.forEach((marker) => marker?.active && marker.setVisible(false));
    }
    [
      this.routeGuideEntryText,
      this.routeGuideCoreText,
      this.routeGuideMarker1,
      this.routeGuideLabel1,
      this.routeGuideMarker2,
      this.routeGuideLabel2,
      this.routeGuideMarker3,
      this.routeGuideLabel3,
      this.routeTwoEntranceTerrainWash,
      this.routeTwoEntranceHighlight,
      this.routeTwoEntranceImg,
      this.pauseHudButton,
      this.pauseHudButtonLabel,
      this.routeGuideToggleButton,
      this.routeGuideToggleLabel,
      this.routeGuideTogglePanel,
      this.fireDebugOverlayText,
    ].forEach((node) => {
      if (node?.active) {
        node.setVisible(false);
      }
    });
    if (this.weaponReachGlowLayer) {
      this.weaponReachGlowLayer.setVisible(false);
    }
    this.previewTower.setVisible(false);
    if (this.startWaveButton) {
      this.startWaveButton.disableInteractive();
      this.startWaveButton.setFillStyle(0x3b4f5b, 0.6);
    }

    const activeTowerCount = this.towers?.children?.entries?.filter((tower) => tower?.active).length || 0;
    const towerCapacity = Array.isArray(this.towerBaseSlots) && this.towerBaseSlots.length > 0
      ? this.towerBaseSlots.length
      : activeTowerCount;
    const elapsedMs = Math.max(0, ((this.time?.now || 0) - Number(this.waveStartedAtMs || 0)));
    const completedWave = Math.max(1, Number(this.gameState?.wave || 1));
    const nextWaveNumber = Math.max(2, completedWave + 1);
    const attackWaveCap = 10;
    const attackWorldCleared = !!(isAttackVictory && completedWave >= attackWaveCap);
    const endgameSoldierDefeated = this.enemyDefeatStats?.soldier || 0;
    const endgameTankDefeated = this.enemyDefeatStats?.tank || 0;
    const totalDefeated = Math.max(0, endgameSoldierDefeated + endgameTankDefeated);
    const orderedWorldIds = (Array.isArray(WORLDS) ? WORLDS : [])
      .map((world) => Number(world?.id))
      .filter((id) => Number.isFinite(id))
      .sort((a, b) => a - b);
    const currentWorldId = Number(this.gameState?.selectedWorldIndex);
    const currentWorldPos = orderedWorldIds.indexOf(currentWorldId);
    const hasNextWorld = isAttackVictory && attackWorldCleared && currentWorldPos >= 0 && currentWorldPos < (orderedWorldIds.length - 1);
    const nextWorldId = hasNextWorld ? orderedWorldIds[currentWorldPos + 1] : currentWorldId;
    const hasAttackNextWave = !!(isAttackVictory && !attackWorldCleared);

    if (attackWorldCleared) {
      const worldId = Number(this.gameState?.selectedWorldIndex);
      if (Number.isFinite(worldId)) {
        this.recordWorldCleared?.(worldId);
      }
    }

    if (isAttackVictory) {
      const attackProgress = recordAttackCommanderVictory(this.gameState?.selectedWorldIndex, attackWorldCleared);
      this.gameState.playerLevel = Math.max(1, Number(attackProgress.level || this.gameState?.playerLevel || 1));
    }

    const summary = {
      completedWave,
      nextWaveNumber,
      worldCleared: attackWorldCleared,
      playerLevel: Math.max(1, Number(this.getEffectivePlayerLevel?.() || this.gameState?.playerLevel || 1)),
      leveledUp: false,
      unlockedWeapon: null,
      titleText: isAttackRole
        ? (isAttackDefeat ? 'ATTACK FAILED' : 'CORE BREACHED')
        : 'CORE COLLAPSED',
      subtitleText: isAttackRole
        ? (isAttackDefeat
          ? 'Defender held the line. No breach this wave.'
          : (attackWorldCleared
          ? 'Attack victory. Sector secured.'
          : 'Attack victory. Defender lives reduced to 0.'))
        : ('Final score: ' + new Intl.NumberFormat('en-US').format(Math.max(0, Number(this.gameState?.score || 0)))),
      actionLabels: {
        replay: 'RESTART',
        continue: hasAttackNextWave ? 'NEXT WAVE' : (hasNextWorld ? 'NEXT STAGE' : 'CONTINUE'),
        home: 'MAIN MENU',
      },
      actionVisibility: {
        replay: true,
        continue: !!(!isAttackDefeat && (hasAttackNextWave || hasNextWorld)),
        home: true,
      },
      rewards: {
        supplies: 0,
        gold: 0,
        xp: 0,
      },
      stats: {
        enemiesDestroyed: totalDefeated,
        damageDealt: Math.max(0, Math.round(Number(this.waveDamageDealt || 0))),
        towersRemaining: towerCapacity > 0 ? (activeTowerCount + '/' + towerCapacity) : String(activeTowerCount),
        timeTaken: this.formatWaveTransitionDuration ? this.formatWaveTransitionDuration(elapsedMs) : '00:00',
      },
    };

    if (typeof this.showHtmlWaveTransitionSplash === 'function') {
      this.showHtmlWaveTransitionSplash(summary, (action) => {
        if (action === 'home') {
          this.returnToWorldSelectFromHud?.();
          return;
        }

        const isContinue = action === 'continue';
        const destinationWorldId = isContinue && hasNextWorld
          ? nextWorldId
          : (this.gameState?.selectedWorldIndex || 0);
        const destinationWave = isContinue
          ? (hasAttackNextWave ? nextWaveNumber : 1)
          : completedWave;
        const destinationLevel = destinationWave;

        try {
          sessionStorage.setItem('tdActiveWorld', JSON.stringify({
            worldIndex: destinationWorldId,
            difficulty: this.gameState?.selectedDifficulty || 'normal',
            selectedMode: this.gameState?.selectedMode === 'vsAiDefense' || this.gameState?.selectedMode === 'vsAiAttack'
              ? this.gameState.selectedMode
              : (this.gameState?.selectedMode === 'multiplayer' ? 'multiplayer' : 'singleplayer'),
            multiplayerRole: this.gameState?.multiplayerRole === 'defender' ? 'defender' : 'enemyCommander',
            multiplayerVariant: this.gameState?.multiplayerVariant === 'ai'
              ? 'ai'
              : (this.gameState?.multiplayerVariant === 'nearby' ? 'nearby' : 'online'),
            wave: destinationWave,
            level: destinationLevel,
            playerLevel: Math.max(1, Number(this.gameState?.playerLevel || 1)),
          }));
        } catch (_) {}

        this.scene.restart();
      });
      return;
    }

    const modalTankNudgeLeft = sx(120);
    this.enemies.children.entries.forEach((enemy) => {
      if (!enemy?.active) {
        return;
      }

      const isTank = (enemy.getData('enemyType') === 'tank') || !enemy.getData('isSoldier');
      if (!isTank) {
        return;
      }

      enemy.x -= modalTankNudgeLeft;
      const shadow = enemy.getData('shadow');
      const barBg = enemy.getData('barBg');
      const barFill = enemy.getData('barFill');
      if (shadow) {
        shadow.setPosition(enemy.x, enemy.y + sy(16));
      }
      if (barBg) {
        barBg.setPosition(enemy.x, enemy.y - sy(26));
      }
      if (barFill) {
        barFill.setPosition(enemy.x - sx(14), enemy.y - sy(26));
      }
    });

    const modalBackdropDepth = 160;
    const modalContentDepth = 161;
    const overlay = this.add.graphics().setDepth(modalBackdropDepth);
  overlay.fillStyle(0x02060d, 0.94);
    overlay.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

  overlay.fillStyle(0x050912, 0.62);
  overlay.fillRoundedRect(sx(56), sy(108), BOARD_WIDTH - sx(112), BOARD_HEIGHT - sy(220), sx(34));

    const modalWidth = Math.min(sx(620), BOARD_WIDTH - sx(80));
    const modalHeight = sy(304);
    const modalX = (BOARD_WIDTH - modalWidth) * 0.5;
    const modalY = (BOARD_HEIGHT - modalHeight) * 0.5;
    const modalCenterX = modalX + (modalWidth * 0.5);

  overlay.fillStyle(0x08111b, 1);
  overlay.lineStyle(2, 0xff8fa7, 0.65);
    overlay.fillRoundedRect(modalX, modalY, modalWidth, modalHeight, sx(28));
    overlay.strokeRoundedRect(modalX, modalY, modalWidth, modalHeight, sx(28));

    this.add.text(modalCenterX, modalY + sy(52), isAttackRole ? (isAttackDefeat ? 'ATTACK FAILED' : 'CORE BREACHED') : 'CORE COLLAPSED', {
      fontFamily: 'Trebuchet MS',
      fontSize: '44px',
      color: '#ffe8ee',
      fontStyle: 'bold',
      letterSpacing: 2,
    }).setOrigin(0.5).setDepth(modalContentDepth);

    this.add.text(modalCenterX, modalY + sy(98), isAttackRole
      ? (isAttackDefeat ? 'Defender held the line. No breach this wave.' : 'Attack victory. Defender lives reduced to 0.')
      : ('Final score: ' + this.gameState.score), {
      fontFamily: 'Trebuchet MS',
      fontSize: isAttackRole ? '24px' : '30px',
      color: '#ffd58b',
    }).setOrigin(0.5).setDepth(modalContentDepth);

    const soldierDefeated = this.enemyDefeatStats?.soldier || 0;
    const tankDefeated = this.enemyDefeatStats?.tank || 0;
    const soldierLineY = modalY + sy(138);
    const tankLineY = modalY + sy(174);
    const statIconX = modalCenterX - sx(120);

    this.add.image(statIconX, soldierLineY, 'soldierRunCp1Sheet', 0)
      .setScale(0.34)
      .setDepth(modalContentDepth);
    this.add.text(modalCenterX, soldierLineY, 'Soldiers destroyed: ' + soldierDefeated, {
      fontFamily: 'Trebuchet MS',
      fontSize: '18px',
      color: '#d8f1ff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(modalContentDepth);

    this.add.image(statIconX, tankLineY, 'gsEnemyHalftrack_' + (this.activeVisualTheme || this.getThemeVariantForLevel(this.gameState?.level || 1)))
      .setScale(0.42)
      .setDepth(modalContentDepth);
    this.add.text(modalCenterX, tankLineY, 'Tanks destroyed: ' + tankDefeated, {
      fontFamily: 'Trebuchet MS',
      fontSize: '18px',
      color: '#d8f1ff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(modalContentDepth);

    this.add.text(modalCenterX, modalY + sy(212), isAttackRole ? 'Press Restart to command another assault.' : 'Press Restart to defend the bastion again.', {
      fontFamily: 'Trebuchet MS',
      fontSize: '20px',
      color: '#9ad8ee',
    }).setOrigin(0.5).setDepth(modalContentDepth);

    const restartButton = this.add.rectangle(modalCenterX, modalY + sy(266), sx(164), sy(34), 0x164469, 0.98)
      .setStrokeStyle(2, 0x91ebff, 0.62)
      .setDepth(modalContentDepth)
      .setInteractive({ useHandCursor: true });
    this.add.text(modalCenterX, modalY + sy(266), 'RESTART', {
      fontFamily: 'Trebuchet MS',
      fontSize: '16px',
      color: '#f3fcff',
      fontStyle: 'bold',
      letterSpacing: 1,
    }).setOrigin(0.5).setDepth(modalContentDepth);

    restartButton.on('pointerdown', () => {
      try {
        sessionStorage.setItem('tdActiveWorld', JSON.stringify({
          worldIndex: this.gameState?.selectedWorldIndex || 0,
          difficulty: this.gameState?.selectedDifficulty || 'normal',
          selectedMode: this.gameState?.selectedMode === 'vsAiDefense' || this.gameState?.selectedMode === 'vsAiAttack'
            ? this.gameState.selectedMode
            : (this.gameState?.selectedMode === 'multiplayer' ? 'multiplayer' : 'singleplayer'),
          multiplayerRole: this.gameState?.multiplayerRole === 'defender' ? 'defender' : 'enemyCommander',
          multiplayerVariant: this.gameState?.multiplayerVariant === 'ai'
            ? 'ai'
            : (this.gameState?.multiplayerVariant === 'nearby' ? 'nearby' : 'online'),
          wave: Math.max(1, Number(this.gameState?.wave || 1)),
          level: Math.max(1, Number(this.gameState?.level || this.gameState?.wave || 1)),
          playerLevel: Math.max(1, Number(this.gameState?.playerLevel || 1)),
        }));
      } catch (_) {}
      this.scene.restart();
    });
}
