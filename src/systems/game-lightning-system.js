import Phaser from 'phaser';
import * as THREE from 'three';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
} from './game-config-constants';
import { createBoardScalers } from './game-core-utils';

const BASE_WIDTH = 1000;
const BASE_HEIGHT = 600;
const { sx, sy } = createBoardScalers({
  baseWidth: BASE_WIDTH,
  baseHeight: BASE_HEIGHT,
  boardWidth: BOARD_WIDTH,
  boardHeight: BOARD_HEIGHT,
});
const MAP_OFFSET_Y = sy(-34);

export function triggerBarrageLightningSequence(barrageIndex = 1, options = {}) {
    const sourceSprite = this.lightningLandmarkSprite && this.lightningLandmarkSprite.active
      ? this.lightningLandmarkSprite
      : null;
    const sourceX = sourceSprite ? sourceSprite.x : sx(240);
    const sourceY = sourceSprite ? (sourceSprite.y - sy(16)) : (sy(170) + MAP_OFFSET_Y);

    if (sourceSprite) {
      this.tweens.add({
        targets: sourceSprite,
        alpha: { from: Math.max(0.64, sourceSprite.alpha || 0.64), to: 0.94 },
        scaleX: { from: sourceSprite.scaleX, to: sourceSprite.scaleX * 1.08 },
        scaleY: { from: sourceSprite.scaleY, to: sourceSprite.scaleY * 1.08 },
        duration: 120,
        yoyo: true,
        ease: 'Sine.easeOut',
      });
    }

    const sourcePulse = this.add.circle(sourceX, sourceY, sx(10), 0x8fd7ff, 0.34)
      .setDepth(8.7)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: sourcePulse,
      alpha: 0,
      scaleX: 4.8,
      scaleY: 4.8,
      duration: 280,
      ease: 'Quad.easeOut',
      onComplete: () => sourcePulse.destroy(),
    });

    this.spawnLightningProtectionBlob(sourceX, sourceY + sy(34), 980);

    if (this.cameras?.main) {
      this.cameras.main.flash(72, 100, 160, 140, false);
      this.cameras.main.shake(130, 0.0017, true);
    }

    const sampleSpacing = barrageIndex >= 2 ? sx(78) : sx(98);
    const samplePathPoints = (pathPoints = [], spacing = sx(92)) => {
      if (!Array.isArray(pathPoints) || pathPoints.length < 2) {
        return [];
      }

      const sampled = [{ x: pathPoints[0].x, y: pathPoints[0].y }];
      let distanceToNextSample = spacing;

      for (let i = 1; i < pathPoints.length; i += 1) {
        const prev = pathPoints[i - 1];
        const next = pathPoints[i];
        const segDx = next.x - prev.x;
        const segDy = next.y - prev.y;
        const segLen = Math.sqrt((segDx * segDx) + (segDy * segDy));
        if (segLen <= 0.0001) {
          continue;
        }

        let traveled = 0;
        while (traveled + distanceToNextSample <= segLen) {
          traveled += distanceToNextSample;
          const t = traveled / segLen;
          sampled.push({
            x: prev.x + (segDx * t),
            y: prev.y + (segDy * t),
          });
          distanceToNextSample = spacing;
        }

        distanceToNextSample -= (segLen - traveled);
      }

      sampled.push({ x: pathPoints[pathPoints.length - 1].x, y: pathPoints[pathPoints.length - 1].y });
      return sampled;
    };

    const pathGroups = [
      samplePathPoints(this.path, sampleSpacing),
      samplePathPoints(this.secondaryPath, sampleSpacing),
      samplePathPoints(this.tertiaryPath, sampleSpacing),
      samplePathPoints(this.quaternaryPath, sampleSpacing),
    ].filter((group) => group.length > 0);

    const strikeTargets = [];
    let groupCursor = 0;
    while (pathGroups.some((group) => groupCursor < group.length)) {
      pathGroups.forEach((group) => {
        if (groupCursor < group.length) {
          strikeTargets.push(group[groupCursor]);
        }
      });
      groupCursor += 1;
    }

    const maxStrikes = barrageIndex >= 2 ? 92 : 68;
    const clampedTargets = strikeTargets.slice(0, maxStrikes);
    const branchCountMax = barrageIndex >= 2 ? 3 : 2;
    const sequenceEndDelayMs = clampedTargets.length > 0
      ? (45 + ((clampedTargets.length - 1) * 24) + 14 + ((branchCountMax - 1) * 18) + 24)
      : 0;

    for (let i = 0; i < clampedTargets.length; i += 1) {
      this.time.delayedCall(45 + (i * 24), () => {
        if (this.gameState?.gameOver || this.gameplayPauseActive) {
          return;
        }

        const baseTarget = clampedTargets[i];
        const targetX = Phaser.Math.Clamp(baseTarget.x + Phaser.Math.FloatBetween(-sx(8), sx(8)), sx(42), BOARD_WIDTH - sx(42));
        const targetY = Phaser.Math.Clamp(baseTarget.y + Phaser.Math.FloatBetween(-sy(8), sy(8)), sy(98) + MAP_OFFSET_Y, BOARD_HEIGHT - sy(92));

        const jitterStartX = sourceX + Phaser.Math.FloatBetween(-sx(16), sx(16));
        const jitterStartY = sourceY + Phaser.Math.FloatBetween(-sy(10), sy(6));
        const groundedMainTarget = this.resolveLightningStrikeGroundPoint(targetX, targetY);
        this.spawnBarrageLightningBolt(jitterStartX, jitterStartY, groundedMainTarget.x, groundedMainTarget.y);
        this.applyLightningImpactDamage(groundedMainTarget.x, groundedMainTarget.y, barrageIndex, false);

        const branchCount = barrageIndex >= 2
          ? Phaser.Math.Between(2, 3)
          : Phaser.Math.Between(1, 2);
        for (let b = 0; b < branchCount; b += 1) {
          const nextTarget = clampedTargets[Math.min(clampedTargets.length - 1, i + Phaser.Math.Between(1, 3))] || baseTarget;
          const branchEndX = Phaser.Math.Clamp(
            Phaser.Math.Linear(targetX, nextTarget.x, Phaser.Math.FloatBetween(0.18, 0.62)) + Phaser.Math.FloatBetween(-sx(16), sx(16)),
            sx(42),
            BOARD_WIDTH - sx(42)
          );
          const branchEndY = Phaser.Math.Clamp(
            Phaser.Math.Linear(targetY, nextTarget.y, Phaser.Math.FloatBetween(0.18, 0.62)) + Phaser.Math.FloatBetween(-sy(16), sy(16)),
            sy(98) + MAP_OFFSET_Y,
            BOARD_HEIGHT - sy(92)
          );

          this.time.delayedCall(14 + (b * 18), () => {
            const groundedBranchTarget = this.resolveLightningStrikeGroundPoint(branchEndX, branchEndY);
            this.spawnBarrageLightningBolt(
              targetX + Phaser.Math.FloatBetween(-sx(10), sx(10)),
              targetY + Phaser.Math.FloatBetween(-sy(10), sy(10)),
              groundedBranchTarget.x,
              groundedBranchTarget.y
            );
            this.applyLightningImpactDamage(groundedBranchTarget.x, groundedBranchTarget.y, barrageIndex, true);
          });
        }
      });
    }

    if (typeof options?.onComplete === 'function') {
      this.time.delayedCall(sequenceEndDelayMs, () => {
        if (this.scene?.isDestroyed) {
          return;
        }
        options.onComplete();
      });
    }

    return sequenceEndDelayMs;
  }


