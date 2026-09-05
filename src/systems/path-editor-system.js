import Phaser from 'phaser';

const DEFAULT_STORAGE_KEY = 'tdPathEditorDraft';

const clonePoints = (points) => (points || []).map((point) => ({ x: point.x, y: point.y }));

export function createPathEditorSystem(scene, options = {}) {
  const config = {
    storageKey: DEFAULT_STORAGE_KEY,
    worldWidth: 1600,
    worldHeight: 900,
    canEdit: () => true,
    getCurrentPath: () => [],
    applyWorldPath: () => {},
    getActiveTemplateMeta: () => ({ id: 'unknown', name: 'Unknown', index: -1 }),
    toTemplatePoint: (worldPoint) => ({ x: worldPoint.x, y: worldPoint.y }),
    fromTemplatePoint: (templatePoint) => ({ x: templatePoint.x, y: templatePoint.y }),
    onStatus: () => {},
    ...options,
  };

  const graphics = scene.add.graphics().setDepth(19.1).setVisible(false);
  const hudText = scene.add.text(20, 20, '', {
    fontFamily: 'Trebuchet MS',
    fontSize: '11px',
    color: '#f0fcff',
    backgroundColor: 'rgba(5, 16, 20, 0.82)',
    padding: { x: 8, y: 6 },
    lineSpacing: 2,
  }).setDepth(20).setScrollFactor(0).setVisible(false);

  const state = {
    enabled: false,
    workingWorldPoints: [],
    lastRefreshAt: 0,
  };

  const keys = scene.input.keyboard.addKeys({
    toggle: Phaser.Input.Keyboard.KeyCodes.F7,
    saveDraft: Phaser.Input.Keyboard.KeyCodes.F8,
    loadDraft: Phaser.Input.Keyboard.KeyCodes.F9,
    applyPath: Phaser.Input.Keyboard.KeyCodes.F10,
    removeLast: Phaser.Input.Keyboard.KeyCodes.BACKSPACE,
    clearAll: Phaser.Input.Keyboard.KeyCodes.DELETE,
    resetFromLive: Phaser.Input.Keyboard.KeyCodes.ESC,
  });

  const clampWorldPoint = (point) => ({
    x: Phaser.Math.Clamp(point.x, 0, config.worldWidth),
    y: Phaser.Math.Clamp(point.y, 0, config.worldHeight),
  });

  const getWorkingTemplatePoints = () => state.workingWorldPoints.map((point) => config.toTemplatePoint(point));

  const refreshOverlay = (force = false) => {
    const now = scene.time?.now || 0;
    if (!force && now - state.lastRefreshAt < 90) {
      return;
    }
    state.lastRefreshAt = now;

    graphics.clear();
    if (!state.enabled) {
      hudText.setVisible(false);
      graphics.setVisible(false);
      return;
    }

    graphics.setVisible(true);

    if (state.workingWorldPoints.length >= 2) {
      graphics.lineStyle(3, 0x35f3d0, 0.95);
      graphics.beginPath();
      graphics.moveTo(state.workingWorldPoints[0].x, state.workingWorldPoints[0].y);
      for (let i = 1; i < state.workingWorldPoints.length; i += 1) {
        graphics.lineTo(state.workingWorldPoints[i].x, state.workingWorldPoints[i].y);
      }
      graphics.strokePath();
    }

    state.workingWorldPoints.forEach((point, index) => {
      const color = index === 0 ? 0xffcf6a : (index === state.workingWorldPoints.length - 1 ? 0xff7892 : 0x8bf7ff);
      graphics.fillStyle(color, 0.98);
      graphics.fillCircle(point.x, point.y, 6);
      graphics.lineStyle(2, 0x0a121d, 0.8);
      graphics.strokeCircle(point.x, point.y, 6);
    });

    const template = config.getActiveTemplateMeta();
    hudText.setVisible(true);
    hudText.setText([
      'PATH EDITOR (F7)',
      'Template: ' + (template.name || 'Unknown') + ' [' + (template.id || 'n/a') + ']',
      'Waypoints: ' + state.workingWorldPoints.length,
      'Shift+Left Click: add waypoint',
      'Backspace: remove last, Delete: clear all',
      'F8 save draft JSON, F9 load draft JSON',
      'F10 apply to live path, Esc reset from live path',
    ].join('\n'));
  };

  const setWorkingFromLivePath = () => {
    state.workingWorldPoints = clonePoints(config.getCurrentPath()).map(clampWorldPoint);
    refreshOverlay(true);
  };

  const toggleEnabled = () => {
    if (!state.enabled) {
      state.enabled = true;
      setWorkingFromLivePath();
      config.onStatus('Path editor enabled. Shift+Left Click adds waypoints.', '#8cf3ff');
      return;
    }
    state.enabled = false;
    refreshOverlay(true);
    config.onStatus('Path editor disabled.', '#8cf3ff');
  };

  const onPointerDown = (pointer) => {
    if (!state.enabled || !config.canEdit()) {
      return;
    }
    if (pointer.button !== 0 || !pointer.event?.shiftKey) {
      return;
    }

    state.workingWorldPoints.push(clampWorldPoint({ x: pointer.worldX, y: pointer.worldY }));
    refreshOverlay(true);
  };

  const saveDraft = async () => {
    if (state.workingWorldPoints.length < 2) {
      config.onStatus('Path draft needs at least 2 waypoints before saving.', '#ffcf8a');
      return;
    }

    const payload = {
      version: 1,
      template: config.getActiveTemplateMeta(),
      updatedAt: Date.now(),
      points: getWorkingTemplatePoints(),
    };

    const json = JSON.stringify(payload, null, 2);
    localStorage.setItem(config.storageKey, json);

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(json);
      }
    } catch (_) {
      // Ignore clipboard restrictions; localStorage is the canonical save target.
    }

    config.onStatus('Path draft saved to localStorage and copied to clipboard (when allowed).', '#89ffd0');
  };

  const loadDraft = () => {
    const raw = localStorage.getItem(config.storageKey);
    if (!raw) {
      config.onStatus('No saved path draft found.', '#ffcf8a');
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (_error) {
      config.onStatus('Saved path draft is invalid JSON.', '#ff8fa7');
      return;
    }

    const points = Array.isArray(parsed?.points) ? parsed.points : [];
    if (points.length < 2) {
      config.onStatus('Saved path draft must contain at least 2 waypoints.', '#ff8fa7');
      return;
    }

    state.workingWorldPoints = points
      .map((point) => config.fromTemplatePoint(point))
      .map(clampWorldPoint);
    refreshOverlay(true);
    config.onStatus('Path draft loaded into editor.', '#89ffd0');
  };

  const applyWorkingPath = () => {
    if (!config.canEdit()) {
      config.onStatus('Path edits are allowed only during prep phase.', '#ffcf8a');
      return;
    }
    if (state.workingWorldPoints.length < 2) {
      config.onStatus('Path needs at least 2 waypoints to apply.', '#ffcf8a');
      return;
    }

    config.applyWorldPath(clonePoints(state.workingWorldPoints));
    refreshOverlay(true);
    config.onStatus('Edited path applied to live scene.', '#89ffd0');
  };

  const removeLastPoint = () => {
    if (state.workingWorldPoints.length <= 0) {
      return;
    }
    state.workingWorldPoints.pop();
    refreshOverlay(true);
  };

  const clearPoints = () => {
    state.workingWorldPoints = [];
    refreshOverlay(true);
  };

  const resetFromLive = () => {
    setWorkingFromLivePath();
    config.onStatus('Path editor reset from live path.', '#8cf3ff');
  };

  const update = () => {
    if (Phaser.Input.Keyboard.JustDown(keys.toggle)) {
      toggleEnabled();
    }

    if (!state.enabled) {
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(keys.saveDraft)) {
      saveDraft();
    }
    if (Phaser.Input.Keyboard.JustDown(keys.loadDraft)) {
      loadDraft();
    }
    if (Phaser.Input.Keyboard.JustDown(keys.applyPath)) {
      applyWorkingPath();
    }
    if (Phaser.Input.Keyboard.JustDown(keys.removeLast)) {
      removeLastPoint();
    }
    if (Phaser.Input.Keyboard.JustDown(keys.clearAll)) {
      clearPoints();
    }
    if (Phaser.Input.Keyboard.JustDown(keys.resetFromLive)) {
      resetFromLive();
    }

    refreshOverlay();
  };

  const getExportPayload = () => ({
    version: 1,
    template: config.getActiveTemplateMeta(),
    points: getWorkingTemplatePoints(),
  });

  const destroy = () => {
    scene.input.off('pointerdown', onPointerDown);
    graphics.destroy();
    hudText.destroy();
  };

  scene.input.on('pointerdown', onPointerDown);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, destroy);

  return {
    update,
    destroy,
    toggleEnabled,
    resetFromLive,
    applyWorkingPath,
    getExportPayload,
  };
}