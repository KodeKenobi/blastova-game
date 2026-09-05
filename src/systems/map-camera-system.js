import Phaser from 'phaser';

const DEFAULTS = {
  minZoom: 0.75,
  maxZoom: 2.5,
  zoomStep: 0.1,
  panSpeed: 900,
};

export function createMapCameraSystem(scene, options) {
  const config = { ...DEFAULTS, ...(options || {}) };
  const camera = scene.cameras.main;
  const worldWidth = Math.max(1, Number(config.worldWidth) || 1);
  const worldHeight = Math.max(1, Number(config.worldHeight) || 1);

  camera.setBounds(0, 0, worldWidth, worldHeight);

  const keys = scene.input.keyboard.addKeys({
    up: 'W',
    down: 'S',
    left: 'A',
    right: 'D',
    upAlt: Phaser.Input.Keyboard.KeyCodes.UP,
    downAlt: Phaser.Input.Keyboard.KeyCodes.DOWN,
    leftAlt: Phaser.Input.Keyboard.KeyCodes.LEFT,
    rightAlt: Phaser.Input.Keyboard.KeyCodes.RIGHT,
    zoomIn: Phaser.Input.Keyboard.KeyCodes.E,
    zoomOut: Phaser.Input.Keyboard.KeyCodes.Q,
    reset: Phaser.Input.Keyboard.KeyCodes.C,
  });

  if (scene.input.mouse) {
    scene.input.mouse.disableContextMenu();
  }

  const state = {
    pointerDragActive: false,
    lastPointerX: 0,
    lastPointerY: 0,
  };

  const clampCameraToBounds = () => {
    const halfVisibleWidth = camera.displayWidth * 0.5;
    const halfVisibleHeight = camera.displayHeight * 0.5;
    const minX = halfVisibleWidth;
    const maxX = worldWidth - halfVisibleWidth;
    const minY = halfVisibleHeight;
    const maxY = worldHeight - halfVisibleHeight;

    const targetX = Phaser.Math.Clamp(camera.midPoint.x, minX, Math.max(minX, maxX));
    const targetY = Phaser.Math.Clamp(camera.midPoint.y, minY, Math.max(minY, maxY));
    camera.centerOn(targetX, targetY);
  };

  const applyZoomAtWorldPoint = (nextZoom, worldX, worldY) => {
    const clampedZoom = Phaser.Math.Clamp(nextZoom, config.minZoom, config.maxZoom);
    if (Math.abs(clampedZoom - camera.zoom) < 0.0001) {
      return;
    }

    const viewXRatio = (worldX - camera.scrollX) / camera.displayWidth;
    const viewYRatio = (worldY - camera.scrollY) / camera.displayHeight;

    camera.setZoom(clampedZoom);
    camera.scrollX = worldX - (viewXRatio * camera.displayWidth);
    camera.scrollY = worldY - (viewYRatio * camera.displayHeight);
    clampCameraToBounds();
  };

  const onWheel = (pointer, _go, _dx, dy) => {
    const step = dy > 0 ? -config.zoomStep : config.zoomStep;
    applyZoomAtWorldPoint(camera.zoom + step, pointer.worldX, pointer.worldY);
  };

  const onPointerDown = (pointer) => {
    if (!pointer.rightButtonDown()) {
      return;
    }
    state.pointerDragActive = true;
    state.lastPointerX = pointer.x;
    state.lastPointerY = pointer.y;
  };

  const onPointerUp = () => {
    state.pointerDragActive = false;
  };

  const onPointerMove = (pointer) => {
    if (!state.pointerDragActive || !pointer.rightButtonDown()) {
      return;
    }

    const dx = pointer.x - state.lastPointerX;
    const dy = pointer.y - state.lastPointerY;
    state.lastPointerX = pointer.x;
    state.lastPointerY = pointer.y;

    camera.scrollX -= dx / camera.zoom;
    camera.scrollY -= dy / camera.zoom;
    clampCameraToBounds();
  };

  scene.input.on('wheel', onWheel);
  scene.input.on('pointerdown', onPointerDown);
  scene.input.on('pointerup', onPointerUp);
  scene.input.on('pointermove', onPointerMove);
  scene.input.on('gameout', onPointerUp);

  const centerOnWorld = () => {
    camera.centerOn(worldWidth * 0.5, worldHeight * 0.5);
    clampCameraToBounds();
  };

  const update = (dtMs) => {
    const dt = Math.max(0, dtMs) / 1000;
    const up = keys.up.isDown || keys.upAlt.isDown;
    const down = keys.down.isDown || keys.downAlt.isDown;
    const left = keys.left.isDown || keys.leftAlt.isDown;
    const right = keys.right.isDown || keys.rightAlt.isDown;

    const moveX = (right ? 1 : 0) - (left ? 1 : 0);
    const moveY = (down ? 1 : 0) - (up ? 1 : 0);
    if (moveX !== 0 || moveY !== 0) {
      camera.scrollX += (moveX * config.panSpeed * dt) / camera.zoom;
      camera.scrollY += (moveY * config.panSpeed * dt) / camera.zoom;
      clampCameraToBounds();
    }

    if (Phaser.Input.Keyboard.JustDown(keys.zoomIn)) {
      const worldPoint = camera.getWorldPoint(camera.width * 0.5, camera.height * 0.5);
      applyZoomAtWorldPoint(camera.zoom + config.zoomStep, worldPoint.x, worldPoint.y);
    }
    if (Phaser.Input.Keyboard.JustDown(keys.zoomOut)) {
      const worldPoint = camera.getWorldPoint(camera.width * 0.5, camera.height * 0.5);
      applyZoomAtWorldPoint(camera.zoom - config.zoomStep, worldPoint.x, worldPoint.y);
    }
    if (Phaser.Input.Keyboard.JustDown(keys.reset)) {
      camera.setZoom(1);
      centerOnWorld();
    }
  };

  const destroy = () => {
    scene.input.off('wheel', onWheel);
    scene.input.off('pointerdown', onPointerDown);
    scene.input.off('pointerup', onPointerUp);
    scene.input.off('pointermove', onPointerMove);
    scene.input.off('gameout', onPointerUp);
  };

  centerOnWorld();

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, destroy);

  return {
    update,
    destroy,
    centerOnWorld,
    getSnapshot: () => ({
      zoom: camera.zoom,
      scrollX: camera.scrollX,
      scrollY: camera.scrollY,
      bounds: { width: worldWidth, height: worldHeight },
    }),
  };
}