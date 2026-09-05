/**
 * Interactive Barrel Position Calibrator
 * Allows clicking and dragging dots directly on weapon sprites to define exact barrel firing coordinates.
 * Saves positions to localStorage and live-updates the active turret firing positions in real time.
 */

export class BarrelCalibrator {
  constructor(scene) {
    this.scene = scene;
    this.isOpen = false;
    this.currentWeaponId = 12;
    this.selectedDotIndex = -1;
    this.isDragging = false;
    this.canvasScale = 3.0; // 128px sprite -> 384px canvas
    this.spriteSize = 128;
    this.dots = []; // Array of { lateral, forward } in sprite coordinates (-64 to +64)
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.launcherBtn = null;
    
    this.init();
  }

  isDevModeAvailable() {
    if (typeof window === 'undefined') return false;
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
      return true;
    }
    const host = String(window.location?.hostname || '').toLowerCase();
    const protocol = String(window.location?.protocol || '').toLowerCase();
    const isLocal = (protocol === 'http:' || protocol === 'https:') &&
      (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local'));
    return isLocal;
  }

  isFeatureEnabled() {
    if (!this.isDevModeAvailable()) {
      return false;
    }
    try {
      if (typeof window !== 'undefined' && typeof window.__tdBarrelCalibratorEnabled === 'boolean') {
        return window.__tdBarrelCalibratorEnabled;
      }
      return localStorage.getItem('tdBarrelCalibratorDevV1') === '1';
    } catch (_) {
      return false;
    }
  }

  init() {
    this.createLauncherButton();
    this.createModal();
    this.bindGlobalKeys();
    this.syncVisibility();
  }

  syncVisibility() {
    const isEnabled = this.isFeatureEnabled();
    this.setVisible(isEnabled);
  }

  setVisible(visible) {
    if (this.launcherBtn) {
      this.launcherBtn.style.display = (visible && this.isDevModeAvailable()) ? 'flex' : 'none';
    }
    if (!visible && this.isOpen) {
      this.close();
    }
  }

