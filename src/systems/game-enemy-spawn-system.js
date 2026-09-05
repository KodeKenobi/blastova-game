import Phaser from 'phaser';
import {
  BOARD_HEIGHT,
  BASE_HEIGHT,
  BASE_WIDTH,
  BOARD_WIDTH,
  ENEMY_BASE_SPEED,
  ENEMY_FIRE_RANGE,
  ENEMY_FIRE_RATE,
  GAMEPLAY_VISUAL_SCALE,
  THEME_BY_TERRAIN_ROW,
} from './game-config-constants';
import { createBoardScalers } from './game-core-utils';
import {
  PLANE_ENEMY_VARIANTS,
  PLANE_TIER_AUDIO_ASSETS,
} from './game-weapon-data';
import { DEFAULT_LAYOUT_GAMEPLAY_RULES, LAYOUT_GAMEPLAY_RULES } from './game-layout-data';

const { sx, sy } = createBoardScalers({
  baseWidth: BASE_WIDTH,
  baseHeight: BASE_HEIGHT,
  boardWidth: BOARD_WIDTH,
  boardHeight: BOARD_HEIGHT,
});

export function spawnEnemy(enemyType = 'soldier', spawnStep = null) {
    const waveTier = Math.max(0, this.gameState.wave - 1);
    const isTank = enemyType === 'tank';
    const isHumvee = enemyType === 'humvee';
    const isPlane = enemyType === 'plane';
    const layoutId = this.activePathLayoutId || '';
    const layoutRules = {
      ...DEFAULT_LAYOUT_GAMEPLAY_RULES,
      ...(LAYOUT_GAMEPLAY_RULES[layoutId] || {}),
    };
    const forcedTankRouteKey = isTank ? layoutRules.tankForcedRouteKey : null;
    const forcedEliteRouteKey = enemyType === 'eliteSoldier'
      ? layoutRules.eliteSoldierForcedRouteKey
      : null;
    const forcedRouteFromCommand = typeof spawnStep?.forcedRouteKey === 'string' ? spawnStep.forcedRouteKey : null;
    const forcedRouteKey = forcedRouteFromCommand || forcedTankRouteKey || forcedEliteRouteKey;
    const allowedRouteKeys = (isTank || isHumvee)
      ? (Array.isArray(layoutRules.tankAllowedRouteKeys) ? layoutRules.tankAllowedRouteKeys : null)
      : (enemyType === 'eliteSoldier'
        ? (Array.isArray(layoutRules.eliteSoldierAllowedRouteKeys) ? layoutRules.eliteSoldierAllowedRouteKeys : null)
        : (Array.isArray(layoutRules.soldierAllowedRouteKeys) ? layoutRules.soldierAllowedRouteKeys : null));

    const soldierVariants = [
      {
        key: 'soldierRunCp1Sheet',
        frame: 0,
        baseScale: 2.2,
        anim: 'soldierRunCp1',
        cockAnim: 'soldierCockCp1',
        attackAnim: 'soldierFireCp1',
        grenadeAnim: 'soldierGrenadeCp1',
        hurtAnim: 'soldierHurtCp1',
        spriteStyle: 'cp1',
        health: 22,
        armor: 0.62,
        armorClass: 'light',
          speedScale: 0.26,
        attackDamage: 0.42,
        attackRange: ENEMY_FIRE_RANGE * 1.5,
        fireRate: 330,
        tint: 0xffffff,
        isSoldier: true,
      },
    ];

    const raiderVariants = [
      {
        key: 'soldierRunCp2Sheet',
        frame: 0,
        baseScale: 2.2,
        anim: 'soldierRunCp2',
        cockAnim: 'soldierCockCp2',
        attackAnim: 'soldierFireCp2',
        grenadeAnim: 'soldierGrenadeCp2',
        hurtAnim: 'soldierHurtCp2',
        spriteStyle: 'cp2',
        health: 24,
        armor: 0.56,
        armorClass: 'light',
          speedScale: 0.29,
        attackDamage: 0.46,
        attackRange: ENEMY_FIRE_RANGE * 1.46,
        fireRate: 300,
        tint: 0xffffff,
        isSoldier: true,
      },
    ];

    const eliteSoldierVariants = [
      {
        key: 'soldierRunCp3Sheet',
        frame: 0,
        baseScale: 2.45,
        anim: 'soldierRunCp3',
        cockAnim: 'soldierCockCp3',
        attackAnim: 'soldierFireCp3',
        grenadeAnim: 'soldierGrenadeCp3',
        hurtAnim: 'soldierHurtCp3',
        spriteStyle: 'cp3',
        health: 50,
        armor: 0.84,
        armorClass: 'light',
          speedScale: 0.18,
        attackDamage: 0.68,
        attackRange: ENEMY_FIRE_RANGE * 1.55,
        fireRate: 220,
        tint: 0xffefad,
        isSoldier: true,
        isEliteSoldier: true,
      },
    ];

    const fallbackTankTheme = this.activeVisualTheme || this.getThemeVariantForLevel(this.gameState?.level || 1);
    const loadedTankThemes = THEME_BY_TERRAIN_ROW.filter((themeName) => this.textures?.exists('gsEnemyHalftrack_' + themeName));
    const tankThemes = loadedTankThemes.length > 0
      ? loadedTankThemes
      : [fallbackTankTheme];
    const tankTintProfiles = [0xcbe8ff, 0xffe1b8, 0xd5f7d1];
    const tankVariants = tankThemes.flatMap((themeName) => tankTintProfiles.map((tankTint) => ({
      key: 'gsEnemyHalftrack_' + themeName,
      frame: 0,
      baseScale: 1.22,
      anim: 'enemyHalftrackDrive_' + themeName,
      health: 19,
      armor: 0.38,
      armorClass: 'medium',
      speedScale: 0.30,
      attackDamage: 1.42,
      attackRange: ENEMY_FIRE_RANGE * 1.22,
      fireRate: 1120,
      tint: tankTint,
    })));
    const forcedPlaneVariantId = typeof spawnStep?.planeVariantId === 'string'
      ? spawnStep.planeVariantId.trim()
      : '';
    const forcedPlaneVariant = forcedPlaneVariantId
      ? PLANE_ENEMY_VARIANTS.find((entry) => entry.id === forcedPlaneVariantId)
      : null;
    const unlockedPlaneCount = Math.min(PLANE_ENEMY_VARIANTS.length, 2 + Math.floor(waveTier / 2));
    const availablePlaneVariants = PLANE_ENEMY_VARIANTS.slice(0, unlockedPlaneCount);
    const selectedPlaneVariant = forcedPlaneVariant
      || availablePlaneVariants[this.planeVariantIndex % availablePlaneVariants.length]
      || PLANE_ENEMY_VARIANTS[0];
    if (enemyType === 'plane' && !forcedPlaneVariant) {
      this.planeVariantIndex += 1;
    }
    const planeVariants = [
      {
        ...selectedPlaneVariant,
        key: selectedPlaneVariant.frameKeys[0],
        isPlane: true,
      },
    ];
    const humveeVariants = [
      {
        key: 'humvee',
        frame: 0,
        baseScale: 1.6,
        health: 18,
        armor: 0.5,
        armorClass: 'medium',
        speedScale: 0.30,
        attackDamage: 1.08,
        attackRange: ENEMY_FIRE_RANGE * 1.1,
        fireRate: 900,
        tint: 0xffffff,
        isHumvee: true,
      },
    ];
    const grenadierVariants = [
      {
        key: 'soldierRunCp3Sheet',
        frame: 0,
        baseScale: 2.2,
        anim: 'soldierRunCp3',
        cockAnim: 'soldierGrenadeCp3',
        attackAnim: 'soldierGrenadeCp3',
        grenadeAnim: 'soldierGrenadeCp3',
        hurtAnim: 'soldierHurtCp3',
        spriteStyle: 'cp3',
        health: 21,
        armor: 0.6,
        armorClass: 'light',
          speedScale: 0.25,
        attackDamage: 0.88,
        attackRange: ENEMY_FIRE_RANGE * 0.82,
        fireRate: 600,
        tint: 0xffffff,
        isSoldier: true,
        isGrenadier: true,
      },
    ];
    const sourceVariantsByType = {
      tank: tankVariants,
      humvee: humveeVariants,
      raider: raiderVariants,
      grenadier: grenadierVariants,
      eliteSoldier: eliteSoldierVariants,
      plane: planeVariants,
    };
    const sourceVariants = sourceVariantsByType[enemyType] || soldierVariants;
    const variant = sourceVariants[this.enemyVariantIndex % sourceVariants.length];
    this.enemyVariantIndex += 1;
    const typeEnemyScaleMult = variant.isPlane
      ? layoutRules.planeEnemyScaleMult
      : (variant.isSoldier ? layoutRules.soldierEnemyScaleMult : layoutRules.tankEnemyScaleMult);
    const isHumveeVariant = !!variant.isHumvee;
    const enemyScaleMult = layoutRules.enemyScaleMult * typeEnemyScaleMult;

    const planeDirection = spawnStep?.planeDirection === 'west' ? 'west' : 'east';
    const planeLane = spawnStep?.planeLane || 'middle';
    const hasSpawnOrigin = Number.isFinite(Number(spawnStep?.spawnOriginX)) && Number.isFinite(Number(spawnStep?.spawnOriginY));
    const spawnAtEntrance = !!spawnStep?.spawnAtEntrance && hasSpawnOrigin;
    const isCommanderInfantryDrop = spawnAtEntrance
      && (enemyType === 'soldier' || enemyType === 'raider' || enemyType === 'eliteSoldier' || enemyType === 'grenadier');
    const isCommanderGrenadierDrop = isCommanderInfantryDrop && enemyType === 'grenadier';
    const commanderInfantryHealthMult = isCommanderInfantryDrop
      ? (waveTier <= 2 ? 1.18 : 1.08)
      : 1;
    const commanderInfantryDamageMult = isCommanderInfantryDrop
      ? (isCommanderGrenadierDrop ? 1.22 : (waveTier <= 2 ? 3.35 : 2.85))
      : 1;
    const commanderInfantryArmorBonus = isCommanderInfantryDrop
      ? (isCommanderGrenadierDrop ? 0.04 : 0.1)
      : 0;
    const commanderInfantrySpeedMult = isCommanderInfantryDrop
      ? (isCommanderGrenadierDrop ? 1.0 : (waveTier <= 2 ? 1.08 : 1.0))
      : 1;
    const planeSpawnX = spawnAtEntrance
      ? Number(spawnStep.spawnOriginX)
      : (planeDirection === 'east' ? -sx(80) : BOARD_WIDTH + sx(80));
    const planeSpawnY = spawnAtEntrance
      ? Number(spawnStep.spawnOriginY)
      : this.getPlaneLaneWorldY(planeLane);
    let spawnBranch = null;
    let routePath = this.path;
    let routeSegments = this.pathSegments;
    let customRoute = null;

    const enemy = this.enemies.create(
      isPlane ? planeSpawnX : this.path[0].x,
      isPlane ? planeSpawnY : this.path[0].y,
      variant.key,
      variant.frame
    );
    const soldierScaleMult = variant.isSoldier ? 0.74 : 1;
    const enemyScale = variant.baseScale * GAMEPLAY_VISUAL_SCALE * 0.85 * enemyScaleMult * soldierScaleMult;
    let finalEnemyScale = enemyScale;
    enemy.setDepth(3);
    // Wave-scaled branch spawning: probability-based, all routes active from wave 1.
    const wave = this.gameState?.wave || 1;
    const isBossWaveSpawn = wave % 10 === 0;

    if (!isPlane) {
      this.branchSpawnCycle = (this.branchSpawnCycle || 0) + 1;

      if (Array.isArray(this.customSpawnRoutes) && this.customSpawnRoutes.length > 0) {
        const routes = this.customSpawnRoutes;
        const routePolicyByLayout = layoutId === 'ridge-drop'
          ? {
              // World 7 entrance policy based on active displayed entrance order:
              // 1 -> route1: big soldiers
              // 2 -> route3: tanks
              // 3 -> route4: small soldiers
              // 4 -> route5: small soldiers
              // 5 -> route6: mixed enemy types
              soldier: ['route1', 'route4', 'route5', 'route6'],
              eliteSoldier: ['route6'],
              tank: ['route3', 'route6'],
            }
          : null;
        const policyRouteKeys = routePolicyByLayout
          ? routePolicyByLayout[enemyType === 'tank' ? 'tank' : (enemyType === 'eliteSoldier' ? 'eliteSoldier' : 'soldier')]
          : null;
        const allowedRoutes = Array.isArray(allowedRouteKeys) && allowedRouteKeys.length > 0
          ? routes.filter((route) => allowedRouteKeys.includes(route.key))
          : routes;
        const policyFilteredRoutes = Array.isArray(policyRouteKeys) && policyRouteKeys.length > 0
          ? allowedRoutes.filter((route) => policyRouteKeys.includes(route.key))
          : allowedRoutes;
        const routePool = policyFilteredRoutes.length > 0
          ? policyFilteredRoutes
          : (allowedRoutes.length > 0 ? allowedRoutes : routes);
        const isSurgeWave = wave >= 2 && !isBossWaveSpawn;

        if (forcedRouteKey) {
          customRoute = routePool.find((route) => route.key === forcedRouteKey) || routePool[0];
        } else if (
          this.surgeActive
          && this.surgeSpawned < this.surgeCount
          && this.surgeBranch
          && routePool.some((route) => route.key === this.surgeBranch)
        ) {
          customRoute = routePool.find((route) => route.key === this.surgeBranch) || routePool[0];
          this.surgeSpawned += 1;
          if (this.surgeSpawned >= this.surgeCount) {
            this.surgeActive = false;
          }
        } else if (isSurgeWave && this.branchSpawnCycle === 1 && Math.random() < 0.2) {
          customRoute = routePool[Math.floor(Math.random() * routePool.length)];
          this.surgeActive = true;
          this.surgeBranch = customRoute.key;
          this.surgeCount = Math.floor(2 + wave * 0.2);
          this.surgeSpawned = 1;
          this.time.delayedCall(200, () =>
            this.setStatus('⚠ SURGE on ' + customRoute.label + '! Rapid assault inbound!', '#ff6a00')
          );
        } else {
          const routeIndex = (this.customRouteSpawnCursor || 0) % routePool.length;
          customRoute = routePool[routeIndex];
          this.customRouteSpawnCursor = routeIndex + 1;
        }

        routePath = customRoute.path;
        routeSegments = customRoute.segments;
      } else {

      // Build full list of ALL active paths including main.
      const allPaths = ['main'];
      if (!this.branchPathsVisualOnly && this.secondaryPath)  allPaths.push('secondary');
      if (!this.branchPathsVisualOnly && this.tertiaryPath)   allPaths.push('tertiary');
      if (!this.branchPathsVisualOnly && this.quaternaryPath) allPaths.push('quaternary');

      const activeBranches = allPaths.filter(p => p !== 'main');

      const forcedBranchFromRouteKey = forcedRouteKey === 'route2'
        ? 'secondary'
        : forcedRouteKey === 'route3'
          ? 'tertiary'
          : forcedRouteKey === 'route4'
            ? 'quaternary'
            : null;

      // Surge: from wave 2, rapid burst concentrated on one entrance.
      const isSurgeWave = wave >= 2 && !isBossWaveSpawn;
      if (isSurgeWave && this.branchSpawnCycle === 1 && Math.random() < 0.2) {
        this.surgeActive = true;
        this.surgeBranch = allPaths[Math.floor(Math.random() * allPaths.length)];
        this.surgeCount  = Math.floor(2 + wave * 0.2);
        this.surgeSpawned = 0;
        const label = this.surgeBranch === 'main' ? 'Main Route' : this.surgeBranch === 'secondary' ? 'Route ①' : this.surgeBranch === 'tertiary' ? 'Route ②' : 'Route ③';
        this.time.delayedCall(200, () =>
          this.setStatus('⚠ SURGE on ' + label + '! Rapid assault inbound!', '#ff6a00')
        );
      }

      if (forcedRouteKey) {
        spawnBranch = forcedBranchFromRouteKey;
      } else if (this.surgeActive && this.surgeSpawned < this.surgeCount) {
        // Surge: concentrate on one path.
        const p = this.surgeBranch;
        spawnBranch = p === 'main' ? null : p;
        this.surgeSpawned += 1;
        if (this.surgeSpawned >= this.surgeCount) {
          this.surgeActive = false;
        }
      } else if (allPaths.length > 1) {
        // Equal random distribution across ALL entrances from wave 1.
        const chosen = allPaths[Math.floor(Math.random() * allPaths.length)];
        spawnBranch = chosen === 'main' ? null : chosen;
      }

      if (spawnBranch === 'secondary') {
        enemy.setData('useSecondaryPath', true);
        routePath = this.secondaryPath;
        routeSegments = this.secondaryPathSegments;
      } else if (spawnBranch === 'tertiary') {
        enemy.setData('useTertiaryPath', true);
        routePath = this.tertiaryPath;
        routeSegments = this.tertiaryPathSegments;
      } else if (spawnBranch === 'quaternary') {
        enemy.setData('useQuaternaryPath', true);
        routePath = this.quaternaryPath;
        routeSegments = this.quaternaryPathSegments;
      }
      }
    }

    let commanderSpawnState = null;
    if (!isPlane && spawnAtEntrance && Array.isArray(routeSegments) && routeSegments.length > 0) {
      const originX = Number(spawnStep?.spawnOriginX);
      const originY = Number(spawnStep?.spawnOriginY);
      if (Number.isFinite(originX) && Number.isFinite(originY)) {
        let best = null;
        let bestDistSq = Number.POSITIVE_INFINITY;
        for (let idx = 0; idx < routeSegments.length; idx += 1) {
          const seg = routeSegments[idx];
          if (!seg || !seg.start || !seg.end) {
            continue;
          }
          const vx = seg.end.x - seg.start.x;
          const vy = seg.end.y - seg.start.y;
          const lenSq = (vx * vx) + (vy * vy);
          if (lenSq <= 0.0001) {
            continue;
          }
          let t = ((originX - seg.start.x) * vx + (originY - seg.start.y) * vy) / lenSq;
          t = Math.max(0, Math.min(1, t));
          const px = seg.start.x + (vx * t);
          const py = seg.start.y + (vy * t);
          const dx = originX - px;
          const dy = originY - py;
          const distSq = (dx * dx) + (dy * dy);
          if (distSq < bestDistSq) {
            bestDistSq = distSq;
            best = {
              x: px,
              y: py,
              pathIndex: idx,
              segmentDistance: seg.length * t,
            };
          }
        }
        commanderSpawnState = best;
      }
    }

    const viewportSpawnState = (!isPlane && !spawnAtEntrance)
      ? this.getViewportSpawnStateForRoute(routePath, routeSegments)
      : null;
    const activeSpawnState = viewportSpawnState || commanderSpawnState;
    const firstSegment = !isPlane
      ? routeSegments?.[activeSpawnState?.pathIndex ?? 0] || routeSegments?.[0] || null
      : null;
    if (activeSpawnState) {
      enemy.x = activeSpawnState.x;
      enemy.y = activeSpawnState.y;
    } else if (!isPlane && spawnAtEntrance) {
      enemy.x = Number(spawnStep.spawnOriginX);
      enemy.y = Number(spawnStep.spawnOriginY);
    }
    if (customRoute) {
      enemy.setData('customRouteKey', customRoute.key);
      enemy.setData('customPathSegments', customRoute.segments);
    }
    const useWorld5BigSoldier = !isPlane
      && enemyType === 'soldier'
      && layoutId === 'spiral-path'
      && (customRoute?.key === 'route1' || customRoute?.key === 'route3');
    const useWorld6BigSoldier = !isPlane
      && enemyType === 'soldier'
      && layoutId === 'twin-peaks';
    const useWorld7BigSoldier = !isPlane
      && enemyType === 'soldier'
      && layoutId === 'ridge-drop'
      && customRoute?.key === 'route1';
    const useWorld9BigSoldier = !isPlane
      && (enemyType === 'soldier' || enemyType === 'eliteSoldier')
      && layoutId === 'highland';
    const useBigSoldierVariant = useWorld5BigSoldier || useWorld6BigSoldier || useWorld7BigSoldier || useWorld9BigSoldier;
    if (useBigSoldierVariant) {
      enemy.setFrame(2);
      finalEnemyScale = enemyScale * 1.2;
    }
    enemy.setScale(finalEnemyScale);

    const tankPowerMult = isTank ? (1 + (waveTier * 0.11)) : 1;
    const planePowerMult = isPlane ? (1 + (waveTier * 0.28)) : 1;
    const diffHpMult = this.getDifficultyConfig()?.enemyHpMult ?? 1.0;
    const durabilityMult = isTank ? 1.7 : (isPlane ? 1.52 : 1.48);
    const bigSoldierHealthMult = useBigSoldierVariant ? 1.45 : 1;
    const maxHealth = Math.max(1, Math.round(commanderInfantryHealthMult * durabilityMult * diffHpMult * (isTank
      ? Math.max(1, Math.round((variant.health * tankPowerMult) + (waveTier * 1.8)))
      : (isPlane
        ? Math.max(1, Math.round((variant.health * planePowerMult) + (waveTier * 1.2)))
        : (variant.health + Math.floor(waveTier * 0.55)) * bigSoldierHealthMult))));
    enemy.setData('health', maxHealth);
    enemy.setData('maxHealth', maxHealth);
    const scaledArmor = isTank
      ? (variant.armor || 0) * (1 + (waveTier * 0.14))
      : (isPlane ? (variant.armor || 0) * (1 + (waveTier * 0.18)) : (variant.armor || 0));
    enemy.setData('armor', Math.min(0.9, scaledArmor + commanderInfantryArmorBonus));
    enemy.setData('armorClass', variant.armorClass || 'medium');
    enemy.setData('pathIndex', activeSpawnState?.pathIndex ?? 0);
    enemy.setData('segmentDistance', activeSpawnState?.segmentDistance ?? 0);
    enemy.setData('baseScale', finalEnemyScale);
    enemy.setData('pulsePhase', Phaser.Math.FloatBetween(0, Math.PI * 2));
    const tankSpeedMult = 1;
    const planeSpeedMult = isPlane ? (1 + (waveTier * 0.08)) : 1;
    const speedScale = (variant.speedScale || 1) * tankSpeedMult * planeSpeedMult;
    const diffSpeedMult = this.getDifficultyConfig()?.enemySpeedMult ?? 1.0;
    enemy.setData('speed', (ENEMY_BASE_SPEED + (this.gameState.wave * 12)) * speedScale * diffSpeedMult * 0.88 * commanderInfantrySpeedMult);
    enemy.setData('attackRange', variant.attackRange || ENEMY_FIRE_RANGE);
    enemy.setData('fireRate', variant.fireRate || ENEMY_FIRE_RATE);
    const bigSoldierDamageMult = useBigSoldierVariant ? 1.2 : 1;
    enemy.setData('attackDamage', (variant.attackDamage || 1) * tankPowerMult * planePowerMult * bigSoldierDamageMult * commanderInfantryDamageMult);
    enemy.setData('enemyType', enemyType);
    enemy.setData('isSoldier', !!variant.isSoldier);
    enemy.setData('isEliteSoldier', !!variant.isEliteSoldier || useBigSoldierVariant);
    enemy.setData('isPlane', !!variant.isPlane);
    enemy.setData('isHumvee', isHumveeVariant);
    enemy.setData('soldierDir', 'east');
    enemy.setData('soldierRunAnim', variant.anim || 'soldierRunCp1');
    enemy.setData('soldierCockAnim', variant.cockAnim || variant.attackAnim || 'soldierCockCp1');
    enemy.setData('soldierAttackAnim', variant.attackAnim || 'soldierFireCp1');
    enemy.setData('soldierGrenadeAnim', variant.grenadeAnim || variant.attackAnim || 'soldierGrenadeCp1');
    enemy.setData('soldierHurtAnim', variant.hurtAnim || variant.anim || 'soldierHurtCp1');
    enemy.setData('soldierSpriteStyle', variant.spriteStyle || 'cp1');
    enemy.setData('soldierCanFlip', true);
    enemy.setData('soldierAttackSequenceActive', false);
    enemy.setData('soldierForcePoseUntil', 0);
    enemy.setData('soldierHoldPositionUntil', 0);
    enemy.setData('soldierFirePoseMode', 'default');
    enemy.setData('lastFire', 0);
    const spawnSerial = (this.enemySpawnSerialCounter = (this.enemySpawnSerialCounter || 0) + 1);
    enemy.setData('spawnSerial', spawnSerial);
    enemy.setData('slowFactor', 1);
    enemy.setData('slowUntil', 0);
    enemy.setData('flightOffsetY', 0);
    enemy.setData('shadowOffsetY', variant.isPlane ? sy(42) : sy(16));
    enemy.setData('barOffsetY', variant.isPlane ? -sy(34) : -sy(26));
    enemy.setData('planeFrameKeys', variant.frameKeys || null);
    enemy.setData('planeFrameIndex', 0);
    enemy.setData('planeFrameNextAt', 0);
    const resolvedRouteKey = customRoute?.key
      || forcedRouteKey
      || (spawnBranch === 'secondary'
        ? 'route2'
        : (spawnBranch === 'tertiary'
          ? 'route3'
          : (spawnBranch === 'quaternary' ? 'route4' : 'route1')));
    enemy.setData('routeKey', resolvedRouteKey);
    enemy.setData('planeLane', planeLane);
    const baseLaneY = this.getPlaneLaneWorldY(planeLane);
    const planeLaneOffsetY = isPlane && spawnAtEntrance
      ? Phaser.Math.Clamp(Number(spawnStep.spawnOriginY) - baseLaneY, -sy(140), sy(140))
      : 0;
    enemy.setData('planeLaneOffsetY', planeLaneOffsetY);
    enemy.setData('planeDirection', planeDirection);
    enemy.setData('planeTravelDistance', 0);
    enemy.setData('isBarrage', !!spawnStep?.isBarrage);
    enemy.setData('barrageTag', spawnStep?.barrageTag || null);
    const selectedPlaneVariantIndex = PLANE_ENEMY_VARIANTS.findIndex((entry) => entry.id === selectedPlaneVariant.id);
    const normalizedPlaneVariantIndex = selectedPlaneVariantIndex >= 0 ? selectedPlaneVariantIndex : 0;
    const planeSfxProfile = normalizedPlaneVariantIndex >= 4
      ? PLANE_TIER_AUDIO_ASSETS[2]
      : (normalizedPlaneVariantIndex >= 2 ? PLANE_TIER_AUDIO_ASSETS[1] : PLANE_TIER_AUDIO_ASSETS[0]);
    enemy.setData('planeSfxKey', planeSfxProfile.key);
    enemy.setData('planeSfxTier', normalizedPlaneVariantIndex >= 4 ? 'high' : (normalizedPlaneVariantIndex >= 2 ? 'medium' : 'low'));
    enemy.setData('planeLastSfxAt', -9999);
    if (enemy.getData('isPlane')) {
      this.playPlaneTierSfx(enemy, { force: true });
    }
    const basePlaneSpread = variant.volleyAngles || [-7, 0, 7];
    const midWaveSpread = [-11, -5, 0, 5, 11];
    const lateWaveSpread = [-16, -8, 0, 8, 16];
    const planeVolleyAngles = waveTier >= 8
      ? lateWaveSpread
      : (waveTier >= 4 ? midWaveSpread : basePlaneSpread);
    const isHighTierPlane = normalizedPlaneVariantIndex >= 4;
    const isMidTierPlane = normalizedPlaneVariantIndex >= 2;
    const isBombPlane = isHighTierPlane
      ? true
      : (isMidTierPlane
        ? (waveTier >= 2)
        : (waveTier >= 5 && ((this.enemiesSpawned + this.gameState.wave) % 3 === 0)));
    const planeBombCooldown = isHighTierPlane
      ? Math.max(380, 860 - (waveTier * 45))
      : (isMidTierPlane
        ? Math.max(520, 1160 - (waveTier * 55))
        : Math.max(680, 1460 - (waveTier * 70)));
    const baseBombDamageMult = isHighTierPlane
      ? (normalizedPlaneVariantIndex >= 6 ? 4.4 : 3.8)
      : (isMidTierPlane ? 2.35 : 1.35);
    const planeBombBurstCount = isHighTierPlane
      ? (normalizedPlaneVariantIndex >= 5 ? 3 : 2)
      : 1;
    const planeBombBlastRadius = isHighTierPlane
      ? (normalizedPlaneVariantIndex >= 6 ? sx(130) : sx(112))
      : (isMidTierPlane ? sx(92) : sx(74));
    enemy.setData('planeVolleyAngles', planeVolleyAngles);
    enemy.setData('planeAimConeDeg', Math.min(58, 24 + (waveTier * 3)));
    enemy.setData('planeCanDropBomb', isBombPlane);
    enemy.setData('planeBombCooldown', planeBombCooldown);
    enemy.setData('planeLastBombAt', 0);
    enemy.setData('planeBombDamageMult', waveTier >= 9 ? (baseBombDamageMult * 1.22) : baseBombDamageMult);
    enemy.setData('planeBombBurstCount', planeBombBurstCount);
    enemy.setData('planeBombBlastRadius', planeBombBlastRadius);
    if (firstSegment) {
      if (variant.isSoldier) {
        enemy.setRotation(0);
      } else if (isHumveeVariant) {
        enemy.setRotation(firstSegment ? (firstSegment.angle + Math.PI) : 0);
      } else {
        enemy.setRotation(isPlane ? (planeDirection === 'east' ? Math.PI / 2 : -(Math.PI / 2)) : (firstSegment.angle + (Math.PI / 2)));
      }
    }
    if (variant.tint) {
      enemy.setTint(variant.tint);
      enemy.setData('baseTintColor', variant.tint);
    } else {
      const armorClass = enemy.getData('armorClass') || 'medium';
      const fallbackTint = armorClass === 'heavy'
        ? 0xffc7a6
        : armorClass === 'medium'
          ? 0xd7f0ff
          : 0x9cd7ff;
      enemy.setData('baseTintColor', fallbackTint);
      enemy.setTint(fallbackTint);
    }
    if (variant.anim) {
      enemy.play(variant.anim);
    }
    if (variant.isSoldier) {
      const isGrenadier = !!variant.isGrenadier;
      enemy.setData('soldierIsGrenadier', isGrenadier);
      enemy.setData('soldierGrenadeCooldownMs', isGrenadier ? 600 : 999999);
      // Grenadiers wait longer before first throw so they advance from the entrance
      enemy.setData('soldierGrenadeReadyAt', this.time.now + (isGrenadier ? Phaser.Math.Between(2000, 3000) : Phaser.Math.Between(200, 500)));
      if (isGrenadier) {
        enemy.setData('soldierRunAnim', 'soldierRunCp3');
        enemy.setData('soldierCockAnim', 'soldierCockCp3');
        enemy.setData('soldierAttackAnim', 'soldierFireCp3');
        enemy.setData('soldierGrenadeAnim', 'soldierGrenadeCp3');
        enemy.setData('soldierHurtAnim', 'soldierHurtCp3');
        enemy.setData('soldierSpriteStyle', 'cp3');
        if (this.anims.exists('soldierRunCp3')) {
          enemy.play('soldierRunCp3', true);
        }
        // Keep grenadiers short-mid range; avoid jump-edge long-lob behavior.
        enemy.setData('attackRange', Math.min(
          enemy.getData('attackRange') || ENEMY_FIRE_RANGE,
          ENEMY_FIRE_RANGE * 0.82,
        ));
        enemy.setData('fireRate', 600);
        enemy.setData('soldierMinRunMs', 2200);
        enemy.setData('soldierMinRunDistance', sx(132));
        enemy.setData('soldierMinHoldDistance', sx(124));
        enemy.setData('attackDamage', (enemy.getData('attackDamage') || 1) * 1.1);
      }

      const laneOffset = 0;
      enemy.setData('soldierLaneOffset', laneOffset);
      enemy.setData('soldierLaneOffsetCurrent', laneOffset);
      enemy.setData('barOffsetY', -sy(14));
      enemy.setData('shadowOffsetY', sy(18));
      const gunKeyByStyle = { cp1: 'shooterGun1', cp2: 'shooterGun2', cp3: 'shooterGun3' };
      const gunKey = gunKeyByStyle[variant.spriteStyle] || 'shooterGun1';
      const gun = this.textures.exists(gunKey)
        ? this.add.image(enemy.x, enemy.y, gunKey)
            .setDepth(enemy.depth + 0.4)
            .setScale(0.8)
            .setOrigin(0.15, 0.5)
        : null;
      enemy.setData('soldierGun', gun);
      const handKey1 = variant.spriteStyle === 'cp1' ? 'shooterHand_cp1_right_3pm' : `shooterHand_${variant.spriteStyle}_3`;
      const hand = this.textures.exists(handKey1)
        ? this.add.image(enemy.x, enemy.y, handKey1)
            .setDepth(enemy.depth + 0.3)
            .setScale(1.4)
            .setOrigin(0.5, 0.5)
        : null;
      enemy.setData('soldierHand', hand);
      enemy.setData('soldierEmote', null);
      enemy.setData('soldierEmoteUntil', 0);
      enemy.setData('soldierTargetLockedUntil', 0);
      const initialFireJitter = Phaser.Math.Between(0, Math.max(60, Math.floor((enemy.getData('fireRate') || ENEMY_FIRE_RATE) * 0.7)));
      enemy.setData('lastFire', (this.time.now || 0) - initialFireJitter);
      enemy.setData('soldierNextDodgeAt', this.time.now + Phaser.Math.Between(220, 780));
      enemy.setData('soldierDodgeUntil', 0);
      enemy.setData('soldierDodgeOffset', 0);
      enemy.setData('soldierMoveUx', 1);
      enemy.setData('soldierMoveUy', 0);
      enemy.setData('soldierSpawnX', enemy.x);
      enemy.setData('soldierSpawnY', enemy.y);
      const existingMinRunDistance = Number(enemy.getData('soldierMinRunDistance') || 0);
      enemy.setData('soldierMinRunDistance', existingMinRunDistance > 0 ? existingMinRunDistance : sx(24));
      enemy.setData('soldierSpawnAt', this.time.now || 0);
      const existingMinRunMs = Number(enemy.getData('soldierMinRunMs') || 0);
      enemy.setData('soldierMinRunMs', existingMinRunMs > 0 ? existingMinRunMs : 1500);
      enemy.setData('soldierHasRunEnough', false);
    } else if (variant.isPlane) {
      enemy.setBlendMode(Phaser.BlendModes.NORMAL);
    } else if (isHumveeVariant) {
      const humveeGun = this.add.image(enemy.x, enemy.y, 'gsTurret3')
        .setDepth(3.24)
        .setScale(0.42 * enemyScaleMult)
        .setAlpha(0.94);
      enemy.setData('humveeGun', humveeGun);
    } else if (!variant.isHumvee) {
      const tankGun = this.add.image(enemy.x, enemy.y - sy(6), 'gsTurret3')
        .setDepth(3.24)
        .setScale(0.66 * enemyScaleMult)
        .setAlpha(0.94);
      enemy.setData('tankGun', tankGun);
    }
    enemy.setData(
      'shadow',
      this.add.image(enemy.x + (variant.isPlane ? 0 : sx(10)), enemy.y + (enemy.getData('shadowOffsetY') || sy(16)), 'shadow')
        .setAlpha(variant.isPlane ? 0.28 : 0.55)
        .setScale((variant.isPlane ? 1.05 : 0.92) * GAMEPLAY_VISUAL_SCALE * enemyScaleMult)
        .setDepth(2)
    );
    if (!variant.isPlane && !variant.isSoldier && this.renderer?.type === Phaser.WEBGL) {
      try { enemy.setPipeline('EmbossEffect'); } catch (_) {}
    }
    enemy.setData('barBg', this.add.rectangle(enemy.x, enemy.y + (enemy.getData('barOffsetY') || -sy(26)), sx(28), sy(5), 0x14070b, 0.9).setDepth(4));
    enemy.setData('barFill', this.add.rectangle(enemy.x - sx(14), enemy.y + (enemy.getData('barOffsetY') || -sy(26)), sx(28), sy(5), 0xff849b, 1).setOrigin(0, 0.5).setDepth(5));
    this.syncEnemyHealthVisual(enemy);
    this.enemiesSpawned += 1;
    return enemy;
  }

