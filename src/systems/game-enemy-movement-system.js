import Phaser from 'phaser';
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

export function moveEnemiesAlongPath() {
    const deltaSeconds = Math.min(0.05, this.game.loop.delta / 1000);
  const now = this.time.now || 0;

    this.enemies.children.entries.forEach((enemy) => {
      if (enemy.getData('isTestDummy')) {
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
        if (typeof this.updateEnemyWearMarkers === 'function') {
          this.updateEnemyWearMarkers(enemy);
        }
        return;
      }

      if (enemy.getData('isPlane')) {
        this.updatePlaneEnemyFlight(enemy, deltaSeconds);
        return;
      }

      const activeSegs = enemy.getData('customPathSegments')
        || ((enemy.getData('useSecondaryPath') && this.secondaryPathSegments)
        ? this.secondaryPathSegments
        : (enemy.getData('useTertiaryPath') && this.tertiaryPathSegments)
          ? this.tertiaryPathSegments
          : (enemy.getData('useQuaternaryPath') && this.quaternaryPathSegments)
            ? this.quaternaryPathSegments
            : this.pathSegments);

      let pathIndex = enemy.getData('pathIndex');
      let segmentDistance = enemy.getData('segmentDistance');
      let speedMult = 1;
      const soldierIgnoreCongestionUntil = Number(enemy.getData('soldierIgnoreCongestionUntil') || 0);
      const soldierIgnoreCongestionActive = !!enemy.getData('isSoldier') && soldierIgnoreCongestionUntil > now;
      if (enemy.getData('isSoldier') && !enemy.getData('soldierShouldStandStill')) {
        const currentSeg = activeSegs[pathIndex] || null;
        let blockedShooterAheadCount = 0;
        const overtakeRadius = sx(142);
        const forwardMax = sx(148);
        const lateralMax = sx(66);
        for (const other of this.enemies.children.entries) {
          if (other === enemy || !other.active || !other.getData('isSoldier')) continue;
          if (other.getData('isPlane') || other.getData('isTestDummy')) continue;
          const otherIsShooterBlocker = !!other.getData('soldierShouldStandStill')
            || !!other.getData('soldierAttackSequenceActive')
            || !!other.getData('soldierFirePoseLocked');
          if (!otherIsShooterBlocker) continue;
          const dx = other.x - enemy.x;
          const dy = other.y - enemy.y;
          const d = Math.hypot(dx, dy);
          if (!currentSeg || d > overtakeRadius || d < 0.001) {
            continue;
          }
          const forward = (dx * currentSeg.ux) + (dy * currentSeg.uy);
          const lateral = Math.abs((-currentSeg.uy * dx) + (currentSeg.ux * dy));
          if (forward > sx(4) && forward <= forwardMax && lateral <= lateralMax) {
            blockedShooterAheadCount += 1;
            if (blockedShooterAheadCount >= 2) break;
          }
        }
        if (blockedShooterAheadCount >= 2) {
          speedMult = 2.2;
          enemy.setData('soldierOvertakeBoostUntil', now + 420);
        } else if ((enemy.getData('soldierOvertakeBoostUntil') || 0) > now) {
          speedMult = 1.25;
        }
      }
      let travelLeft = (enemy.getData('speed') || 0) * speedMult * deltaSeconds;

      // Unstick failsafe: if a soldier has no active combat intent and its
      // path progress has not changed for a while, force it to advance.
      let soldierForceAdvanceFromStall = false;
      if (enemy.getData('isSoldier')) {
        const progressMarker = (Number(pathIndex) || 0) + ((Number(segmentDistance) || 0) * 0.001);
        const previousProgressMarker = Number(enemy.getData('soldierProgressMarker'));
        const progressChanged = !Number.isFinite(previousProgressMarker)
          || Math.abs(progressMarker - previousProgressMarker) > 0.0005;
        if (progressChanged) {
          enemy.setData('soldierProgressMarker', progressMarker);
          enemy.setData('soldierLastProgressAt', now);
        }

        const combatTarget = enemy.getData('soldierAttackTarget');
        const attackRange = Number(enemy.getData('attackRange') || 0);
        const hasValidCombatTarget = !!combatTarget?.active
          && attackRange > 0
          && Phaser.Math.Distance.Between(enemy.x, enemy.y, combatTarget.x, combatTarget.y) <= (attackRange * 1.45);
        const hasCombatIntent = hasValidCombatTarget
          || !!enemy.getData('soldierAttackSequenceActive')
          || !!enemy.getData('soldierFirePoseLocked');
        const lastProgressAt = Number(enemy.getData('soldierLastProgressAt') || now);
        soldierForceAdvanceFromStall = !hasCombatIntent && ((now - lastProgressAt) > 1200);

        if (soldierForceAdvanceFromStall) {
          enemy.setData('soldierShouldStandStill', false);
          enemy.setData('soldierHoldPositionUntil', 0);
          enemy.setData('soldierTargetLockedUntil', 0);
          enemy.setData('soldierAttackTarget', null);
          enemy.setData('soldierIgnoreCongestionUntil', now + 900);
          enemy.setData('soldierForcedAdvanceUntil', now + 900);
          travelLeft = Math.max(travelLeft, (enemy.getData('speed') || 0) * deltaSeconds * 0.7);
        }
      }

      // Prevent path-position ties from causing overlap piles at choke points.
      const minGap = enemy.getData('isHumvee') ? sx(108) : (enemy.getData('enemyType') === 'tank' ? sx(84) : sx(55));
      const enemySpawnSerial = Number(enemy.getData('spawnSerial') || 0);
      let vehicleCongestionSlowdown = 1;
      for (const other of this.enemies.children.entries) {
        if (other === enemy || !other.active || other.getData('isPlane') || other.getData('isTestDummy')) continue;
        const otherIsStoppedSoldier = !!other.getData('soldierShouldStandStill');
        const effectiveMinGap = otherIsStoppedSoldier ? (minGap * 0.42) : minGap;
        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, other.x, other.y);
        if (dist < effectiveMinGap) {
          const myPath = (enemy.getData('pathIndex') || 0) + (enemy.getData('segmentDistance') || 0) * 0.001;
          const otherPath = (other.getData('pathIndex') || 0) + (other.getData('segmentDistance') || 0) * 0.001;
          const progressDelta = otherPath - myPath;
          const otherSpawnSerial = Number(other.getData('spawnSerial') || 0);
          const isAheadByPath = otherPath > myPath;
          const isTiedButSpawnedEarlier = Math.abs(otherPath - myPath) <= 0.0005 && otherSpawnSerial < enemySpawnSerial;

          if (otherIsStoppedSoldier) {
            // Holding shooters should not freeze the lane; only block at near-contact.
            if (progressDelta > 0 && progressDelta <= 0.06 && dist < (minGap * 0.32)) {
              travelLeft = 0;
              break;
            }
            continue;
          }

          if (isAheadByPath || isTiedButSpawnedEarlier) {
            if (soldierIgnoreCongestionActive && enemy.getData('isSoldier')) {
              if (dist < (effectiveMinGap * 0.2)) {
                travelLeft = 0;
                break;
              }
              continue;
            }
            if (soldierForceAdvanceFromStall && enemy.getData('isSoldier')) {
              if (dist < (effectiveMinGap * 0.22)) {
                travelLeft = 0;
                break;
              }
              travelLeft = Math.max(travelLeft * 0.45, (enemy.getData('speed') || 0) * deltaSeconds * 0.35);
              continue;
            }
            if (enemy.getData('isSoldier')) {
              if (dist < (effectiveMinGap * 0.28)) {
                travelLeft = 0;
                break;
              }
              // Crawl forward through dense clumps instead of hard-stopping forever.
              travelLeft = Math.max(travelLeft * 0.35, (enemy.getData('speed') || 0) * deltaSeconds * 0.18);
              continue;
            }
            if (enemy.getData('isHumvee') || enemy.getData('enemyType') === 'tank') {
              const slowdown = enemy.getData('isHumvee') ? 0.72 : 0.65;
              vehicleCongestionSlowdown = Math.min(vehicleCongestionSlowdown, slowdown);
              continue;
            }
            travelLeft = 0;
            break;
          }
        }
      }
      if (vehicleCongestionSlowdown < 1 && travelLeft > 0) {
        travelLeft *= vehicleCongestionSlowdown;
      }

      const soldierCanEngage = !enemy.getData('isSoldier') || !!enemy.getData('soldierHasRunEnough');

      let soldierTargetInSight = false;
      if (enemy.getData('isSoldier') && soldierCanEngage) {
        const attackRange = enemy.getData('attackRange') || 0;
        const targetStickRange = attackRange * 1.15;
        const lockedTarget = enemy.getData('soldierAttackTarget');
        if (lockedTarget?.active && attackRange > 0) {
          const lockedDist = Phaser.Math.Distance.Between(enemy.x, enemy.y, lockedTarget.x, lockedTarget.y);
          const targetVisible = typeof this.isSoldierTargetVisible === 'function'
            ? this.isSoldierTargetVisible(enemy, lockedTarget, 1.15)
            : (lockedDist <= targetStickRange);
          if (lockedDist <= targetStickRange && targetVisible) {
            soldierTargetInSight = true;
          } else {
            enemy.setData('soldierAttackTarget', null);
          }
        }
      }

      const isSoldierActivelyFiring = !!enemy.getData('soldierAttackSequenceActive') || !!enemy.getData('soldierFirePoseLocked');
      const isGrenadier = !!enemy.getData('soldierIsGrenadier');
      const activeTarget = enemy.getData('soldierAttackTarget');
      const mySpawnSerial = Number(enemy.getData('spawnSerial') || 0);
      // Grenadiers only stop when grenade is ready AND knees are horizontal; otherwise keep moving
      const grenadeReady = !isGrenadier || ((enemy.getData('soldierGrenadeReadyAt') || 0) <= now);
      let holdTargetIsForward = true;
      if (enemy.getData('isSoldier') && soldierTargetInSight) {
        const target = enemy.getData('soldierAttackTarget');
        const segmentForAim = activeSegs[pathIndex] || null;
        if (target?.active && segmentForAim) {
          const towerPoint = typeof this.getTowerTargetPoint === 'function'
            ? this.getTowerTargetPoint(target)
            : { x: target.x, y: target.y };
          if (towerPoint) {
            const toTargetX = towerPoint.x - enemy.x;
            const toTargetY = towerPoint.y - enemy.y;
            const forwardProj = (toTargetX * segmentForAim.ux) + (toTargetY * segmentForAim.uy);
            const lateralProj = Math.abs((-segmentForAim.uy * toTargetX) + (segmentForAim.ux * toTargetY));
            // Do not stop for side-only targets in narrow gates; keep pushing forward.
            holdTargetIsForward = forwardProj >= sx(10) && lateralProj <= sx(82);
          }
        }
      }
      let soldierHasAllyQueuedAhead = false;
      let soldierHasAllyQueuedBehind = false;
      let nearbyHoldingSoldiers = 0;
      if (enemy.getData('isSoldier')) {
        const myPathProgress = (enemy.getData('pathIndex') || 0) + ((enemy.getData('segmentDistance') || 0) * 0.001);
        const queueLookahead = 0.55;
        const queueLookbehind = 0.4;
        const queueRadius = sx(86);
        const localHoldRadius = sx(102);
        for (const other of this.enemies.children.entries) {
          if (other === enemy || !other.active || !other.getData('isSoldier')) continue;
          if (other.getData('isPlane') || other.getData('isTestDummy')) continue;
          const otherPathProgress = (other.getData('pathIndex') || 0) + ((other.getData('segmentDistance') || 0) * 0.001);
          const progressDelta = otherPathProgress - myPathProgress;
          const d = Phaser.Math.Distance.Between(enemy.x, enemy.y, other.x, other.y);
          if (progressDelta > 0 && progressDelta <= queueLookahead && d <= queueRadius) {
            soldierHasAllyQueuedAhead = true;
          }
          if (progressDelta < 0 && Math.abs(progressDelta) <= queueLookbehind && d <= queueRadius) {
            soldierHasAllyQueuedBehind = true;
          }
          if (
            !!other.getData('soldierShouldStandStill')
            && d <= localHoldRadius
            && progressDelta >= -0.04
          ) {
            nearbyHoldingSoldiers += 1;
          }
        }
      }
      const kneeHorizontal = soldierTargetInSight && grenadeReady && (() => {
        const target = enemy.getData('soldierAttackTarget');
        if (!target?.active) return false;
        const feetY = enemy.y - (enemy.displayHeight || 0) * 0.05;
        const diff = Math.abs(target.y - feetY);
        const aligned = diff <= sy(40);
        if (enemy.getData('soldierIsGrenadier')) {
          console.log('[MOV] grenadier targetY=' + Math.round(target.y) + ' feetY=' + Math.round(feetY) + ' diff=' + Math.round(diff) + ' aligned=' + aligned + ' grenadeReady=' + grenadeReady);
        }
        return aligned;
      })();
      const shouldHoldForShot = enemy.getData('isSoldier')
        && soldierCanEngage
        && isSoldierActivelyFiring
        || (enemy.getData('isSoldier')
          && soldierCanEngage
          && (((enemy.getData('soldierHoldPositionUntil') || 0) > now) || kneeHorizontal));
      const spawnX = Number(enemy.getData('soldierSpawnX'));
      const spawnY = Number(enemy.getData('soldierSpawnY'));
      const movedFromSpawn = Number.isFinite(spawnX) && Number.isFinite(spawnY)
        ? Phaser.Math.Distance.Between(enemy.x, enemy.y, spawnX, spawnY)
        : Number.POSITIVE_INFINITY;
      const grenadierMinHoldDistance = Number(enemy.getData('soldierMinHoldDistance') || 0);
      const grenadierCanHoldHere = !isGrenadier || movedFromSpawn >= grenadierMinHoldDistance;
      const forcedAdvanceUntil = Number(enemy.getData('soldierForcedAdvanceUntil') || 0);
      const holdSuppressedByLocalCluster = nearbyHoldingSoldiers >= 2;
      let sameTargetHoldersAhead = 0;
      if (enemy.getData('isSoldier') && activeTarget?.active) {
        for (const other of this.enemies.children.entries) {
          if (other === enemy || !other.active || !other.getData('isSoldier')) continue;
          if (other.getData('soldierAttackTarget') !== activeTarget) continue;
          const otherHolding = !!other.getData('soldierShouldStandStill')
            || !!other.getData('soldierAttackSequenceActive')
            || !!other.getData('soldierFirePoseLocked');
          if (!otherHolding) continue;
          const otherSpawnSerial = Number(other.getData('spawnSerial') || 0);
          if (otherSpawnSerial < mySpawnSerial) {
            sameTargetHoldersAhead += 1;
          }
        }
      }
      const holdSuppressedByTargetCap = sameTargetHoldersAhead >= 2;
      if (
        enemy.getData('isSoldier')
        && shouldHoldForShot
        && (soldierHasAllyQueuedAhead || holdSuppressedByLocalCluster || holdSuppressedByTargetCap)
        && forcedAdvanceUntil < (now + 120)
      ) {
        enemy.setData('soldierForcedAdvanceUntil', now + 320);
      }
      const shouldHoldForShotResolved = shouldHoldForShot
        && holdTargetIsForward
        && grenadierCanHoldHere
        && !soldierForceAdvanceFromStall
        && !soldierHasAllyQueuedAhead
        && !soldierHasAllyQueuedBehind
        && !holdSuppressedByLocalCluster
        && !holdSuppressedByTargetCap
        && now >= Number(enemy.getData('soldierForcedAdvanceUntil') || 0);
      if (enemy.getData('isSoldier')) {
        const prevHold = !!enemy.getData('soldierShouldStandStill');
        if (prevHold !== shouldHoldForShotResolved) {
          const holdMs = Math.round((enemy.getData('soldierHoldPositionUntil')||0) - now);
          console.log('[MOV] ' + (isGrenadier?'GREN':'SHOOT') + ' ' + (shouldHoldForShotResolved?'STOPPED':'RESUMED') + ' x='+Math.round(enemy.x)+' y='+Math.round(enemy.y)+' tgt='+(enemy.getData('soldierAttackTarget')?'yes':'no')+' fire='+isSoldierActivelyFiring+' hold='+holdMs+'ms kH='+kneeHorizontal+' qAhead='+soldierHasAllyQueuedAhead+' localHolders='+nearbyHoldingSoldiers);
          if (shouldHoldForShotResolved && !prevHold) {
            const fr = enemy.getData('fireRate') || 330;
            enemy.setData('soldierHoldPositionUntil', now + Math.max(400, fr));
          }
        }
        enemy.setData('soldierShouldStandStill', shouldHoldForShotResolved);
      }
      if (shouldHoldForShotResolved) {
        travelLeft = 0;
        if (soldierTargetInSight) {
          enemy.setData('soldierTargetLockedUntil', now + 140);
        }
      }

      while (travelLeft > 0) {
        const segment = activeSegs[pathIndex];
        if (!segment) {
          this.handleEnemyLeak(enemy);
          return;
        }

        const distanceToEnd = segment.length - segmentDistance;
        if (travelLeft < distanceToEnd) {
          segmentDistance += travelLeft;
          travelLeft = 0;
        } else {
          travelLeft -= distanceToEnd;
          pathIndex += 1;
          segmentDistance = 0;

          if (pathIndex >= activeSegs.length) {
            this.handleEnemyLeak(enemy);
            return;
          }
        }
      }

      const activeSegment = activeSegs[pathIndex];
      if (!activeSegment) {
        return;
      }

      enemy.setData('pathIndex', pathIndex);
      enemy.setData('segmentDistance', segmentDistance);

      const groundX = activeSegment.start.x + (activeSegment.ux * segmentDistance);
      const groundY = activeSegment.start.y + (activeSegment.uy * segmentDistance);
      enemy.x = groundX;
      enemy.y = groundY + (enemy.getData('flightOffsetY') || 0);
      if (enemy.getData('isSoldier') && !enemy.getData('soldierHasRunEnough')) {
        const spawnedAt = Number(enemy.getData('soldierSpawnAt') || 0);
        const minRunMs = Number(enemy.getData('soldierMinRunMs') || 950);
        const minRunDistance = Math.max(0, Number(enemy.getData('soldierMinRunDistance') || 0));
        const spawnX = Number(enemy.getData('soldierSpawnX'));
        const spawnY = Number(enemy.getData('soldierSpawnY'));
        const runDistance = Number.isFinite(spawnX) && Number.isFinite(spawnY)
          ? Phaser.Math.Distance.Between(enemy.x, enemy.y, spawnX, spawnY)
          : Number.POSITIVE_INFINITY;
        if ((now - spawnedAt) >= minRunMs && runDistance >= minRunDistance) {
          enemy.setData('soldierHasRunEnough', true);
        }
      }
      if (enemy.getData('isSoldier')) {
        const baseOffset = enemy.getData('soldierLaneOffsetCurrent');
        const fallbackOffset = enemy.getData('soldierLaneOffset') || 0;
        const currentOffset = Number.isFinite(baseOffset) ? baseOffset : fallbackOffset;
        const shouldStandStill = !!enemy.getData('soldierShouldStandStill');
        const freezeLaneOffset =
          enemy.getData('soldierAttackSequenceActive')
          || ((enemy.getData('soldierTargetLockedUntil') || 0) > now)
          || soldierTargetInSight;

        // Compute lateral repulsion from nearby soldiers
        let repulsion = 0;
        const soldierStyle = enemy.getData('soldierSpriteStyle') || 'cp1';
        const isHeavyInfantryStyle = soldierStyle === 'cp2' || soldierStyle === 'cp3' || !!enemy.getData('isEliteSoldier');
        const veerRadius = isHeavyInfantryStyle ? sx(64) : sx(80);
        const maxVeer = isHeavyInfantryStyle ? sx(18) : sx(32);
        this.enemies.children.entries.forEach((other) => {
          if (other === enemy || !other.active || !other.getData('isSoldier')) return;
          const dist = Phaser.Math.Distance.Between(groundX, groundY, other.x, other.y);
          if (dist < veerRadius && dist > 0) {
            const perpDot = -activeSegment.uy * (other.x - groundX) + activeSegment.ux * (other.y - groundY);
          // Stopped enemies cause stronger lateral veer in those behind them
          const stoppedMult = other.getData('soldierShouldStandStill') ? 2.2 : 1;
          const strength = (1 - dist / veerRadius) * maxVeer * stoppedMult;
            repulsion -= Math.sign(perpDot) * strength;
          }
        });

        // Per-soldier phase offset prevents synchronized oscillation
        const phase = enemy.getData('pulsePhase') || 0;
        const lerpRate = isHeavyInfantryStyle
          ? 0.1
          : (0.07 + Math.sin(now * 0.0003 + phase) * 0.01);
        let shoulderSign = Number(enemy.getData('soldierHoldShoulderSign') || 0);
        if (shouldStandStill && shoulderSign === 0) {
          shoulderSign = (Number(enemy.getData('spawnSerial') || 0) % 2 === 0) ? 1 : -1;
          enemy.setData('soldierHoldShoulderSign', shoulderSign);
        }
        const shoulderOffset = isHeavyInfantryStyle ? sx(34) : sx(28);
        const shoulderTargetOffset = shoulderSign === 0 ? currentOffset : (shoulderSign * shoulderOffset);
        const targetOffset = shouldStandStill
          ? shoulderTargetOffset
          : (freezeLaneOffset
            ? currentOffset
            : (typeof this.computeSoldierSmartLaneOffset === 'function'
              ? this.computeSoldierSmartLaneOffset(enemy, groundX, groundY)
              : fallbackOffset) + Phaser.Math.Clamp(repulsion, -maxVeer, maxVeer));
        const laneOffset = shouldStandStill
          ? Phaser.Math.Linear(currentOffset, targetOffset, 0.26)
          : (freezeLaneOffset
            ? currentOffset
            : Phaser.Math.Linear(currentOffset, targetOffset, lerpRate));
        enemy.setData('soldierLaneOffsetCurrent', laneOffset);
        enemy.x += -activeSegment.uy * laneOffset;
        enemy.y += activeSegment.ux * laneOffset;
      }
      if (enemy.getData('isSoldier')) {
        this.updateSoldierDirection(enemy, activeSegment.ux, activeSegment.uy);
        const shouldStandStill = !!enemy.getData('soldierShouldStandStill');
        const isActivelyFiring = !!enemy.getData('soldierAttackSequenceActive') || !!enemy.getData('soldierFirePoseLocked');
        if (shouldStandStill && !isActivelyFiring) {
          enemy.anims?.pause?.();
        } else if (enemy.anims?.isPaused && !enemy.getData('soldierFirePoseLocked')) {
          enemy.anims.resume();
        }
        enemy.setRotation(0);
      } else if (enemy.getData('isHumvee')) {
        // Sprite faces west, so add π offset
        const rotOffset = Math.PI;
        const targetRotation = activeSegment.angle + rotOffset;
        const currentRotation = Number.isFinite(enemy.rotation) ? enemy.rotation : targetRotation;
        enemy.setRotation(Phaser.Math.Angle.RotateTo(currentRotation, targetRotation, 0.05));
      } else {
        const rotOffset = Math.PI / 2;
        const targetRotation = activeSegment.angle + rotOffset;
        const currentRotation = Number.isFinite(enemy.rotation) ? enemy.rotation : targetRotation;
        enemy.setRotation(Phaser.Math.Angle.RotateTo(currentRotation, targetRotation, 0.2));
      }

      if (enemy.texture.key === 'gsEnemyTracks') {
        const pulse = enemy.getData('pulsePhase') || 0;
        const baseScale = enemy.getData('baseScale') || 0.56;
        enemy.setScale(baseScale + (Math.sin((this.time.now * 0.012) + pulse) * 0.012));
      }

      const shadow = enemy.getData('shadow');
      const barBg = enemy.getData('barBg');
      const barFill = enemy.getData('barFill');
      if (shadow) {
        shadow.setPosition(groundX + sx(10), groundY + (enemy.getData('shadowOffsetY') || sy(16)));
      }
      if (barBg) {
        barBg.setPosition(enemy.x, enemy.y + (enemy.getData('barOffsetY') || -sy(26)));
      }
      if (barFill) {
        barFill.setPosition(enemy.x - sx(14), enemy.y + (enemy.getData('barOffsetY') || -sy(26)));
      }
      if (typeof this.updateEnemyWearMarkers === 'function') {
        this.updateEnemyWearMarkers(enemy);
      }
      if (enemy.getData('isSoldier')) {
        this.updateSoldierGunAttachment(enemy);
        if (typeof this.updateSoldierEmotion === 'function') {
          this.updateSoldierEmotion(enemy);
        }
      } else if (enemy.getData('isHumvee')) {
        this.updateHumveeGunAttachment(enemy);
      } else if (!enemy.getData('isPlane')) {
        this.updateTankGunAttachment(enemy);
      }
    });

    // Resolve residual overlap after movement integration so soldiers/vehicles stop stacking.
    const activeGroundEnemies = this.enemies.children.entries.filter((enemy) => (
      enemy?.active
      && !enemy.getData('isPlane')
      && !enemy.getData('isTestDummy')
    ));

    for (let i = 0; i < activeGroundEnemies.length; i += 1) {
      const a = activeGroundEnemies[i];
      for (let j = i + 1; j < activeGroundEnemies.length; j += 1) {
        const b = activeGroundEnemies[j];
        const isVehicleA = !!a.getData('isHumvee') || a.getData('enemyType') === 'tank';
        const isVehicleB = !!b.getData('isHumvee') || b.getData('enemyType') === 'tank';
        const isSoldierA = !!a.getData('isSoldier');
        const isSoldierB = !!b.getData('isSoldier');

        let minSeparation = sx(42);
        if (isVehicleA && isVehicleB) {
          minSeparation = sx(88);
        } else if ((isVehicleA && isSoldierB) || (isVehicleB && isSoldierA)) {
          minSeparation = sx(72);
        } else if (isSoldierA && isSoldierB) {
          minSeparation = sx(50);
        }

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = (dx * dx) + (dy * dy);
        if (distSq <= 0.0001) {
          continue;
        }

        const dist = Math.sqrt(distSq);
        if (dist >= minSeparation) {
          continue;
        }

        const overlap = minSeparation - dist;
        const ux = dx / dist;
        const uy = dy / dist;

        const isHeavyA = isVehicleA ? 1.4 : 1;
        const isHeavyB = isVehicleB ? 1.4 : 1;
        const totalMass = isHeavyA + isHeavyB;
        const pushA = (overlap * (isHeavyB / totalMass)) * 0.55;
        const pushB = (overlap * (isHeavyA / totalMass)) * 0.55;

        a.x -= ux * pushA;
        a.y -= uy * pushA;
        b.x += ux * pushB;
        b.y += uy * pushB;
      }
    }

    activeGroundEnemies.forEach((enemy) => {
      const shadow = enemy.getData('shadow');
      const barBg = enemy.getData('barBg');
      const barFill = enemy.getData('barFill');
      if (shadow) {
        shadow.setPosition(enemy.x + sx(10), enemy.y + (enemy.getData('shadowOffsetY') || sy(16)));
      }
      if (barBg) {
        barBg.setPosition(enemy.x, enemy.y + (enemy.getData('barOffsetY') || -sy(26)));
      }
      if (barFill) {
        barFill.setPosition(enemy.x - sx(14), enemy.y + (enemy.getData('barOffsetY') || -sy(26)));
      }
      if (typeof this.updateEnemyWearMarkers === 'function') {
        this.updateEnemyWearMarkers(enemy);
      }
      if (enemy.getData('isSoldier')) {
        this.updateSoldierGunAttachment?.(enemy);
      } else if (enemy.getData('isHumvee')) {
        this.updateHumveeGunAttachment?.(enemy);
      } else {
        this.updateTankGunAttachment?.(enemy);
      }
    });
}