  createLauncherButton() {
    if (document.getElementById('barrel-calibrator-launcher')) {
      return;
    }

    const btn = document.createElement('button');
    btn.id = 'barrel-calibrator-launcher';
    btn.innerHTML = '🎯 Calibrate Barrels';
    btn.style.cssText = `
      position: fixed;
      top: 14px;
      left: 140px;
      z-index: 99999;
      background: linear-gradient(135deg, rgba(20, 35, 50, 0.94), rgba(10, 20, 30, 0.96));
      color: #64ffda;
      border: 1.5px solid #00f0ff;
      border-radius: 6px;
      padding: 7px 14px;
      font-family: "Trebuchet MS", "Segoe UI", sans-serif;
      font-size: 13px;
      font-weight: bold;
      letter-spacing: 0.5px;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(0, 240, 255, 0.28), inset 0 0 8px rgba(0, 240, 255, 0.15);
      backdrop-filter: blur(8px);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    `;

    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-1px) scale(1.03)';
      btn.style.boxShadow = '0 6px 18px rgba(0, 240, 255, 0.45), inset 0 0 12px rgba(0, 240, 255, 0.3)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'none';
      btn.style.boxShadow = '0 4px 14px rgba(0, 240, 255, 0.28), inset 0 0 8px rgba(0, 240, 255, 0.15)';
    });

    btn.addEventListener('click', () => {
      this.toggle();
    });

    document.body.appendChild(btn);
    this.launcherBtn = btn;
  }

  createModal() {
    if (document.getElementById('barrel-calibrator-modal')) {
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'barrel-calibrator-modal';
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 100000;
      width: 780px;
      max-width: 95vw;
      max-height: 90vh;
      background: #0d1520;
      border: 2px solid #00f0ff;
      border-radius: 12px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.85), 0 0 24px rgba(0, 240, 255, 0.3);
      color: #e0f2fe;
      font-family: "Trebuchet MS", "Segoe UI", sans-serif;
      display: none;
      flex-direction: column;
      overflow: hidden;
      user-select: none;
    `;

    modal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 18px; background: rgba(0, 240, 255, 0.08); border-bottom: 1px solid rgba(0, 240, 255, 0.25);">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 20px;">🎯</span>
          <span style="font-weight: bold; font-size: 16px; color: #64ffda; letter-spacing: 0.5px;">Barrel Position Calibrator</span>
          <select id="calibrator-weapon-select" style="background: #081018; color: #38bdf8; border: 1px solid #0284c7; border-radius: 4px; padding: 4px 8px; font-size: 13px; font-weight: bold; cursor: pointer; outline: none; margin-left: 8px;">
          </select>
        </div>
        <button id="calibrator-close-btn" style="background: transparent; border: none; color: #94a3b8; font-size: 20px; font-weight: bold; cursor: pointer; padding: 2px 8px; border-radius: 4px; transition: color 0.15s;">✕</button>
      </div>

      <div style="display: flex; flex: 1; padding: 16px; gap: 18px; overflow-y: auto;">
        <!-- Left: Interactive Canvas -->
        <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
          <div style="display: flex; justify-content: space-between; width: 384px; font-size: 12px; color: #7dd3fc;">
            <span>▲ FORWARD / MUZZLE</span>
            <span id="calibrator-canvas-cursor" style="color: #fcd34d; font-family: monospace;">(0, 0)</span>
          </div>

          <div style="position: relative; width: 384px; height: 384px; background: #060a10; border: 2px solid #1e293b; border-radius: 8px; box-shadow: inset 0 0 20px rgba(0,0,0,0.8); cursor: crosshair; overflow: hidden;">
            <canvas id="calibrator-canvas" width="384" height="384" style="width: 384px; height: 384px; display: block;"></canvas>
            <div style="position: absolute; bottom: 6px; left: 8px; font-size: 11px; color: rgba(255,255,255,0.45); pointer-events: none;">
              Click to place dot • Drag to move • Right-click to remove
            </div>
          </div>

          <div style="display: flex; gap: 8px; width: 384px; justify-content: center; margin-top: 4px;">
            <button id="calibrator-add-dot-btn" style="background: #0369a1; color: #fff; border: 1px solid #38bdf8; border-radius: 4px; padding: 6px 12px; font-size: 12px; font-weight: bold; cursor: pointer;">+ Add Dot</button>
            <button id="calibrator-symmetrize-btn" style="background: #0f766e; color: #fff; border: 1px solid #2dd4bf; border-radius: 4px; padding: 6px 12px; font-size: 12px; font-weight: bold; cursor: pointer;">🪞 Mirror Left to Right</button>
            <button id="calibrator-clear-btn" style="background: #be123c; color: #fff; border: 1px solid #f43f5e; border-radius: 4px; padding: 6px 12px; font-size: 12px; font-weight: bold; cursor: pointer;">🗑️ Clear</button>
            <button id="calibrator-reset-btn" style="background: #334155; color: #cbd5e1; border: 1px solid #64748b; border-radius: 4px; padding: 6px 12px; font-size: 12px; font-weight: bold; cursor: pointer;">🔄 Reset</button>
          </div>
        </div>

        <!-- Right: Dot List & Export Panel -->
        <div style="display: flex; flex-direction: column; flex: 1; gap: 12px; min-width: 280px;">
          <div style="background: #080e18; border: 1px solid #1e293b; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: bold; font-size: 13px; color: #38bdf8;">Configured Barrels (<span id="calibrator-dot-count">0</span>)</span>
              <span style="font-size: 11px; color: #94a3b8;">Fires in sequence 1 → N</span>
            </div>
            
            <div id="calibrator-dot-list" style="max-height: 150px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; padding-right: 4px;">
              <!-- Dynamic dot items -->
            </div>
          </div>

          <!-- Code Snippet Box -->
          <div style="background: #080e18; border: 1px solid #1e293b; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 6px; flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: bold; font-size: 12px; color: #a5f3fc;">Code Snippet (game-weapon-data.js)</span>
              <button id="calibrator-copy-btn" style="background: #0284c7; color: #fff; border: none; border-radius: 4px; padding: 4px 8px; font-size: 11px; font-weight: bold; cursor: pointer;">📋 Copy Code</button>
            </div>
            <textarea id="calibrator-code-output" readonly style="flex: 1; min-height: 85px; background: #04070c; color: #34d399; border: 1px solid #1e293b; border-radius: 4px; padding: 6px 8px; font-family: monospace; font-size: 11px; resize: none; outline: none;"></textarea>
          </div>

          <!-- Apply & Test Controls -->
          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button id="calibrator-apply-btn" style="background: linear-gradient(135deg, #059669, #10b981); color: #fff; border: 1px solid #34d399; border-radius: 6px; padding: 8px 18px; font-size: 13px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
              💾 Save & Apply Live
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.container = modal;
    this.canvas = modal.querySelector('#calibrator-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.bindModalEvents();
  }

  bindGlobalKeys() {
    window.addEventListener('keydown', (e) => {
      // 'b' or 'B' to toggle calibrator (unless typing in an input) - only when enabled
      if ((e.key === 'b' || e.key === 'B') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        if (this.isFeatureEnabled()) {
          this.toggle();
        }
      }

      // If calibrator is open and a dot is selected, arrow keys nudge it
      if (this.isOpen && this.selectedDotIndex >= 0 && this.selectedDotIndex < this.dots.length) {
        const step = e.shiftKey ? 5 : 1;
        const dot = this.dots[this.selectedDotIndex];
        let changed = false;

        if (e.key === 'ArrowLeft') {
          dot.lateral -= step;
          changed = true;
        } else if (e.key === 'ArrowRight') {
          dot.lateral += step;
          changed = true;
        } else if (e.key === 'ArrowUp') {
          dot.forward += step;
          changed = true;
        } else if (e.key === 'ArrowDown') {
          dot.forward -= step;
          changed = true;
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          this.dots.splice(this.selectedDotIndex, 1);
          this.selectedDotIndex = Math.min(this.selectedDotIndex, this.dots.length - 1);
          changed = true;
        }

        if (changed) {
          e.preventDefault();
          this.clampDots();
          this.render();
          this.updateUi();
          this.applyToLiveTower();
        }
      }
    });
  }

  bindModalEvents() {
    const modal = this.container;
    modal.querySelector('#calibrator-close-btn').addEventListener('click', () => this.close());
    modal.querySelector('#calibrator-close-btn').addEventListener('mouseenter', (e) => e.target.style.color = '#ef4444');
    modal.querySelector('#calibrator-close-btn').addEventListener('mouseleave', (e) => e.target.style.color = '#94a3b8');

    // Weapon Selector
    const select = modal.querySelector('#calibrator-weapon-select');
    select.addEventListener('change', (e) => {
      this.switchWeapon(Number(e.target.value));
    });

    // Action buttons
    modal.querySelector('#calibrator-add-dot-btn').addEventListener('click', () => {
      this.dots.push({ lateral: 0, forward: 36 });
      this.selectedDotIndex = this.dots.length - 1;
      this.render();
      this.updateUi();
      this.applyToLiveTower();
    });

    modal.querySelector('#calibrator-symmetrize-btn').addEventListener('click', () => {
      this.symmetrize();
    });

    modal.querySelector('#calibrator-clear-btn').addEventListener('click', () => {
      this.dots = [];
      this.selectedDotIndex = -1;
      this.render();
      this.updateUi();
      this.applyToLiveTower();
    });

    modal.querySelector('#calibrator-reset-btn').addEventListener('click', () => {
      this.resetToWeaponDefault();
    });

    modal.querySelector('#calibrator-apply-btn').addEventListener('click', () => {
      this.saveToStorage();
      this.applyToLiveTower();
      const btn = modal.querySelector('#calibrator-apply-btn');
      const originalText = btn.innerHTML;
      btn.innerHTML = '✅ Saved & Applied!';
      btn.style.background = '#0284c7';
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = 'linear-gradient(135deg, #059669, #10b981)';
      }, 1500);
    });

    modal.querySelector('#calibrator-copy-btn').addEventListener('click', () => {
      const textarea = modal.querySelector('#calibrator-code-output');
      textarea.select();
      navigator.clipboard?.writeText(textarea.value);
      const btn = modal.querySelector('#calibrator-copy-btn');
      btn.innerHTML = '✅ Copied!';
      setTimeout(() => { btn.innerHTML = '📋 Copy Code'; }, 1500);
    });

    // Canvas Events (Click, Drag, Cursor Readout)
    const canvas = this.canvas;
    const cursorDisplay = modal.querySelector('#calibrator-canvas-cursor');

    const getCanvasCoords = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      const center = canvas.width / 2;
      // Convert to sprite units (-64 to +64)
      const lateral = Math.round((x - center) / this.canvasScale);
      const forward = Math.round((center - y) / this.canvasScale);
      return { x, y, lateral, forward };
    };

    canvas.addEventListener('mousemove', (e) => {
      const coords = getCanvasCoords(e);
      cursorDisplay.textContent = `Lateral (X): ${coords.lateral > 0 ? '+' : ''}${coords.lateral}px, Forward (Y): ${coords.forward > 0 ? '+' : ''}${coords.forward}px`;

      if (this.isDragging && this.selectedDotIndex >= 0 && this.selectedDotIndex < this.dots.length) {
        this.dots[this.selectedDotIndex].lateral = coords.lateral;
        this.dots[this.selectedDotIndex].forward = coords.forward;
        this.clampDots();
        this.render();
        this.updateUi();
        this.applyToLiveTower();
      }
    });

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 2) {
        return; // Handled by contextmenu
      }

      const coords = getCanvasCoords(e);
      const clickedDotIndex = this.findDotAt(coords.lateral, coords.forward);

      if (clickedDotIndex >= 0) {
        this.selectedDotIndex = clickedDotIndex;
        this.isDragging = true;
      } else {
        // Add new dot at click location
        this.dots.push({ lateral: coords.lateral, forward: coords.forward });
        this.selectedDotIndex = this.dots.length - 1;
        this.isDragging = true;
      }

      this.clampDots();
      this.render();
      this.updateUi();
      this.applyToLiveTower();
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.saveToStorage();
        this.applyToLiveTower();
      }
    });

    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const coords = getCanvasCoords(e);
      const clickedDotIndex = this.findDotAt(coords.lateral, coords.forward);
      if (clickedDotIndex >= 0) {
        this.dots.splice(clickedDotIndex, 1);
        this.selectedDotIndex = -1;
        this.render();
        this.updateUi();
        this.saveToStorage();
        this.applyToLiveTower();
      }
    });
  }

  findDotAt(lateral, forward, threshold = 6) {
    for (let i = 0; i < this.dots.length; i++) {
      const dot = this.dots[i];
      const dist = Math.hypot(dot.lateral - lateral, dot.forward - forward);
      if (dist <= threshold) {
        return i;
      }
    }
    return -1;
  }

  clampDots() {
    this.dots.forEach((dot) => {
      dot.lateral = Math.max(-60, Math.min(60, dot.lateral));
      dot.forward = Math.max(-60, Math.min(60, dot.forward));
    });
  }

  populateWeaponDropdown() {
    const select = this.container.querySelector('#calibrator-weapon-select');
    select.innerHTML = '';
    const catalog = this.scene?.towerCatalog || [];
    catalog.forEach((weapon) => {
      const opt = document.createElement('option');
      opt.value = weapon.id;
      opt.textContent = `${weapon.id}: ${weapon.name || 'Weapon ' + weapon.id}`;
      if (weapon.id === this.currentWeaponId) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });
  }

  switchWeapon(weaponId) {
    this.currentWeaponId = weaponId;
    this.selectedDotIndex = -1;
    this.loadWeaponDots(weaponId);
    this.render();
    this.updateUi();
    this.applyToLiveTower();
  }

  loadWeaponDots(weaponId) {
    // 1. Try loading from localStorage
    try {
      const saved = localStorage.getItem('weapon_barrel_offsets_' + weaponId);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.dots = parsed.map(d => ({ lateral: Number(d.lateral ?? d.x ?? 0), forward: Number(d.forward ?? d.y ?? 0) }));
          return;
        }
      }
    } catch (e) {}

    // 2. Load from weapon definition default
    this.resetToWeaponDefault(false);
  }

  resetToWeaponDefault(andRender = true) {
    const weapon = (this.scene?.towerCatalog || []).find(w => w.id === this.currentWeaponId);
    if (weapon?.barrelOffsets && Array.isArray(weapon.barrelOffsets)) {
      this.dots = weapon.barrelOffsets.map(d => ({ lateral: Number(d.lateral ?? d.x ?? 0), forward: Number(d.forward ?? d.y ?? 0) }));
    } else if (weapon?.barrelLateralOffsets && Array.isArray(weapon.barrelLateralOffsets)) {
      const fwd = Number(weapon.barrelForwardOffset || 36);
      this.dots = weapon.barrelLateralOffsets.map(lat => ({ lateral: Number(lat), forward: fwd }));
    } else if (this.currentWeaponId === 17 || this.currentWeaponId === 12) {
      // Default 6-barrel layout for MK12 and Storm Barrage MK2
      this.dots = [
        { lateral: -46, forward: 36 },
        { lateral: -34, forward: 36 },
        { lateral: -22, forward: 36 },
        { lateral: 22, forward: 36 },
        { lateral: 34, forward: 36 },
        { lateral: 46, forward: 36 },
      ];
    } else if (this.currentWeaponId === 11) {
      this.dots = [
        { lateral: -21, forward: 36 },
        { lateral: -14, forward: 36 },
        { lateral: 14, forward: 36 },
        { lateral: 21, forward: 36 },
      ];
    } else if (this.currentWeaponId === 10) {
      this.dots = [
        { lateral: -18, forward: 36 },
        { lateral: -6, forward: 36 },
        { lateral: 6, forward: 36 },
        { lateral: 18, forward: 36 },
      ];
    } else {
      this.dots = [
        { lateral: -14, forward: 36 },
        { lateral: 14, forward: 36 },
      ];
    }

    if (andRender) {
      this.saveToStorage();
      this.render();
      this.updateUi();
      this.applyToLiveTower();
    }
  }

  symmetrize() {
    // Mirror all left dots (lateral < 0) to the right side
    const leftDots = this.dots.filter(d => d.lateral < 0);
    if (leftDots.length === 0) {
      return;
    }

    const centerDots = this.dots.filter(d => d.lateral === 0);
    const mirroredRightDots = leftDots.map(d => ({
      lateral: Math.abs(d.lateral),
      forward: d.forward,
    })).sort((a, b) => a.lateral - b.lateral);

    // Combine: sorted left-to-right
    leftDots.sort((a, b) => a.lateral - b.lateral);
    this.dots = [...leftDots, ...centerDots, ...mirroredRightDots];
    this.selectedDotIndex = -1;
    this.saveToStorage();
    this.render();
    this.updateUi();
    this.applyToLiveTower();
  }

  saveToStorage() {
    try {
      localStorage.setItem('weapon_barrel_offsets_' + this.currentWeaponId, JSON.stringify(this.dots));
    } catch (e) {}
  }

  applyToLiveTower() {
    if (!this.scene) {
      return;
    }

    const activeTowers = this.scene.towers?.children?.entries || [];
    activeTowers.forEach((tower) => {
      if (tower?.active && (tower.getData('towerId') === this.currentWeaponId || this.isOpen)) {
        tower.setData('barrelOffsets', this.dots.map(d => ({ ...d })));
        tower.setData('rocketCount', this.dots.length || 1);
        tower.setData('barrelLateralOffsets', this.dots.map(d => d.lateral));
      }
    });
  }

  render() {
    if (!this.ctx || !this.canvas) {
      return;
    }

    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const center = width / 2;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Background Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 12 * this.canvasScale;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 2. Draw Sprite
    const weapon = (this.scene?.towerCatalog || []).find(w => w.id === this.currentWeaponId);
    const textureKey = weapon?.textureKey || ('gsTurret' + this.currentWeaponId);
    let spriteDrawn = false;

    if (this.scene?.textures?.exists(textureKey)) {
      const sourceImage = this.scene.textures.get(textureKey)?.getSourceImage();
      if (sourceImage) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(sourceImage, 0, 0, width, height);
        spriteDrawn = true;
      }
    }

    if (!spriteDrawn) {
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(center, center, 48 * this.canvasScale, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Draw Center Crosshairs & Axis
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(center, 0);
    ctx.lineTo(center, height);
    ctx.moveTo(0, center);
    ctx.lineTo(width, center);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Draw Center Origin Point
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(center, center, 3, 0, Math.PI * 2);
    ctx.fill();

    // 5. Draw Barrel Dots
    this.dots.forEach((dot, index) => {
      const isSelected = index === this.selectedDotIndex;
      const screenX = center + (dot.lateral * this.canvasScale);
      const screenY = center - (dot.forward * this.canvasScale);

      // Firing direction ray (upwards from barrel)
      ctx.strokeStyle = isSelected ? 'rgba(255, 230, 0, 0.6)' : 'rgba(0, 240, 255, 0.25)';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(screenX, screenY);
      ctx.lineTo(screenX, screenY - 24);
      ctx.stroke();

      // Outer glow circle
      ctx.fillStyle = isSelected ? 'rgba(255, 230, 0, 0.35)' : 'rgba(0, 240, 255, 0.25)';
      ctx.beginPath();
      ctx.arc(screenX, screenY, isSelected ? 12 : 9, 0, Math.PI * 2);
      ctx.fill();

      // Inner solid dot
      ctx.fillStyle = isSelected ? '#ffe600' : '#00f0ff';
      ctx.beginPath();
      ctx.arc(screenX, screenY, isSelected ? 6 : 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Dot Border
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Dot Number Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(index + 1), screenX, screenY + 14);
    });
  }

  updateUi() {
    if (!this.container) {
      return;
    }

    const modal = this.container;
    modal.querySelector('#calibrator-dot-count').textContent = this.dots.length;

    // Dot List
    const list = modal.querySelector('#calibrator-dot-list');
    list.innerHTML = '';
    this.dots.forEach((dot, index) => {
      const isSelected = index === this.selectedDotIndex;
      const row = document.createElement('div');
      row.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 8px;
        background: ${isSelected ? 'rgba(0, 240, 255, 0.18)' : 'rgba(255, 255, 255, 0.03)'};
        border: 1px solid ${isSelected ? '#00f0ff' : 'rgba(255, 255, 255, 0.08)'};
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
      `;

      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-weight: bold; color: ${isSelected ? '#ffe600' : '#38bdf8'};">#${index + 1}</span>
          <span style="font-family: monospace; color: #cbd5e1;">X: ${dot.lateral > 0 ? '+' : ''}${dot.lateral}px, Y: ${dot.forward > 0 ? '+' : ''}${dot.forward}px</span>
        </div>
        <button data-delete-idx="${index}" style="background: transparent; border: none; color: #f43f5e; font-size: 13px; cursor: pointer; padding: 0 4px;">✕</button>
      `;

      row.addEventListener('click', (e) => {
        if (e.target.getAttribute('data-delete-idx') !== null) {
          return;
        }
        this.selectedDotIndex = index;
        this.render();
        this.updateUi();
      });

      row.querySelector('[data-delete-idx]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dots.splice(index, 1);
        this.selectedDotIndex = -1;
        this.render();
        this.updateUi();
        this.saveToStorage();
        this.applyToLiveTower();
      });

      list.appendChild(row);
    });

    // Generate Code Output
    const code = `    barrelOffsets: [\n` +
      this.dots.map(d => `      { lateral: ${d.lateral}, forward: ${d.forward} },`).join('\n') +
      `\n    ],`;
    modal.querySelector('#calibrator-code-output').value = code;
  }

  open(weaponId) {
    if (weaponId) {
      this.currentWeaponId = weaponId;
    }
    this.isOpen = true;
    this.populateWeaponDropdown();
    this.loadWeaponDots(this.currentWeaponId);
    this.container.style.display = 'flex';
    this.render();
    this.updateUi();
    this.applyToLiveTower();
  }

  close() {
    this.isOpen = false;
    this.container.style.display = 'none';
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      const activeTower = this.scene?.towers?.children?.entries?.find(t => t?.active);
      const activeId = activeTower?.getData('towerId') || this.currentWeaponId;
      this.open(activeId);
    }
  }
}