export function spawnLightningGroundBlast(x, y, options = {}) {
    const barrageIndex = Number(options?.barrageIndex) || 1;
    const isBranchStrike = !!options?.isBranchStrike;
    const branchMul = isBranchStrike ? 0.62 : 1;
    const impactOpacityMul = 1.0;

    // Primary: lightningExplode sprite animation at ground impact point
    const explodeKey = this.textures?.exists('lightningExplodeFrame1') ? 'lightningExplodeFrame1' : null;
    if (explodeKey) {
      this.ensureLightningSpriteAnimations();
      const fi = this.textures.get(explodeKey)?.getSourceImage();
      const bw = Math.max(1, Number(fi?.width) || 96);
      const bh = Math.max(1, Number(fi?.height) || 96);
      const tgt = isBranchStrike ? sx(80) : (barrageIndex >= 2 ? sx(140) : sx(110));
      const sc = tgt / Math.max(bw, bh);
      const spr = this.add.sprite(x, y, explodeKey)
        .setDisplaySize(bw * sc, bh * sc)
        .setDepth(8.5)
        .setAlpha(isBranchStrike ? 0.72 : 0.95)
        .setBlendMode(Phaser.BlendModes.ADD);
      const anim = this.anims?.exists('lightningExplodeAnim') ? 'lightningExplodeAnim' : null;
      if (anim) {
        spr.play(anim);
        spr.once('animationcomplete', () => { if (spr?.active) spr.destroy(); });
      } else {
        this.tweens.add({ targets: spr, alpha: 0, duration: 350, ease: 'Quad.easeOut', onComplete: () => { if (spr?.active) spr.destroy(); } });
      }
    }

    const coreRadius = (barrageIndex >= 2 ? sx(24) : sx(20)) * branchMul;
    const waveRadius = (barrageIndex >= 2 ? sx(88) : sx(72)) * branchMul;
    const scorchRadius = (barrageIndex >= 2 ? sx(62) : sx(50)) * branchMul;

    const scorch = this.add.circle(x, y, scorchRadius, 0x4a1a0c, 0.3 * impactOpacityMul)
      .setDepth(8.18)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);

    const outerWave = this.add.circle(x, y, Math.max(sx(4), coreRadius * 0.6), 0xff6a2a, 0.44 * impactOpacityMul)
      .setDepth(8.19)
      .setBlendMode(Phaser.BlendModes.NORMAL);

    const innerCore = this.add.circle(x, y, Math.max(sx(2), coreRadius * 0.4), 0xffbc78, 0.82 * impactOpacityMul)
      .setDepth(8.21)
      .setBlendMode(Phaser.BlendModes.NORMAL);

    const emberGlow = this.add.circle(x, y, Math.max(sx(6), coreRadius * 0.95), 0xff8b3a, 0.34 * impactOpacityMul)
      .setDepth(8.205)
      .setBlendMode(Phaser.BlendModes.NORMAL);

    const ring = this.add.circle(x, y, Math.max(sx(3), coreRadius * 0.75), 0x000000, 0)
      .setStrokeStyle(Math.max(1, sx(1.8) * branchMul), 0xff8d52, 0.9 * impactOpacityMul)
      .setDepth(8.2)
      .setBlendMode(Phaser.BlendModes.NORMAL);

    const sparks = [];
    const sparkCount = isBranchStrike ? 4 : 7;
    for (let i = 0; i < sparkCount; i += 1) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.FloatBetween(coreRadius * 0.2, coreRadius * 1.3);
      const spark = this.add.circle(
        x + Math.cos(angle) * dist,
        y + Math.sin(angle) * dist,
        Math.max(1, sx(1.4) * branchMul),
        0xffa568,
        0.98 * impactOpacityMul
      )
        .setDepth(8.22)
        .setBlendMode(Phaser.BlendModes.NORMAL);
      sparks.push(spark);

      this.tweens.add({
        targets: spark,
        x: spark.x + Math.cos(angle) * Phaser.Math.FloatBetween(sx(18), sx(42)) * branchMul,
        y: spark.y + Math.sin(angle) * Phaser.Math.FloatBetween(sy(18), sy(42)) * branchMul,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: Phaser.Math.Between(120, 220),
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy(),
      });
    }

    this.tweens.add({
      targets: emberGlow,
      scaleX: 1.55,
      scaleY: 1.55,
      alpha: 0,
      duration: isBranchStrike ? 220 : 300,
      ease: 'Quad.easeOut',
      onComplete: () => emberGlow.destroy(),
    });

    this.tweens.add({
      targets: outerWave,
      scaleX: waveRadius / Math.max(1, outerWave.radius),
      scaleY: waveRadius / Math.max(1, outerWave.radius),
      alpha: 0,
      duration: isBranchStrike ? 240 : 320,
      ease: 'Cubic.easeOut',
      onComplete: () => outerWave.destroy(),
    });

    this.tweens.add({
      targets: innerCore,
      scaleX: 0.45,
      scaleY: 0.45,
      alpha: 0,
      duration: isBranchStrike ? 170 : 230,
      ease: 'Quad.easeOut',
      onComplete: () => innerCore.destroy(),
    });

    this.tweens.add({
      targets: ring,
      scaleX: (waveRadius * 0.56) / Math.max(1, ring.radius),
      scaleY: (waveRadius * 0.56) / Math.max(1, ring.radius),
      alpha: 0,
      duration: isBranchStrike ? 280 : 380,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });

    this.tweens.add({
      targets: scorch,
      alpha: 0,
      scaleX: 1.12,
      scaleY: 1.12,
      duration: isBranchStrike ? 460 : 700,
      ease: 'Sine.easeOut',
      onComplete: () => scorch.destroy(),
    });
}


