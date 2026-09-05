import {
  BASE_HEIGHT,
  BASE_WIDTH,
  BOARD_HEIGHT,
  BOARD_WIDTH,
  DEBUG_FLAGS,
} from './game-config-constants';
import { createBoardScalers } from './game-core-utils';

const { sx } = createBoardScalers({
  baseWidth: BASE_WIDTH,
  baseHeight: BASE_HEIGHT,
  boardWidth: BOARD_WIDTH,
  boardHeight: BOARD_HEIGHT,
});

export function startWave() {
    if (this.isMultiplayerModeEnabled?.()) {
      this.startMultiplayerWave?.();
      return;
    }

    this.selectedPlacedTower = null;
    this.refreshSelectedPlacedTowerDetails?.();

    // Guarantee combat state so the update loop consumes spawnPlan.
    this.gameState.prepPhase = false;
    this.gameplayPauseActive = false;

    // Reset lives at the start of every wave.
    const difficultyLives = Math.max(1, Number(this.getDifficultyConfig?.()?.lives || this.gameState?.lives || 1));
    this.gameState.lives = difficultyLives;
    this.updateHud?.();

    const waveNumber = Math.max(1, this.gameState.wave || 1);
    this.applyWaveAtmosphereProfile(waveNumber);
    const waveTier = waveNumber - 1;
    const isBossWave = waveNumber % 10 === 0;
  const isWorld6TwinPeaks = this.activePathLayoutId === 'twin-peaks';
    const isWorld9Highland = this.activePathLayoutId === 'highland';
  const worldIndex = Math.max(0, Number(this.gameState?.selectedWorldIndex) || 0);
  const worldWaveLengthMult = Math.min(1.18, 1 + (worldIndex * 0.02));

    // Pace tuning: lower early-wave crowding while preserving late-wave pressure.
    if (isBossWave) {
      this.spawnBatchCount = Math.min(4, 2 + Math.floor(waveTier / 8));
      this.spawnBatchSize  = Math.min(5, 3 + Math.floor(waveTier * 0.12));
      this.spawnTankGroupSize = Math.min(7, 3 + Math.floor(waveTier / 4));
    } else {
      this.spawnBatchCount = Math.min(3, 2 + Math.floor(waveTier / 7));
      this.spawnBatchSize  = Math.min(4, 2 + Math.floor(waveTier * 0.1));
      this.spawnTankGroupSize = Math.min(4, 2 + Math.floor(waveTier / 4));
    }

    // Higher worlds run longer waves by increasing total spawn volume.
    this.spawnBatchCount = Math.max(1, Math.round(this.spawnBatchCount * worldWaveLengthMult));
    this.spawnBatchSize = Math.max(1, Math.round(this.spawnBatchSize * worldWaveLengthMult));
    this.spawnTankGroupSize = Math.max(1, Math.round(this.spawnTankGroupSize * worldWaveLengthMult));
    this.spawnEliteEvery = waveNumber >= 8 ? 2 : 3;
    this.spawnEliteGroupSize = Math.min(4, 1 + Math.floor(waveTier * 0.24));

    this.enemiesSpawned = 0;
    this.enemiesResolved = 0;
    this.enemiesDefeated = 0;
    this.waveLeaksThisWave = 0;
    this.waveStartedAtMs = this.time.now;
    this.waveDamageDealt = 0;
    this.waveSuppliesEarned = 0;
    this.branchSpawnCycle = 0;
    this.nextEnemyTime = this.time.now + 220;

    // Boss wave announcements and bonuses
    if (isBossWave) {
      const bossNum = waveNumber / 10;
      this.time.delayedCall(400, () => {
        this.setStatus('🔴 BOSS WAVE ' + waveNumber + '! All routes at maximum pressure — hold every front!', '#ff4444');
      });
      // Gold bonus for boss wave
      this.gameState.gold += 140 + (bossNum * 45);
      // Weapon 17 permanently unlocks at first boss wave
      if (waveNumber === 10) {
        const cmdData = this.loadCommanderData();
        cmdData.playerLevel = Math.max(cmdData.playerLevel || 1, 15);
        this.saveCommanderData(cmdData);
        this.gameState.playerLevel = Math.max(this.gameState.playerLevel, 15);
        this.updateWeaponUnlockState();
        this.time.delayedCall(1800, () => {
          this.setStatus('★ RAVAGER Mk1 UNLOCKED — the ultimate weapon is yours. Use it well.', '#ffd700');
        });
      }
      this.updateHud();
    }
    this.spawnBatchIntraGap = Math.max(120, 168 - (waveTier * 3));
    this.spawnBatchInterGap = Math.max(620, 1020 - (waveTier * 20));
    this.spawnSoldierToTankGap = Math.max(700, 1000 - (waveTier * 20));
    this.spawnTankToSoldierGap = Math.max(540, 920 - (waveTier * 20));
    this.spawnTankIntraGap = Math.max(98, 144 - (waveTier * 3));

    // Distances enforce visible spacing between units while allowing follow-up pressure.
    this.spawnSoldierPackDistance = sx(150);
    this.spawnElitePackDistance = sx(14);
    this.spawnTankConvoyDistance = sx(100);
    this.spawnPlanePackDistance = sx(104);
    this.spawnSoldierToEliteDistance = sx(82);
    this.spawnEliteToTankDistance = sx(102);
    this.spawnEliteToPlaneDistance = sx(100);
    this.spawnPlaneToTankDistance = sx(104);
    this.spawnUnitToUnitDistance = sx(130);
    this.spawnFormationToFormationDistance = sx(150);

    this.lastSpawnMeta = null;
    this.spawnStepBlockedSince = 0;
    this.currentBatchIndex = 0;
    this.currentBatchSpawned = 0;
    this.spawnPlan = [];
    this.lastAnnouncedBarrageTag = null;

    const availableRouteKeys = (() => {
      if (Array.isArray(this.customSpawnRoutes) && this.customSpawnRoutes.length > 0) {
        const routeKeys = this.customSpawnRoutes
          .map((route) => String(route?.key || '').trim())
          .filter((key) => key.length > 0);
        return routeKeys.length > 0 ? routeKeys : ['route1'];
      }
      const keys = ['route1'];
      if (this.secondaryPath && !this.branchPathsVisualOnly) keys.push('route2');
      if (this.tertiaryPath && !this.branchPathsVisualOnly) keys.push('route3');
      if (this.quaternaryPath && !this.branchPathsVisualOnly) keys.push('route4');
      return keys;
    })();
    let routeCursor = availableRouteKeys.length > 0
      ? ((waveNumber + worldIndex) % availableRouteKeys.length)
      : 0;
    const allocRouteSpan = (spanSize = 1) => {
      const safeSpan = Math.max(1, Number(spanSize) || 1);
      const start = routeCursor;
      routeCursor = (routeCursor + safeSpan) % availableRouteKeys.length;
      return start;
    };
    const routeKeyFromSpan = (spanStart, index = 0) => {
      const safeIndex = Math.max(0, Number(index) || 0);
      return availableRouteKeys[(spanStart + safeIndex) % availableRouteKeys.length] || 'route1';
    };

    const barrageBatchSet = new Set();
    // Real barrages should be rare pressure spikes, not a constant wave identity.
    if (waveNumber >= 5) {
      const barrageBatch = Math.max(2, Math.min(this.spawnBatchCount - 1, Math.floor(this.spawnBatchCount * 0.82)));
      barrageBatchSet.add(barrageBatch);
    }
    if (isBossWave && waveNumber >= 10 && this.spawnBatchCount > 4) {
      barrageBatchSet.add(Math.max(2, Math.min(this.spawnBatchCount - 1, Math.floor(this.spawnBatchCount * 0.92))));
    }

    const pushUnitGroup = (enemyType, count, intraDelay, intraDistance, preUnitDistance, getExtraStepData = null) => {
      for (let unitIndex = 0; unitIndex < count; unitIndex += 1) {
        const isFirstOverall = this.spawnPlan.length === 0;
        const extraStepData = typeof getExtraStepData === 'function'
          ? (getExtraStepData(unitIndex, count) || {})
          : (getExtraStepData || {});
        this.spawnPlan.push({
          enemyType,
          delayAfter: intraDelay,
          minGapFromPrev: isFirstOverall ? 0 : (unitIndex === 0 ? preUnitDistance : intraDistance),
          ...extraStepData,
        });
      }
    };

    const setLastDelay = (delayAfter) => {
      if (!this.spawnPlan.length) {
        return;
      }
      this.spawnPlan[this.spawnPlan.length - 1].delayAfter = delayAfter;
    };

    const pushParallelRoutePressurePulse = (enemyType = 'soldier') => {
      if (availableRouteKeys.length <= 1) {
        return;
      }
      const pulseRoutes = availableRouteKeys.slice(0, Math.min(4, availableRouteKeys.length));
      pulseRoutes.forEach((routeKey, idx) => {
        this.spawnPlan.push({
          enemyType,
          forcedRouteKey: routeKey,
          minGapFromPrev: 0,
          delayAfter: idx < pulseRoutes.length - 1 ? 0 : Math.max(70, Math.round(this.spawnBatchIntraGap * 0.62)),
        });
      });
    };

    const getAlternatingRouteOrder = () => {
      const ordered = [];
      for (let idx = 0; idx < availableRouteKeys.length; idx += 2) {
        ordered.push(availableRouteKeys[idx]);
      }
      for (let idx = 1; idx < availableRouteKeys.length; idx += 2) {
        ordered.push(availableRouteKeys[idx]);
      }
      return ordered;
    };

    const pushInitialEntranceVolley = () => {
      if (availableRouteKeys.length <= 1) {
        return;
      }
      const openerType = waveNumber >= 4 ? 'raider' : 'soldier';
      const orderedRoutes = getAlternatingRouteOrder();
      orderedRoutes.forEach((routeKey, idx) => {
        this.spawnPlan.push({
          enemyType: openerType,
          forcedRouteKey: routeKey,
          minGapFromPrev: 0,
          delayAfter: idx < orderedRoutes.length - 1 ? 0 : Math.max(95, Math.round(this.spawnBatchIntraGap * 0.68)),
        });
      });
    };

    const buildDynamicWorld1Wave1Plan = () => {
      const difficultyKey = String(this.gameState?.selectedDifficulty || 'normal').toLowerCase();
      const difficultyScale = difficultyKey === 'easy' ? 0.9 : (difficultyKey === 'hard' ? 1.12 : 1);
      const safeCount = (base) => Math.max(1, Math.round(base * difficultyScale));
      const dynamicCadenceMs = Math.max(90, Math.round((this.spawnBatchIntraGap || 120) * 0.9));
      const dynamicWindowGapMs = Math.max(360, Math.round((this.spawnTankToSoldierGap || 760) * 0.72));
      const dynamicHeavyGapMs = Math.max(520, Math.round((this.spawnSoldierToTankGap || 820) * 0.85));
      const dynamicRoutes = availableRouteKeys.slice();
      const routeAt = (index) => dynamicRoutes[index % Math.max(1, dynamicRoutes.length)] || 'route1';

      // Strategy pulse:
      // 1) Plane opener, 2) distributed soldiers, 3) distributed tanks,
      // 4) distributed humvees, 5) breathing window, 6) grenadier reinforcement.
      pushUnitGroup(
        'plane',
        4,
        Math.max(140, this.spawnTankIntraGap + 60),
        this.spawnPlanePackDistance,
        this.spawnUnitToUnitDistance,
        (unitIndex) => ({
          forcedRouteKey: routeAt(unitIndex),
          planeLane: ['top', 'middle', 'bottom', 'middle'][unitIndex % 4],
          planeDirection: 'east',
        })
      );
      setLastDelay(Math.max(180, dynamicHeavyGapMs));

      const openingSoldierCount = safeCount(3);
      const openingSoldierRouteSpan = allocRouteSpan(openingSoldierCount);
      pushUnitGroup(
        'soldier',
        openingSoldierCount,
        dynamicCadenceMs,
        this.spawnSoldierPackDistance,
        this.spawnFormationToFormationDistance,
        (unitIndex) => ({ forcedRouteKey: routeKeyFromSpan(openingSoldierRouteSpan, unitIndex) })
      );
      setLastDelay(dynamicHeavyGapMs);

      const openingTankCount = safeCount(2);
      const openingTankRouteSpan = allocRouteSpan(openingTankCount);
      pushUnitGroup(
        'tank',
        openingTankCount,
        Math.max(dynamicHeavyGapMs, this.spawnTankIntraGap + 40),
        this.spawnTankConvoyDistance,
        this.spawnEliteToTankDistance,
        (unitIndex) => ({ forcedRouteKey: routeKeyFromSpan(openingTankRouteSpan, unitIndex) })
      );
      setLastDelay(dynamicWindowGapMs);

      const openingHumveeCount = safeCount(2);
      const openingHumveeRouteSpan = allocRouteSpan(openingHumveeCount);
      pushUnitGroup(
        'humvee',
        openingHumveeCount,
        Math.max(dynamicCadenceMs + 70, this.spawnBatchIntraGap + 60),
        this.spawnTankConvoyDistance + 26,
        this.spawnFormationToFormationDistance + 22,
        (unitIndex) => ({ forcedRouteKey: routeKeyFromSpan(openingHumveeRouteSpan, unitIndex) })
      );
      setLastDelay(Math.max(420, dynamicWindowGapMs + 90));

      const openingGrenadierCount = safeCount(1);
      const openingGrenadierRouteSpan = allocRouteSpan(openingGrenadierCount);
      pushUnitGroup(
        'grenadier',
        openingGrenadierCount,
        Math.max(dynamicCadenceMs, this.spawnBatchIntraGap),
        this.spawnSoldierPackDistance,
        this.spawnSoldierToEliteDistance,
        (unitIndex) => ({ forcedRouteKey: routeKeyFromSpan(openingGrenadierRouteSpan, unitIndex) })
      );
      // Long pause before mid-wave so the opening push fully clears the entrance.
      setLastDelay(9000);

      // Mid-wave plane sweep — arrives well after opening.
      pushUnitGroup(
        'plane',
        3,
        Math.max(140, this.spawnTankIntraGap + 60),
        this.spawnPlanePackDistance,
        this.spawnFormationToFormationDistance,
        (unitIndex) => ({
          forcedRouteKey: routeAt(unitIndex + 1),
          planeLane: ['bottom', 'top', 'middle'][unitIndex % 3],
          planeDirection: 'east',
        })
      );
      setLastDelay(dynamicWindowGapMs);

      pushParallelRoutePressurePulse('soldier');
      setLastDelay(Math.max(120, dynamicCadenceMs));

      // Follow-up soldier pulse.
      pushUnitGroup(
        'soldier',
        safeCount(2),
        dynamicCadenceMs,
        this.spawnSoldierPackDistance,
        this.spawnFormationToFormationDistance,
        { forcedRouteKey: 'route1' }
      );
      // Long pause before late reinforcements.
      setLastDelay(10000);

      // Late-wave reinforcements include a short barrage-tagged segment so
      // World 1 Wave 1 always exposes a real lightning trigger window.
      const lateReinforcementRouteSpan = allocRouteSpan(Math.max(2, this.spawnBatchSize - 1));
      pushUnitGroup(
        'soldier',
        Math.max(2, this.spawnBatchSize - 1),
        this.spawnBatchIntraGap,
        this.spawnSoldierPackDistance,
        this.spawnFormationToFormationDistance,
        (unitIndex) => ({
          forcedRouteKey: routeKeyFromSpan(lateReinforcementRouteSpan, unitIndex),
          isBarrage: unitIndex < 2,
          barrageTag: unitIndex < 2 ? 'w1w1-lightning-window' : undefined,
        })
      );
      pushUnitGroup(
        'plane',
        2,
        Math.max(140, this.spawnTankIntraGap + 60),
        this.spawnPlanePackDistance,
        this.spawnPlaneToTankDistance,
        (unitIndex) => ({
          forcedRouteKey: routeAt(unitIndex),
          planeLane: ['top', 'bottom'][unitIndex % 2],
          planeDirection: 'east',
        })
      );
      setLastDelay(dynamicWindowGapMs);
    };

    const isWorld1Wave1 = worldIndex === 0 && waveNumber === 1;
    pushInitialEntranceVolley();
    if (isWorld1Wave1) {
      buildDynamicWorld1Wave1Plan();
    }

    for (let batchIndex = 0; batchIndex < this.spawnBatchCount && !isWorld1Wave1; batchIndex += 1) {
      const soldierRouteSpan = allocRouteSpan(this.spawnBatchSize);
      pushUnitGroup(
        'soldier',
        this.spawnBatchSize,
        this.spawnBatchIntraGap,
        this.spawnSoldierPackDistance,
        this.spawnFormationToFormationDistance,
        (unitIndex) => ({ forcedRouteKey: routeKeyFromSpan(soldierRouteSpan, unitIndex) })
      );
      setLastDelay(this.spawnSoldierToTankGap);

      const grenadierCount = Math.max(1, Math.floor(this.spawnBatchSize * 0.3));
      const grenadierRouteSpan = allocRouteSpan(grenadierCount);
      pushUnitGroup(
        'grenadier',
        grenadierCount,
        this.spawnBatchIntraGap,
        this.spawnSoldierPackDistance,
        sx(90),
        (unitIndex) => ({ forcedRouteKey: routeKeyFromSpan(grenadierRouteSpan, unitIndex) })
      );
      setLastDelay(this.spawnSoldierToTankGap);

      const shouldSpawnRoutePulse = availableRouteKeys.length > 1
        && waveNumber >= 2
        && (isBossWave || ((batchIndex % 2) === 0));
      if (shouldSpawnRoutePulse) {
        pushParallelRoutePressurePulse(waveNumber >= 4 ? 'raider' : 'soldier');
        setLastDelay(Math.max(420, this.spawnBatchIntraGap + 180));
      }

      // Humvee squad after soldiers, before elite/tanks
      if (waveNumber >= 2) {
        const humveeCount = Math.max(1, Math.floor(this.spawnBatchSize * 0.34));
        const humveeRouteSpan = allocRouteSpan(humveeCount);
        pushUnitGroup(
          'humvee',
          humveeCount,
          this.spawnBatchIntraGap + 30,
          this.spawnTankConvoyDistance + 18,
          this.spawnFormationToFormationDistance,
          (unitIndex) => ({ forcedRouteKey: routeKeyFromSpan(humveeRouteSpan, unitIndex) })
        );
        setLastDelay(this.spawnSoldierToTankGap);
      }

      // Elite heavy-soldier squad as its own formation unit.
      const shouldSpawnEliteGroup = !isWorld6TwinPeaks
        && this.spawnEliteGroupSize > 0
        && (((batchIndex + 1) % (this.spawnEliteEvery || 2)) === 0);
      if (shouldSpawnEliteGroup) {
        const eliteRouteSpan = allocRouteSpan(this.spawnEliteGroupSize);
        pushUnitGroup(
          'eliteSoldier',
          this.spawnEliteGroupSize,
          Math.max(70, this.spawnBatchIntraGap + 10),
          this.spawnElitePackDistance,
          this.spawnSoldierToEliteDistance,
          (unitIndex) => ({ forcedRouteKey: routeKeyFromSpan(eliteRouteSpan, unitIndex) })
        );
        setLastDelay(this.spawnSoldierToTankGap);
      }

      const shouldSpawnPlaneGroup = (waveNumber >= 11 || !isWorld9Highland)
        && (isBossWave || waveNumber >= 3 || waveNumber === 1)
        && (isBossWave || waveNumber >= 6 || ((batchIndex % 2) === 1));
      if (shouldSpawnPlaneGroup) {
        const planeGroupSize = waveNumber === 1 ? 2 : (waveNumber >= 9 ? 4 : (waveNumber >= 5 ? 3 : 2));
        const planeRouteSpan = allocRouteSpan(planeGroupSize);
        const planeLanePattern = ['top', 'middle', 'bottom', 'middle'];
        const planeDirectionPattern = ['east'];
        pushUnitGroup(
          'plane',
          planeGroupSize,
          Math.max(120, this.spawnTankIntraGap + 40),
          this.spawnPlanePackDistance,
          shouldSpawnEliteGroup ? this.spawnEliteToPlaneDistance : this.spawnUnitToUnitDistance,
          (unitIndex) => ({
            forcedRouteKey: routeKeyFromSpan(planeRouteSpan, unitIndex),
            planeLane: planeLanePattern[unitIndex],
            planeDirection: planeDirectionPattern[unitIndex % planeDirectionPattern.length],
          })
        );
        setLastDelay(this.spawnSoldierToTankGap + 240);
      }

      if (!isWorld6TwinPeaks && !isWorld9Highland && waveNumber >= 3) {
        const tankRouteSpan = allocRouteSpan(this.spawnTankGroupSize);
        // Tank convoy unit with multiple tanks following each other.
        pushUnitGroup(
          'tank',
          this.spawnTankGroupSize,
          this.spawnTankIntraGap,
          this.spawnTankConvoyDistance,
          shouldSpawnPlaneGroup
            ? this.spawnPlaneToTankDistance
            : (shouldSpawnEliteGroup ? this.spawnEliteToTankDistance : this.spawnUnitToUnitDistance),
          (unitIndex) => ({ forcedRouteKey: routeKeyFromSpan(tankRouteSpan, unitIndex) })
        );
      }

      const shouldSpawnBarrage = barrageBatchSet.has(batchIndex);
      if (shouldSpawnBarrage) {
        const barrageIndex = 1 + (batchIndex % 2);
        const barrageSoldierCount = Math.max(1, Math.round(this.spawnBatchSize * 0.25));
        const barrageTankCount = (isWorld6TwinPeaks || isWorld9Highland)
          ? 0
          : (waveNumber >= 2 ? Math.max(2, Math.ceil(this.spawnTankGroupSize * 1.2)) : 0);
        const barragePlaneCount = isWorld9Highland
          ? 0
          : (waveNumber >= 8 ? 7 : (waveNumber >= 4 ? 5 : 3));
        const barrageTag = 'wave-' + waveNumber + '-barrage-' + barrageIndex;
        const barrageHumveeRouteSpan = allocRouteSpan(barrageSoldierCount);

        pushUnitGroup(
          'humvee',
          barrageSoldierCount,
            Math.max(220, this.spawnBatchIntraGap + 90),
            Math.max(sx(54), this.spawnTankConvoyDistance * 0.9),
            Math.max(sx(110), this.spawnFormationToFormationDistance * 1.4),
          (unitIndex) => ({
            forcedRouteKey: routeKeyFromSpan(barrageHumveeRouteSpan, unitIndex),
            isBarrage: true,
            barrageTag,
            barrageIndex,
          })
        );

        if (barragePlaneCount > 0) {
          const barragePlaneRouteSpan = allocRouteSpan(barragePlaneCount);
          pushUnitGroup(
            'plane',
            barragePlaneCount,
            Math.max(300, this.spawnTankIntraGap + 120),
            Math.max(sx(72), this.spawnPlanePackDistance * 0.92),
            Math.max(sx(130), this.spawnUnitToUnitDistance * 1.4),
            (unitIndex) => ({
              forcedRouteKey: routeKeyFromSpan(barragePlaneRouteSpan, unitIndex),
              planeLane: ['top', 'middle', 'bottom', 'middle'][unitIndex % 4],
              planeDirection: 'east',
              isBarrage: true,
              barrageTag,
              barrageIndex,
            })
          );
        }

        if (barrageTankCount > 0) {
          const barrageTankRouteKey = routeKeyFromSpan(allocRouteSpan(1), 0);
          pushUnitGroup(
            'tank',
            barrageTankCount,
            Math.max(380, this.spawnTankIntraGap + 180),
            Math.max(sx(82), this.spawnTankConvoyDistance * 0.95),
            Math.max(sx(140), this.spawnPlaneToTankDistance * 1.1),
            {
              forcedRouteKey: barrageTankRouteKey,
              isBarrage: true,
              barrageTag,
              barrageIndex,
            }
          );
        }

        setLastDelay(Math.max(3200, this.spawnSoldierToTankGap + 1300));
      }

      if (!shouldSpawnBarrage) {
        setLastDelay(batchIndex < this.spawnBatchCount - 1 ? this.spawnTankToSoldierGap : this.spawnBatchIntraGap);
      }
    }

    const normalizeSpawnPlanCoverage = () => {
      if (!Array.isArray(this.spawnPlan) || this.spawnPlan.length === 0) {
        return;
      }

      const allRoutes = availableRouteKeys.slice();
      const seenRouteKeys = new Set(
        this.spawnPlan
          .map((step) => String(step?.forcedRouteKey || '').trim())
          .filter((key) => key.length > 0)
      );

      const appendRouteSeed = (routeKey) => {
        this.spawnPlan.push({
          enemyType: 'soldier',
          delayAfter: this.spawnBatchIntraGap,
          minGapFromPrev: this.spawnFormationToFormationDistance,
          forcedRouteKey: routeKey,
        });
      };

      // Guarantee each active entrance receives at least one scheduled spawn.
      allRoutes.forEach((routeKey) => {
        if (!seenRouteKeys.has(routeKey)) {
          appendRouteSeed(routeKey);
          seenRouteKeys.add(routeKey);
        }
      });

      // Keep wave length from collapsing when balancing logic yields too few steps.
      const minPlannedUnits = Math.max(
        allRoutes.length * 2,
        Math.min(22, 8 + Math.floor(waveNumber * 1.2))
      );
      while (this.spawnPlan.length < minPlannedUnits) {
        const routeKey = allRoutes[this.spawnPlan.length % allRoutes.length] || 'route1';
        appendRouteSeed(routeKey);
      }

      const countByType = (enemyType) => this.spawnPlan.reduce(
        (total, step) => total + (String(step?.enemyType || '') === enemyType ? 1 : 0),
        0
      );
      const countByTypeOnRoute = (enemyType, routeKey) => this.spawnPlan.reduce(
        (total, step) => total + (
          String(step?.enemyType || '') === enemyType
          && String(step?.forcedRouteKey || '') === String(routeKey || '')
            ? 1
            : 0
        ),
        0
      );

      const appendTypeSeed = (enemyType, routeKey) => {
        this.spawnPlan.push({
          enemyType,
          delayAfter: Math.max(72, this.spawnBatchIntraGap),
          minGapFromPrev: this.spawnFormationToFormationDistance,
          forcedRouteKey: routeKey,
        });
      };

      const minGrenadiers = waveNumber >= 2 ? Math.max(1, Math.floor(1 + (waveNumber * 0.28))) : 0;
      const minHumvees = waveNumber >= 2 ? Math.max(1, Math.floor(1 + (waveNumber * 0.24))) : 0;
      const minTanks = waveNumber >= 3 ? Math.max(1, Math.floor(1 + (waveNumber * 0.22))) : 0;

      while (countByType('grenadier') < minGrenadiers) {
        const routeKey = allRoutes[countByType('grenadier') % allRoutes.length] || 'route1';
        appendTypeSeed('grenadier', routeKey);
      }
      while (countByType('humvee') < minHumvees) {
        const routeKey = allRoutes[countByType('humvee') % allRoutes.length] || 'route1';
        appendTypeSeed('humvee', routeKey);
      }
      while (countByType('tank') < minTanks) {
        const routeKey = allRoutes[countByType('tank') % allRoutes.length] || 'route1';
        appendTypeSeed('tank', routeKey);
      }

      const perEntranceMin = {
        soldier: waveNumber <= 2 ? 2 : Math.max(2, Math.floor(1 + (waveNumber * 0.12))),
        grenadier: waveNumber <= 3 ? 0 : Math.max(0, Math.floor(waveNumber * 0.12)),
        humvee: waveNumber <= 3 ? 0 : Math.max(0, Math.floor(waveNumber * 0.14)),
        tank: waveNumber <= 4 ? 0 : Math.max(0, Math.floor(waveNumber * 0.12)),
      };

      const fillPerEntranceTypeRoundRobin = (enemyType, minCount) => {
        let needsMore = true;
        while (needsMore) {
          needsMore = false;
          allRoutes.forEach((routeKey) => {
            if (countByTypeOnRoute(enemyType, routeKey) < minCount) {
              appendTypeSeed(enemyType, routeKey);
              needsMore = true;
            }
          });
        }
      };

      fillPerEntranceTypeRoundRobin('soldier', perEntranceMin.soldier);
      fillPerEntranceTypeRoundRobin('grenadier', perEntranceMin.grenadier);
      fillPerEntranceTypeRoundRobin('humvee', perEntranceMin.humvee);
      fillPerEntranceTypeRoundRobin('tank', perEntranceMin.tank);
    };

    normalizeSpawnPlanCoverage();

    this.spawnPlanIndex = 0;
    this.enemyCount = this.spawnPlan.length;
    this.setStatus('Wave ' + this.gameState.wave + ' started. Route: ' + (this.activePathLayoutName || 'Standard') + ' | Fort: ' + (this.activeFortressLayoutName || 'Grid') + '.', '#8cf3ff');
  }