export function spawnLightningProtectionBlob(worldX, worldY, durationMs = 420) {
    if (typeof window === 'undefined' || typeof document === 'undefined' || !this.game?.canvas) {
      return;
    }

    const root = document.createElement('div');
    root.setAttribute('data-lightning-protection-blob', 'true');
    root.style.position = 'fixed';
    root.style.left = '0px';
    root.style.top = '0px';
    root.style.width = '0px';
    root.style.height = '0px';
    root.style.pointerEvents = 'none';
    root.style.zIndex = '7';

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.mixBlendMode = 'screen';
    root.appendChild(renderer.domElement);
    document.body.appendChild(root);

    const scene3 = new THREE.Scene();
    const camera3 = new THREE.OrthographicCamera(-100, 100, 100, -100, 0.1, 10);
    camera3.position.z = 4;

    const shieldGroup = new THREE.Group();
    scene3.add(shieldGroup);

    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 192;
    glowCanvas.height = 192;
    const glowCtx = glowCanvas.getContext('2d');
    if (glowCtx) {
      const gradient = glowCtx.createRadialGradient(96, 96, 10, 96, 96, 92);
      gradient.addColorStop(0, 'rgba(184, 240, 255, 0.26)');
      gradient.addColorStop(0.42, 'rgba(104, 202, 255, 0.16)');
      gradient.addColorStop(0.78, 'rgba(66, 142, 255, 0.08)');
      gradient.addColorStop(1, 'rgba(40, 82, 160, 0)');
      glowCtx.fillStyle = gradient;
      glowCtx.fillRect(0, 0, 192, 192);
    }

    const glowTexture = new THREE.CanvasTexture(glowCanvas);
    glowTexture.needsUpdate = true;

    const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      color: 0xb7edff,
    }));
    glowSprite.scale.set(116, 116, 1);
    shieldGroup.add(glowSprite);

    const shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(30, 1),
      new THREE.MeshBasicMaterial({
        color: 0x79d4ff,
        transparent: true,
        opacity: 0,
        wireframe: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      })
    );
    shell.scale.set(1, 1.18, 1);
    shieldGroup.add(shell);

    const cleanup = () => {
      const idx = this.lightningProtectionOverlays.indexOf(cleanup);
      if (idx >= 0) {
        this.lightningProtectionOverlays.splice(idx, 1);
      }
      glowTexture.dispose?.();
      glowSprite.material.dispose?.();
      shell.geometry.dispose?.();
      shell.material.dispose?.();
      renderer.dispose();
      renderer.forceContextLoss?.();
      if (root.parentNode) {
        root.parentNode.removeChild(root);
      }
    };
    this.lightningProtectionOverlays.push(cleanup);

    const syncAndRender = (progress = 0) => {
      if (!this.game?.canvas || !renderer.domElement.isConnected) {
        cleanup();
        return;
      }

      const rect = this.game.canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      root.style.left = Math.round(rect.left) + 'px';
      root.style.top = Math.round(rect.top) + 'px';
      root.style.width = width + 'px';
      root.style.height = height + 'px';
      renderer.setSize(width, height, false);
      camera3.left = -width * 0.5;
      camera3.right = width * 0.5;
      camera3.top = height * 0.5;
      camera3.bottom = -height * 0.5;
      camera3.updateProjectionMatrix();

      const cam = this.cameras?.main;
      const zoom = cam?.zoom || 1;
      const worldView = cam?.worldView || { x: 0, y: 0 };
      const canvasWidth = Math.max(1, Number(this.game.canvas.width) || width);
      const canvasHeight = Math.max(1, Number(this.game.canvas.height) || height);
      const scaleX = width / canvasWidth;
      const scaleY = height / canvasHeight;
      const screenX = ((worldX - worldView.x) * zoom) * scaleX;
      const screenY = ((worldY - worldView.y) * zoom) * scaleY;
      shieldGroup.position.set(screenX - (width * 0.5), (height * 0.5) - screenY, 0);

      const rise = Phaser.Math.Clamp(progress / 0.18, 0, 1);
      const fall = Phaser.Math.Clamp((1 - progress) / 0.28, 0, 1);
      const envelope = progress < 0.72 ? rise : Math.min(rise, fall);
      const shimmer = 0.88 + (Math.sin(progress * Math.PI * 8) * 0.12);
      glowSprite.material.opacity = (0.08 + (envelope * 0.18)) * shimmer;
      shell.material.opacity = (0.1 + (envelope * 0.2)) * shimmer;
      const scale = 0.92 + (envelope * 0.36);
      shieldGroup.scale.set(scale, scale * 1.08, scale);
      shell.rotation.x += 0.018;
      shell.rotation.y += 0.023;
      shell.rotation.z += 0.01;
      renderer.render(scene3, camera3);
    };

    syncAndRender(0.01);

    const tweenState = { progress: 0 };
    this.tweens.add({
      targets: tweenState,
      progress: 1,
      duration: Math.max(220, durationMs),
      ease: 'Sine.easeInOut',
      onUpdate: () => syncAndRender(tweenState.progress),
      onComplete: () => cleanup(),
    });
}

