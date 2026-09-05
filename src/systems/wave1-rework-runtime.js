import Phaser from 'phaser';
import { TOWER_GLOBAL_SCALE_MULT } from './game-config-constants';

const clamp = Phaser.Math.Clamp;

const splinePoints = (points, samples = 140) => {
  const spline = new Phaser.Curves.Spline(points.map((p) => new Phaser.Math.Vector2(p.x, p.y)));
  return spline.getPoints(samples).map((p) => ({ x: p.x, y: p.y }));
};

const buildSegments = (points) => {
  const segments = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy);
    if (length <= 0) continue;
    segments.push({ start: a, end: b, length, ux: dx / length, uy: dy / length });
  }
  return segments;
};

const distanceToSegment = (x, y, x1, y1, x2, y2) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Phaser.Math.Distance.Between(x, y, x1, y1);
  const t = clamp(((x - x1) * dx + (y - y1) * dy) / ((dx * dx) + (dy * dy)), 0, 1);
  const px = x1 + (t * dx);
  const py = y1 + (t * dy);
  return Phaser.Math.Distance.Between(x, y, px, py);
};

const drawPolyline = (graphics, points, width, color, alpha) => {
  if (!points.length) return;
  graphics.lineStyle(width, color, alpha);
  graphics.beginPath();
  graphics.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    graphics.lineTo(points[i].x, points[i].y);
  }
  graphics.strokePath();
};

export function createWave1ReworkRuntime(scene, options = {}) {
  const cfg = {
    boardWidth: 1600,
    boardHeight: 900,
    mapOffsetY: 0,
    pathHalfWidth: 22,
    topHudGuardY: 110,
    bottomTrayGuardY: 805,
    ...options,
  };

  const state = {
    active: true,
    waveActive: false,
    wavePlan: [],
    spawnIndex: 0,
    nextSpawnAt: 0,
    towerList: [],
    enemyList: [],
    projectileList: [],
    mapLayer: null,
    roadsLayer: null,
    decoLayer: null,
    padsLayer: null,
    pathMain: [],
    pathMainSegments: [],
    entrances: [],
    allPathSegments: [],
    towerPads: [],
    chokePoints: [],
    castleGate: null,
    enemySerial: 0,
    towerSerial: 0,
  };

  const destroyOldLayer = () => {
    if (scene.mapLayer?.destroy) scene.mapLayer.destroy(true);
    scene.mapLayer = null;
    if (state.mapLayer?.destroy) state.mapLayer.destroy(true);
    state.mapLayer = null;
    state.roadsLayer = null;
    state.decoLayer = null;
    state.padsLayer = null;
  };

  const minDistanceToAnyPath = (x, y) => {
    let best = Number.POSITIVE_INFINITY;
    state.allPathSegments.forEach((seg) => {
      const d = distanceToSegment(x, y, seg.start.x, seg.start.y, seg.end.x, seg.end.y);
      if (d < best) best = d;
    });
    return best;
  };

  const getNearestFreePad = (x, y, threshold = 44) => {
    let nearest = null;
    let best = threshold;
    state.towerPads.forEach((pad) => {
      if (pad.occupied) return;
      const d = Phaser.Math.Distance.Between(x, y, pad.x, pad.y);
      if (d <= best) {
        best = d;
        nearest = pad;
      }
    });
    return nearest;
  };

  const addForestCluster = (x, y, count, spreadX, spreadY) => {
    for (let i = 0; i < count; i += 1) {
      const px = x + Phaser.Math.Between(-spreadX, spreadX);
      const py = y + Phaser.Math.Between(-spreadY, spreadY);
      const size = Phaser.Math.Between(20, 40);
      const trunk = scene.add.rectangle(px, py + 18, 6, 18, 0x4e3a28, 0.84).setDepth(1.05);
      const crown = scene.add.circle(px, py, size, Phaser.Math.Between(0x2f5d39, 0x4a7e52), 0.92).setDepth(1.08);
      state.decoLayer.add([trunk, crown]);
    }
  };

  const addCliffArc = (centerX, centerY, radiusX, radiusY, startDeg, endDeg, thickness = 28) => {
    const g = scene.add.graphics().setDepth(1.14);
    g.lineStyle(thickness, 0x4b4339, 0.92);
    g.beginPath();
    const steps = 26;
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const a = Phaser.Math.DegToRad(Phaser.Math.Linear(startDeg, endDeg, t));
      const x = centerX + Math.cos(a) * radiusX;
      const y = centerY + Math.sin(a) * radiusY;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.strokePath();
    state.decoLayer.add(g);
  };

  const findNearestPathIndex = (pts, target) => {
    let best = Infinity;
    let idx = 0;
    pts.forEach((p, i) => {
      const d = Math.hypot(p.x - target.x, p.y - target.y);
      if (d < best) { best = d; idx = i; }
    });
    return idx;
  };

  const buildRoadLayout = () => {
    const oy = cfg.mapOffsetY;

    // ── Key waypoints ─────────────────────────────────────────────────────────
    // leftMerge  : where NW and SW branches first combine into the main stream
    // neJoin     : point along the main road where the NE tributary arrives from the north
    // seJoin     : point along the main road where the SE tributary arrives from the south
    const leftMerge  = { x: 452, y: 382 + oy };
    const neJoin     = { x: 634, y: 350 + oy };
    const seJoin     = { x: 752, y: 422 + oy };
    const bridge     = { x: 898, y: 408 + oy };
    const pass       = { x: 1118, y: 448 + oy };
    const castleGate = { x: 1450, y: 222 + oy };

    state.chokePoints = [
      { id: 'stone-bridge',  name: 'Stone Bridge',  x: bridge.x,     y: bridge.y     },
      { id: 'mountain-pass', name: 'Mountain Pass', x: pass.x,       y: pass.y       },
      { id: 'castle-gate',   name: 'Castle Gate',   x: castleGate.x, y: castleGate.y },
    ];
    state.castleGate = castleGate;

    // ── Main road: leftMerge → neJoin → seJoin → bridge → pass → castle ──────
    const mainControl = [
      leftMerge,
      { x: 502, y: 374 + oy },
      { x: 562, y: 362 + oy },
      neJoin,
      { x: 678, y: 358 + oy },
      { x: 716, y: 384 + oy },
      seJoin,
      { x: 782, y: 415 + oy },
      { x: 840, y: 410 + oy },
      bridge,
      { x: 950, y: 420 + oy },
      { x: 1018, y: 434 + oy },
      pass,
      { x: 1185, y: 438 + oy },
      { x: 1248, y: 404 + oy },
      { x: 1308, y: 358 + oy },
      { x: 1362, y: 298 + oy },
      { x: 1408, y: 252 + oy },
      castleGate,
    ];
    state.pathMain = splinePoints(mainControl, 230);
    state.pathMainSegments = buildSegments(state.pathMain);

    // Find indices in pathMain where NE and SE tributaries join
    const neJoinIndex = findNearestPathIndex(state.pathMain, neJoin);
    const seJoinIndex = findNearestPathIndex(state.pathMain, seJoin);

    // ── NW branch : cave (upper-left) → leftMerge ────────────────────────────
    const nwBranch = splinePoints([
      { x: 62,  y: 148 + oy },
      { x: 118, y: 182 + oy },
      { x: 192, y: 218 + oy },
      { x: 268, y: 252 + oy },
      { x: 342, y: 280 + oy },
      { x: 402, y: 310 + oy },
      { x: 438, y: 346 + oy },
      { x: 448, y: 368 + oy },
      leftMerge,
    ], 130);

    // ── SW branch : mine (lower-left) → leftMerge ────────────────────────────
    const swBranch = splinePoints([
      { x: 62,  y: 772 + oy },
      { x: 118, y: 748 + oy },
      { x: 195, y: 712 + oy },
      { x: 272, y: 668 + oy },
      { x: 345, y: 618 + oy },
      { x: 395, y: 568 + oy },
      { x: 428, y: 512 + oy },
      { x: 444, y: 452 + oy },
      { x: 448, y: 408 + oy },
      leftMerge,
    ], 145);

    // ── NE branch : trail (upper-right) sweeps across the entire northern band,
    //               arriving at neJoin from the north-east ────────────────────
    const neBranch = splinePoints([
      { x: 1534, y: 148 + oy },
      { x: 1440, y: 162 + oy },
      { x: 1325, y: 190 + oy },
      { x: 1205, y: 220 + oy },
      { x: 1082, y: 250 + oy },
      { x: 960,  y: 278 + oy },
      { x: 845,  y: 306 + oy },
      { x: 748,  y: 326 + oy },
      { x: 688,  y: 338 + oy },
      neJoin,
    ], 165);

    // ── SE branch : pass (lower-right) sweeps across the entire southern band,
    //               arriving at seJoin from the south ────────────────────────
    const seBranch = splinePoints([
      { x: 1534, y: 772 + oy },
      { x: 1440, y: 750 + oy },
      { x: 1325, y: 716 + oy },
      { x: 1208, y: 680 + oy },
      { x: 1085, y: 640 + oy },
      { x: 962,  y: 600 + oy },
      { x: 848,  y: 560 + oy },
      { x: 760,  y: 528 + oy },
      { x: 755,  y: 488 + oy },
      { x: 753,  y: 452 + oy },
      seJoin,
    ], 170);

    const entrances = [
      { id: 'north-west-cave',  label: 'NW Cave',  x: 62,   y: 148 + oy, branchPath: nwBranch, joinIndex: 0,           color: 0xbddfff },
      { id: 'north-east-trail', label: 'NE Trail', x: 1534, y: 148 + oy, branchPath: neBranch, joinIndex: neJoinIndex, color: 0xc6ffd8 },
      { id: 'south-west-mine',  label: 'SW Mine',  x: 62,   y: 772 + oy, branchPath: swBranch, joinIndex: 0,           color: 0xffd4ad },
      { id: 'south-east-pass',  label: 'SE Pass',  x: 1534, y: 772 + oy, branchPath: seBranch, joinIndex: seJoinIndex, color: 0xe1d2ff },
    ];

    state.entrances = entrances.map((entrance) => {
      const fullPath = entrance.branchPath.concat(state.pathMain.slice(entrance.joinIndex + 1));
      const fullSegments = buildSegments(fullPath);
      return { ...entrance, fullPath, fullSegments };
    });

    state.allPathSegments = state.pathMainSegments.slice();
    state.entrances.forEach((entrance) => {
      state.allPathSegments.push(...entrance.fullSegments);
    });

    scene.path = state.pathMain.map((p) => ({ x: p.x, y: p.y }));
    scene.pathSegments = state.pathMainSegments.map((s) => ({ ...s }));
    scene.activePathLayoutIndex = -1;
    scene.activePathLayoutId = 'wave1-hand-authored-four-entrances-v2';
    scene.activePathLayoutName = 'Wave 1 – Four Entrances, Organic Spline v2';
  };

  const createTowerPads = () => {
    const oy = cfg.mapOffsetY;
    const pads = [
      // ── Bridge choke overlooks ────────────────────────────────────────
      { x: 848,  y: 372 + oy, tag: 'bridge-north' },
      { x: 925,  y: 372 + oy, tag: 'bridge-north' },
      { x: 858,  y: 448 + oy, tag: 'bridge-south' },
      { x: 932,  y: 448 + oy, tag: 'bridge-south' },
      // ── Mountain pass flanks ──────────────────────────────────────────
      { x: 1068, y: 408 + oy, tag: 'pass-north' },
      { x: 1155, y: 406 + oy, tag: 'pass-north' },
      { x: 1085, y: 490 + oy, tag: 'pass-south' },
      { x: 1162, y: 486 + oy, tag: 'pass-south' },
      // ── Castle approach ridge ─────────────────────────────────────────
      { x: 1318, y: 262 + oy, tag: 'castle-ridge' },
      { x: 1372, y: 248 + oy, tag: 'castle-ridge' },
      { x: 1405, y: 278 + oy, tag: 'castle-gate-flank' },
      // ── Merge-zone overlooks (commands neJoin + seJoin) ───────────────
      { x: 488,  y: 342 + oy, tag: 'merge-west-north' },
      { x: 510,  y: 422 + oy, tag: 'merge-west-south' },
      { x: 622,  y: 312 + oy, tag: 'merge-ne-overlook' },
      { x: 688,  y: 400 + oy, tag: 'merge-central' },
      { x: 760,  y: 452 + oy, tag: 'merge-se-overlook' },
      // ── Left-branch overlooks (NW + SW independent travel) ────────────
      { x: 285,  y: 228 + oy, tag: 'nw-branch-ridge' },
      { x: 302,  y: 462 + oy, tag: 'sw-branch-ridge' },
      // ── NE northern-band overlooks ────────────────────────────────────
      { x: 898,  y: 258 + oy, tag: 'ne-band-mid' },
      { x: 1155, y: 218 + oy, tag: 'ne-band-east' },
      // ── SE southern-band overlooks ────────────────────────────────────
      { x: 902,  y: 542 + oy, tag: 'se-band-mid' },
      { x: 1155, y: 682 + oy, tag: 'se-band-east' },
      // ── Outer-map coverage pads ───────────────────────────────────────
      { x: 198,  y: 182 + oy, tag: 'outer-nw-a' },
      { x: 372,  y: 176 + oy, tag: 'outer-nw-b' },
      { x: 552,  y: 170 + oy, tag: 'outer-north-a' },
      { x: 1266, y: 184 + oy, tag: 'outer-ne-a' },
      { x: 1440, y: 238 + oy, tag: 'outer-ne-b' },
      { x: 1540, y: 332 + oy, tag: 'outer-east-a' },
      { x: 184,  y: 650 + oy, tag: 'outer-sw-a' },
      { x: 374,  y: 694 + oy, tag: 'outer-sw-b' },
      { x: 548,  y: 660 + oy, tag: 'outer-south-a' },
      { x: 1280, y: 636 + oy, tag: 'outer-se-a' },
      { x: 1456, y: 672 + oy, tag: 'outer-se-b' },
      { x: 808,  y: 300 + oy, tag: 'outer-center-north' },
      { x: 872,  y: 548 + oy, tag: 'outer-center-south' },
      { x: 1026, y: 318 + oy, tag: 'outer-center-east' },
      { x: 1008, y: 584 + oy, tag: 'outer-center-southeast' },
    ];

    state.towerPads = pads.map((p, i) => ({
      id: i + 1,
      x: p.x,
      y: p.y,
      tag: p.tag,
      occupied: false,
      ring: null,
      marker: null,
    }));
  };

  const renderMap = () => {
    destroyOldLayer();

    state.mapLayer  = scene.add.container(0, 0).setDepth(0.2);
    state.roadsLayer = scene.add.container(0, 0).setDepth(0.92);
    state.decoLayer  = scene.add.container(0, 0).setDepth(1.08);
    state.padsLayer  = scene.add.container(0, 0).setDepth(1.62);
    scene.mapLayer   = state.mapLayer;

    const oy = cfg.mapOffsetY;

    // ── Background gradient ───────────────────────────────────────────────────
    const bg = scene.add.graphics();
    bg.fillGradientStyle(0x3a7a45, 0x4c8f58, 0x2e5c38, 0x3d7248, 1);
    bg.fillRect(0, 0, cfg.boardWidth, cfg.boardHeight);
    state.mapLayer.add(bg);

    // ── Ground texture (subtle noise patches) ─────────────────────────────────
    const gnd = scene.add.graphics().setDepth(0.21);
    for (let i = 0; i < 68; i += 1) {
      const px = Phaser.Math.Between(0, 1600);
      const py = Phaser.Math.Between(0, 900);
      gnd.fillStyle(Phaser.Math.Between(0x2e5835, 0x477a50), 0.18);
      gnd.fillEllipse(px, py, Phaser.Math.Between(40, 110), Phaser.Math.Between(22, 55));
    }
    state.mapLayer.add(gnd);

    // ── River ─────────────────────────────────────────────────────────────────
    // Flows from upper-centre southeastward, crossing the road AT the stone bridge.
    const riverPoints = splinePoints([
      { x: 622,  y: 118 + oy },
      { x: 684,  y: 175 + oy },
      { x: 750,  y: 245 + oy },
      { x: 815,  y: 320 + oy },
      { x: 868,  y: 370 + oy },
      { x: 900,  y: 412 + oy },   // ← bridge crossing
      { x: 938,  y: 450 + oy },
      { x: 995,  y: 502 + oy },
      { x: 1062, y: 552 + oy },
      { x: 1135, y: 598 + oy },
      { x: 1205, y: 645 + oy },
      { x: 1272, y: 688 + oy },
      { x: 1332, y: 728 + oy },
      { x: 1390, y: 764 + oy },
      { x: 1432, y: 792 + oy },
    ], 220);

    const river = scene.add.graphics();
    drawPolyline(river, riverPoints, 72, 0x1f4d62, 0.98);
    drawPolyline(river, riverPoints, 52, 0x2e6e8a, 0.88);
    drawPolyline(river, riverPoints, 28, 0x3d8aaa, 0.62);
    drawPolyline(river, riverPoints,  8, 0x80cce0, 0.35);
    state.mapLayer.add(river);

    // River shimmer highlights
    const rShimmer = scene.add.graphics().setDepth(0.31);
    for (let i = 8; i < riverPoints.length - 3; i += 14) {
      const p = riverPoints[i];
      rShimmer.fillStyle(0x9ddff2, 0.22);
      rShimmer.fillEllipse(p.x + Phaser.Math.Between(-6, 6), p.y + Phaser.Math.Between(-4, 4), 28, 8);
    }
    state.mapLayer.add(rShimmer);

    // ── Dense forest clusters ─────────────────────────────────────────────────
    // North-west forest (behind NW branch)
    addForestCluster(250, 220 + oy, 20, 145, 100);
    addForestCluster(145, 315 + oy, 10, 70, 55);
    // South-west forest (behind SW branch)
    addForestCluster(238, 655 + oy, 18, 140, 95);
    addForestCluster(140, 560 + oy, 9, 65, 52);
    // North-east forest (above NE band)
    addForestCluster(1295, 118 + oy, 22, 165, 50);
    addForestCluster(1060, 118 + oy, 16, 130, 45);
    addForestCluster(820,  118 + oy, 12, 110, 40);
    // South-east forest (below SE band)
    addForestCluster(1308, 785 + oy, 20, 155, 50);
    addForestCluster(1070, 785 + oy, 14, 125, 42);
    addForestCluster(855,  785 + oy, 10, 105, 38);
    // Central clearings + scattered patches
    addForestCluster(498, 505 + oy, 12, 95, 70);
    addForestCluster(330, 360 + oy,  8, 72, 50);
    addForestCluster(1020, 320 + oy, 7, 68, 40);
    addForestCluster(1015, 508 + oy, 7, 68, 42);

    // ── Cliff arcs – mountain pass and castle ridge ───────────────────────────
    // Pass cliffs (both sides)
    addCliffArc(1118, 510 + oy, 265, 128, 188, 338, 36);
    addCliffArc(1118, 392 + oy, 250, 118, 202, 346, 30);
    // Castle ridge cliffs
    addCliffArc(1245, 338 + oy, 208, 105, 195, 320, 28);
    addCliffArc(1368, 172 + oy, 178,  82, 210, 355, 22);

    // ── Road tile sprite stamping ──────────────────────────────────────────────
    // Walk along each path and stamp modular dirt road PNG tiles, rotated to
    // follow the spline tangent. A shadow graphics layer sits underneath for
    // road-edge depth. Special landmark tiles are placed at merge, bridge, and
    // entrance points.

    /**
     * Compute cumulative arc-length array for a polyline.
     */
    const buildCumLen = (pts) => {
      const cl = [0];
      for (let i = 1; i < pts.length; i += 1) {
        cl.push(cl[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
      }
      return cl;
    };

    /**
     * Interpolate position + tangent angle at arc-distance `d` along `pts`.
     * `cumLen` must be the output of buildCumLen(pts).
     */
    const samplePath = (pts, cumLen, d) => {
      const total = cumLen[cumLen.length - 1];
      d = Math.min(Math.max(d, 0), total);
      let lo = 0, hi = cumLen.length - 2;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (cumLen[mid + 1] < d) lo = mid + 1; else hi = mid;
      }
      const seg = lo;
      const segLen = cumLen[seg + 1] - cumLen[seg];
      const t = segLen > 0 ? (d - cumLen[seg]) / segLen : 0;
      const p0 = pts[seg], p1 = pts[seg + 1];
      return {
        x: p0.x + (p1.x - p0.x) * t,
        y: p0.y + (p1.y - p0.y) * t,
        angle: Math.atan2(p1.y - p0.y, p1.x - p0.x),
      };
    };

    /**
     * Stamp road tiles along a path.
     * @param {object[]} pts        - spline points [{x,y}]
     * @param {object}   opts
     *   step    px between stamps (overlap creates continuous texture)
     *   dispW   display width  of each stamp
     *   dispH   display height of each stamp
     *   depth   Phaser depth value
     *   shadowW width of shadow underlay polyline (0 = no shadow)
     */
    const stampRoadTiles = (pts, opts = {}) => {
      const {
        step    = 20,
        dispW   = 88,
        dispH   = 76,
        depth   = 0.88,
        shadowW = 54,
        alpha   = 0.97,
      } = opts;

      if (pts.length < 2) return;

      // Shadow underlay – thin dark poly beneath tiles
      if (shadowW > 0) {
        const sh = scene.add.graphics();
        sh.lineStyle(shadowW + 14, 0x18100a, 0.32);
        sh.beginPath();
        sh.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i += 1) sh.lineTo(pts[i].x, pts[i].y);
        sh.strokePath();
        state.roadsLayer.add(sh);
      }

      const cumLen = buildCumLen(pts);
      const totalLen = cumLen[cumLen.length - 1];

      // Tile keys used in rotation for variety
      const TILE_CYCLE = [
        'rt_straight_01',
        'rt_straight_02',
        'rt_straight_01',
        'rt_straight_long',
        'rt_straight_02',
        'rt_road_rocky',
      ];

      let tileIdx = 0;
      let nextTileSwitch = 0;

      for (let d = 0; d <= totalLen; d += step) {
        const { x, y, angle } = samplePath(pts, cumLen, d);

        // Advance tile variety index every ~45 px
        if (d >= nextTileSwitch) {
          tileIdx = (tileIdx + 1) % TILE_CYCLE.length;
          nextTileSwitch = d + 38 + Phaser.Math.Between(0, 24);
        }

        scene.add.image(x, y, TILE_CYCLE[tileIdx])
          .setRotation(angle)
          .setDisplaySize(dispW, dispH)
          .setAlpha(alpha)
          .setDepth(depth);
        // (sprites go directly into scene depth order; container just holds ref)
        // Note: we add to roadsLayer container for cleanup tracking
        state.roadsLayer.add(
          scene.add.existing(
            scene.children.getChildren().at(-1) // last-added image
          )
        );
      }
    };

    // Branch roads (4 entrance branches)
    state.entrances.forEach((entrance) => {
      stampRoadTiles(entrance.branchPath, {
        step: 18, dispW: 72, dispH: 62, depth: 0.87, shadowW: 42,
      });
    });

    // Main road (thicker, more prominent)
    stampRoadTiles(state.pathMain, {
      step: 22, dispW: 96, dispH: 82, depth: 0.90, shadowW: 58,
    });

    // ── Special landmark tiles ─────────────────────────────────────────────────
    const oy2 = cfg.mapOffsetY;

    // Y-split / merge at leftMerge
    const mergeX = 452, mergeY = 382 + oy2;
    const mergeTile = scene.add.image(mergeX, mergeY, 'rt_y_split_merge')
      .setDisplaySize(195, 126)
      .setDepth(0.93)
      .setAlpha(0.94);
    state.roadsLayer.add(mergeTile);

    // T-junction at neJoin
    const neJoinTile = scene.add.image(634, 350 + oy2, 'rt_t_junction')
      .setDisplaySize(155, 100)
      .setDepth(0.93)
      .setAlpha(0.90)
      .setRotation(Math.PI * 0.5);
    state.roadsLayer.add(neJoinTile);

    // T-junction at seJoin
    const seJoinTile = scene.add.image(752, 422 + oy2, 'rt_t_junction')
      .setDisplaySize(155, 100)
      .setDepth(0.93)
      .setAlpha(0.90)
      .setRotation(-Math.PI * 0.5);
    state.roadsLayer.add(seJoinTile);

    // Road bridge at choke 1
    const bridgeTile = scene.add.image(898, 408 + oy2, 'rt_road_bridge')
      .setDisplaySize(235, 82)
      .setDepth(0.94)
      .setAlpha(0.96)
      .setRotation(0.24);           // match road angle at bridge
    state.roadsLayer.add(bridgeTile);

    // Path entrance tiles at each spawn
    const entranceDisplays = [
      { x: 62,   y: 148 + oy2, rot: 0.42  },   // NW cave
      { x: 1534, y: 148 + oy2, rot: Math.PI + 0.42 }, // NE trail
      { x: 62,   y: 772 + oy2, rot: -0.42 },   // SW mine
      { x: 1534, y: 772 + oy2, rot: Math.PI - 0.42 }, // SE pass
    ];
    entranceDisplays.forEach(({ x, y, rot }) => {
      const et = scene.add.image(x, y, 'rt_path_entrance')
        .setDisplaySize(110, 76)
        .setDepth(0.92)
        .setAlpha(0.93)
        .setRotation(rot);
      state.roadsLayer.add(et);
    });

    // ── Stone bridge (choke 1) ─────────────────────────────────────────────────
    const bridgePlatform = scene.add.rectangle(900, 408 + oy, 168, 52, 0x7d6e58, 0.96).setAngle(14).setDepth(1.20);
    const bridgeShadow   = scene.add.rectangle(905, 415 + oy, 168, 52, 0x2e2820, 0.28).setAngle(14).setDepth(1.19);
    const bridgeRailN    = scene.add.rectangle(900, 390 + oy, 168,  7, 0x524230, 0.90).setAngle(14).setDepth(1.22);
    const bridgeRailS    = scene.add.rectangle(900, 426 + oy, 168,  7, 0x524230, 0.90).setAngle(14).setDepth(1.22);
    const bridgePillarA  = scene.add.rectangle(880, 408 + oy,  14, 34, 0x5e5144, 0.92).setDepth(1.21);
    const bridgePillarB  = scene.add.rectangle(920, 408 + oy,  14, 34, 0x5e5144, 0.92).setDepth(1.21);
    state.decoLayer.add([bridgeShadow, bridgePlatform, bridgeRailN, bridgeRailS, bridgePillarA, bridgePillarB]);

    // ── Mountain pass rocks (choke 2) ─────────────────────────────────────────
    const passRockA = scene.add.ellipse(1095, 492 + oy, 165, 92, 0x4e4638, 0.96).setDepth(1.24);
    const passRockB = scene.add.ellipse(1162, 412 + oy, 138, 78, 0x48413a, 0.96).setDepth(1.24);
    const passRockC = scene.add.ellipse(1065, 418 + oy,  95, 54, 0x56504a, 0.88).setDepth(1.23);
    const passRockD = scene.add.ellipse(1185, 468 + oy, 115, 62, 0x443e38, 0.90).setDepth(1.23);
    state.decoLayer.add([passRockA, passRockB, passRockC, passRockD]);

    // ── Castle (choke 3 / goal) ────────────────────────────────────────────────
    // Dominant landmark in upper-right corner; extends toward the edge to feel massive.
    const cg = state.castleGate;

    // Elevated rocky plateau
    const castlePlateau = scene.add.ellipse(cg.x + 40, cg.y + 32, 405, 195, 0x4e5a4a, 0.95).setDepth(1.26);
    const plateauHighlight = scene.add.ellipse(cg.x + 20, cg.y + 18, 340, 155, 0x596655, 0.62).setDepth(1.265);

    // Outer walls
    const wallBase = scene.add.rectangle(cg.x + 36, cg.y + 2, 265, 62, 0x686462, 0.98).setDepth(1.28);
    const wallTop  = scene.add.rectangle(cg.x + 36, cg.y - 18, 265, 14, 0x7a7572, 0.96).setDepth(1.285);

    // Battlements (small merlons along top of wall)
    for (let bx = cg.x - 90; bx <= cg.x + 155; bx += 18) {
      const merlon = scene.add.rectangle(bx, cg.y - 28, 10, 16, 0x696664, 0.97).setDepth(1.29);
      state.decoLayer.add(merlon);
    }

    // Left flanking tower
    const towerL    = scene.add.rectangle(cg.x - 90, cg.y - 18, 48, 88, 0x5c5a58, 0.98).setDepth(1.30);
    const towerLTop = scene.add.rectangle(cg.x - 90, cg.y - 60, 52, 16, 0x6e6b68, 0.96).setDepth(1.305);
    const towerLMerlon1 = scene.add.rectangle(cg.x - 100, cg.y - 70, 10, 14, 0x666360, 0.97).setDepth(1.31);
    const towerLMerlon2 = scene.add.rectangle(cg.x -  82, cg.y - 70, 10, 14, 0x666360, 0.97).setDepth(1.31);

    // Right tower (partially off-screen for depth – castle extends beyond frame)
    const towerR    = scene.add.rectangle(cg.x + 162, cg.y - 18, 48, 88, 0x5a5856, 0.98).setDepth(1.30);
    const towerRTop = scene.add.rectangle(cg.x + 162, cg.y - 60, 52, 16, 0x6c6965, 0.96).setDepth(1.305);

    // Central keep (tallest element)
    const keep      = scene.add.rectangle(cg.x + 36, cg.y - 38, 56, 82, 0x504e4c, 0.98).setDepth(1.32);
    const keepTop   = scene.add.rectangle(cg.x + 36, cg.y - 78, 62, 16, 0x626060, 0.96).setDepth(1.325);
    const keepFlag  = scene.add.rectangle(cg.x + 52, cg.y - 94,  4, 22, 0x8c7240, 0.98).setDepth(1.33);
    const keepBanner = scene.add.rectangle(cg.x + 58, cg.y - 90, 16, 14, 0xb53228, 0.96).setDepth(1.33);

    // Gate arch (entrance / endpoint)
    const gateArch  = scene.add.rectangle(cg.x + 36, cg.y + 8, 38, 46, 0x1e1a18, 0.98).setDepth(1.34);
    const gateGlow  = scene.add.circle(cg.x + 36, cg.y + 12, 12, 0xffc85e, 0.38).setDepth(1.345);
    const gateGlow2 = scene.add.circle(cg.x + 36, cg.y + 12, 22, 0xffd88a, 0.14).setDepth(1.344);

    // Torches flanking gate
    const torchL = scene.add.rectangle(cg.x + 14, cg.y - 5, 5, 14, 0x6e5430, 0.92).setDepth(1.35);
    const torchR = scene.add.rectangle(cg.x + 58, cg.y - 5, 5, 14, 0x6e5430, 0.92).setDepth(1.35);
    const flameL = scene.add.circle(cg.x + 14, cg.y - 12, 6, 0xff9a28, 0.92).setDepth(1.36);
    const flameR = scene.add.circle(cg.x + 58, cg.y - 12, 6, 0xff9a28, 0.92).setDepth(1.36);
    const glowL  = scene.add.circle(cg.x + 14, cg.y - 12, 14, 0xffcc6e, 0.22).setDepth(1.355);
    const glowR  = scene.add.circle(cg.x + 58, cg.y - 12, 14, 0xffcc6e, 0.22).setDepth(1.355);

    state.decoLayer.add([
      castlePlateau, plateauHighlight,
      wallBase, wallTop,
      towerL, towerLTop, towerLMerlon1, towerLMerlon2,
      towerR, towerRTop,
      keep, keepTop, keepFlag, keepBanner,
      gateArch, gateGlow, gateGlow2,
      torchL, torchR, flameL, flameR, glowL, glowR,
    ]);

    // ── Entrance landmarks ─────────────────────────────────────────────────────
    const addEntranceLandmark = (entrance, shape) => {
      const lx = entrance.x;
      const ly = entrance.y;
      const labelText = scene.add.text(lx, ly - 44, entrance.label, {
        fontFamily: 'Trebuchet MS',
        fontSize: '13px',
        color: '#eaf7ff',
        fontStyle: 'bold',
        stroke: '#141a1e',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(1.38);

      if (shape === 'cave') {
        // Rocky cave opening with dark mouth
        const outer = scene.add.ellipse(lx, ly, 90, 64, 0x3b3028, 0.97).setDepth(1.31);
        const rock1 = scene.add.ellipse(lx - 28, ly - 8, 30, 44, 0x4a3e32, 0.94).setDepth(1.32);
        const rock2 = scene.add.ellipse(lx + 28, ly - 8, 28, 40, 0x453930, 0.94).setDepth(1.32);
        const mouth = scene.add.ellipse(lx, ly + 4, 38, 28, 0x100d0a, 0.98).setDepth(1.33);
        const caveGlow = scene.add.circle(lx, ly + 4, 8, 0x3a2800, 0.45).setDepth(1.34);
        state.decoLayer.add([outer, rock1, rock2, mouth, caveGlow, labelText]);
      } else if (shape === 'trail') {
        // Ruined wooden gate posts with arch
        const postL = scene.add.rectangle(lx - 22, ly + 5, 10, 42, 0x5c4425, 0.96).setDepth(1.31);
        const postR = scene.add.rectangle(lx + 22, ly + 5, 10, 42, 0x5c4425, 0.96).setDepth(1.31);
        const crossbar = scene.add.rectangle(lx, ly - 14, 48, 8, 0x5a4224, 0.94).setDepth(1.32);
        const arch  = scene.add.ellipse(lx, ly - 9, 62, 22, 0x3d5435, 0.90).setDepth(1.31);
        const sign  = scene.add.rectangle(lx + 28, ly - 22, 8, 18, 0x5a4322, 0.92).setDepth(1.32);
        state.decoLayer.add([arch, postL, postR, crossbar, sign, labelText]);
      } else if (shape === 'mine') {
        // Wooden mine frame with dark tunnel
        const frameV1 = scene.add.rectangle(lx - 26, ly + 4, 10, 48, 0x6a5232, 0.96).setDepth(1.31);
        const frameV2 = scene.add.rectangle(lx + 26, ly + 4, 10, 48, 0x6a5232, 0.96).setDepth(1.31);
        const frameH  = scene.add.rectangle(lx, ly - 20, 56, 9, 0x624e30, 0.96).setDepth(1.32);
        const pit     = scene.add.rectangle(lx, ly + 6, 38, 28, 0x12100e, 0.98).setDepth(1.33);
        const cart    = scene.add.rectangle(lx + 42, ly + 8, 18, 10, 0x4a3a2a, 0.90).setDepth(1.34);
        state.decoLayer.add([frameV1, frameV2, frameH, pit, cart, labelText]);
      } else {
        // Mountain pass gap between two rock formations
        const rockL = scene.add.ellipse(lx - 30, ly + 2, 52, 64, 0x4e4840, 0.97).setDepth(1.31);
        const rockR = scene.add.ellipse(lx + 30, ly + 2, 48, 60, 0x4a443c, 0.97).setDepth(1.31);
        const gap   = scene.add.rectangle(lx, ly + 5, 32, 28, 0x100f0d, 0.98).setDepth(1.33);
        state.decoLayer.add([rockL, rockR, gap, labelText]);
      }
    };

    addEntranceLandmark(state.entrances[0], 'cave');   // NW
    addEntranceLandmark(state.entrances[1], 'trail');  // NE
    addEntranceLandmark(state.entrances[2], 'mine');   // SW
    addEntranceLandmark(state.entrances[3], 'pass');   // SE

    // ── Choke-point markers (subtle, informative) ──────────────────────────────
    state.chokePoints.forEach((cp) => {
      const ring = scene.add.circle(cp.x, cp.y, 16, 0x000000, 0).setStrokeStyle(2, 0xffe2ab, 0.55).setDepth(1.38);
      const label = scene.add.text(cp.x, cp.y - 28, cp.name, {
        fontFamily: 'Trebuchet MS',
        fontSize: '12px',
        color: '#ffe5bf',
        fontStyle: 'bold',
        stroke: '#1a1208',
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(1.39);
      state.decoLayer.add([ring, label]);
    });

    // ── Environmental storytelling deco ────────────────────────────────────────
    const addRock = (x, y, w, h, d = 1.12) => {
      const r = scene.add.ellipse(x, y, w, h, Phaser.Math.Between(0x3a352d, 0x504a42), 0.90).setDepth(d);
      state.decoLayer.add(r);
    };
    const addTorch = (x, y) => {
      const post  = scene.add.rectangle(x, y, 4, 14, 0x5a4622, 0.92).setDepth(1.16);
      const flame = scene.add.circle(x, y - 8, 5, 0xff9030, 0.90).setDepth(1.17);
      const glow  = scene.add.circle(x, y - 8, 11, 0xffcc60, 0.18).setDepth(1.165);
      state.decoLayer.add([post, flame, glow]);
    };
    const addRuinedCart = (x, y, angle = 8) => {
      const body  = scene.add.rectangle(x, y, 26, 14, 0x5a4428, 0.88).setAngle(angle).setDepth(1.14);
      const wheelA = scene.add.circle(x - 11, y + 6, 6, 0x3e2e1e, 0.86).setDepth(1.15);
      const wheelB = scene.add.circle(x + 11, y + 6, 6, 0x3e2e1e, 0.86).setDepth(1.15);
      state.decoLayer.add([body, wheelA, wheelB]);
    };
    const addStoneWall = (x, y, w, angle = 0) => {
      const wall = scene.add.rectangle(x, y, w, 12, 0x5a5450, 0.88).setAngle(angle).setDepth(1.13);
      state.decoLayer.add(wall);
    };
    const addFlowerPatch = (x, y, count = 5) => {
      for (let i = 0; i < count; i += 1) {
        const fx = x + Phaser.Math.Between(-22, 22);
        const fy = y + Phaser.Math.Between(-14, 14);
        const petal = scene.add.circle(fx, fy, Phaser.Math.Between(3, 6),
          Phaser.Math.RND.pick([0xf4d03f, 0xe88080, 0xb5e8b0, 0xf0c080]), 0.82).setDepth(1.11);
        state.decoLayer.add(petal);
      }
    };

    // Scattered rocks throughout the map
    addRock(192, 148 + oy, 38, 22); addRock(355, 148 + oy, 28, 16);
    addRock(148, 608 + oy, 36, 20); addRock(348, 508 + oy, 30, 18);
    addRock(658, 298 + oy, 24, 14); addRock(708, 462 + oy, 22, 13);
    addRock(985, 232 + oy, 32, 18); addRock(1032, 620 + oy, 28, 16);
    addRock(1218, 312 + oy, 34, 20); addRock(1198, 498 + oy, 30, 17);
    addRock(1322, 220 + oy, 30, 17); addRock(1338, 718 + oy, 26, 15);
    addRock(445, 308 + oy, 20, 12); addRock(558, 432 + oy, 18, 11);

    // Torches along key road sections
    addTorch(552, 332 + oy); addTorch(712, 318 + oy); addTorch(782, 450 + oy);
    addTorch(852, 358 + oy); addTorch(945, 368 + oy); addTorch(1042, 400 + oy);
    addTorch(1195, 412 + oy); addTorch(1295, 330 + oy); addTorch(1362, 270 + oy);

    // Ruined carts and wagons
    addRuinedCart(332, 265 + oy, -5);
    addRuinedCart(328, 618 + oy, 10);
    addRuinedCart(645, 288 + oy, -12);
    addRuinedCart(658, 468 + oy, 8);
    addRuinedCart(1198, 252 + oy, 6);

    // Stone wall segments (watchtower approach)
    addStoneWall(398, 182 + oy, 68, -8); addStoneWall(418, 722 + oy, 62, 6);
    addStoneWall(1122, 228 + oy, 80, 4); addStoneWall(1085, 625 + oy, 72, -5);
    addStoneWall(1278, 290 + oy, 90, -12);

    // Flower patches in clearings
    addFlowerPatch(312, 298 + oy, 7); addFlowerPatch(288, 552 + oy, 6);
    addFlowerPatch(598, 318 + oy, 5); addFlowerPatch(620, 458 + oy, 5);
    addFlowerPatch(982, 256 + oy, 6); addFlowerPatch(970, 568 + oy, 5);
    addFlowerPatch(1240, 228 + oy, 4); addFlowerPatch(1228, 625 + oy, 4);
    addFlowerPatch(1435, 192 + oy, 3);

    // Scattered fallen logs
    for (let li = 0; li < 8; li += 1) {
      const lx = Phaser.Math.RND.pick([185, 268, 388, 618, 985, 1045, 1212, 1285]);
      const ly = [302, 492, 658, 322, 272, 592, 345, 698][li];
      const log = scene.add.rectangle(lx + oy * 0, ly + oy, Phaser.Math.Between(28, 48), 7,
        Phaser.Math.Between(0x4a3820, 0x5c4a2e), 0.82).setAngle(Phaser.Math.Between(-25, 25)).setDepth(1.10);
      state.decoLayer.add(log);
    }

    // ── Mushroom/shrub accents ────────────────────────────────────────────────
    const mushrooms = [
      [405, 198 + oy], [155, 412 + oy], [355, 462 + oy],
      [688, 282 + oy], [728, 452 + oy], [1028, 238 + oy],
      [1045, 578 + oy], [1262, 328 + oy], [1252, 632 + oy],
    ];
    mushrooms.forEach(([mx, my]) => {
      const stem = scene.add.rectangle(mx, my + 4, 5, 8, 0xd5c9b5, 0.75).setDepth(1.11);
      const cap  = scene.add.ellipse(mx, my, Phaser.Math.Between(8, 13), Phaser.Math.Between(5, 8),
        Phaser.Math.RND.pick([0xb03820, 0xc87828, 0x8a6428]), 0.82).setDepth(1.12);
      state.decoLayer.add([stem, cap]);
    });

    state.mapLayer.add([state.roadsLayer, state.decoLayer, state.padsLayer]);

    // ── Tower pads ────────────────────────────────────────────────────────────
    state.towerPads.forEach((pad) => {
      const ring   = scene.add.circle(pad.x, pad.y, 18, 0x89c0df, 0.08).setStrokeStyle(2, 0xbbe9ff, 0.36).setDepth(1.65);
      const marker = scene.add.circle(pad.x, pad.y,  3, 0xdff3ff, 0.86).setDepth(1.66);
      pad.ring   = ring;
      pad.marker = marker;
      state.padsLayer.add([ring, marker]);
    });
  };

  const clearActiveCombatObjects = () => {
    state.enemyList.forEach((enemy) => enemy.sprite?.destroy());
    state.projectileList.forEach((p) => p.sprite?.destroy());
    state.enemyList = [];
    state.projectileList = [];
  };

  const updatePadVisuals = () => {
    state.towerPads.forEach((pad) => {
      if (!pad.ring) return;
      if (pad.occupied) {
        pad.ring.setFillStyle(0xffad95, 0.12);
        pad.ring.setStrokeStyle(2, 0xffc6b4, 0.34);
      } else {
        pad.ring.setFillStyle(0x89c0df, 0.08);
        pad.ring.setStrokeStyle(2, 0xbbe9ff, 0.36);
      }
    });
  };

  const resetForPrep = (message) => {
    state.waveActive = false;
    clearActiveCombatObjects();
    scene.gameState.prepPhase = true;
    if (scene.startWaveButton?.active) {
      scene.startWaveButton.setInteractive({ useHandCursor: true });
      scene.startWaveButton.setFillStyle(0x164469, 0.98);
    }
    if (scene.startWaveButtonLabel?.active) {
      scene.startWaveButtonLabel.setText('START WAVE');
      scene.startWaveButtonLabel.setColor('#f3fcff');
    }
    if (message) scene.setStatus(message, '#89ffd0');
    scene.updateHud();
  };

  const createTowerVisual = (pad, towerDef) => {
    const sprite = scene.towers.create(pad.x, pad.y, towerDef.key || 'gsTurret1');
    sprite.setDepth(2.05);
    sprite.setScale(0.72 * TOWER_GLOBAL_SCALE_MULT);
    sprite.setInteractive({ useHandCursor: true });

    const hpBg = scene.add.rectangle(pad.x, pad.y - 28, 42, 6, 0x12070c, 0.9).setDepth(2.22);
    const hpFill = scene.add.rectangle(pad.x - 21, pad.y - 28, 42, 6, 0x7dffc2, 1).setOrigin(0, 0.5).setDepth(2.23);
    const idLabel = scene.add.text(pad.x, pad.y - 3, String(towerDef.id), {
      fontFamily: 'Trebuchet MS',
      fontSize: '16px',
      color: '#eefbff',
      stroke: '#13202a',
      strokeThickness: 3,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(2.24);

    sprite.setData('health', 28);
    sprite.setData('maxHealth', 28);
    sprite.setData('hpBg', hpBg);
    sprite.setData('hpFill', hpFill);
    sprite.setData('idLabel', idLabel);
    sprite.setData('towerId', towerDef.id);
    sprite.setData('sourceTowerDef', towerDef);
    sprite.setData('upgradeLevel', 1);
    sprite.setData('range', towerDef.range || 180);
    sprite.setData('damage', towerDef.damage || 1.2);
    sprite.setData('fireRate', towerDef.fireRate || 420);
    sprite.setData('lastFire', 0);
    sprite.setData('projectileSpeed', towerDef.projectileSpeed || 420);
    sprite.setData('padId', pad.id);

    sprite.on('pointerdown', () => {
      if (scene.draggingFromTray) return;
      scene.focusPlacedTower(sprite);
    });

    return sprite;
  };

  const placeTower = (x, y, towerDef) => {
    const selected = towerDef || scene.selectedTowerDef || scene.towerCatalog?.[0];
    if (!selected) return false;
    if (!scene.isWeaponUnlockedForPlayer(selected)) {
      scene.setStatus(selected.name + ' is locked.', '#ffb18b');
      return false;
    }
    if (scene.gameState.gold < selected.cost) {
      scene.setStatus('Insufficient gold to deploy this tower.', '#ff8fa7');
      return false;
    }

    if (y <= cfg.topHudGuardY || y >= cfg.bottomTrayGuardY || x <= 36 || x >= cfg.boardWidth - 36) {
      scene.setStatus('Invalid position: place in the battlefield area.', '#ffb18b');
      return false;
    }

    if (minDistanceToAnyPath(x, y) < (cfg.pathHalfWidth + 26)) {
      scene.setStatus('Invalid position: keep towers off the road.', '#ffb18b');
      return false;
    }

    const pad = getNearestFreePad(x, y, 52);
    if (!pad) {
      scene.setStatus('Deploy only on prepared defensive pads.', '#ffb18b');
      return false;
    }

    const sprite = createTowerVisual(pad, selected);
    pad.occupied = true;
    updatePadVisuals();

    state.towerList.push({ id: ++state.towerSerial, sprite, def: selected, padId: pad.id });
    scene.gameState.gold -= selected.cost;
    scene.updateHud();
    return true;
  };

  const startWave = () => {
    if (state.waveActive || scene.gameState.gameOver || !scene.gameState.prepPhase) return;
    if (!state.towerList.some((t) => t.sprite?.active)) {
      scene.setStatus('Place at least one turret before starting the wave.', '#ffb18b');
      return;
    }

    clearActiveCombatObjects();
    scene.gameState.prepPhase = false;
    state.waveActive = true;
    state.spawnIndex = 0;
    state.nextSpawnAt = scene.time.now + 900;

    const waveNo = Math.max(1, scene.gameState.wave || 1);
    const unitCount = 24 + ((waveNo - 1) * 4);
    const baseHp = 14 + (waveNo * 2);
    const baseSpeed = 64 + (waveNo * 4);

    state.wavePlan = Array.from({ length: unitCount }, (_, i) => ({
      hp: baseHp + ((i % 4) * 2),
      speed: baseSpeed + ((i % 3) * 7),
      reward: 4 + Math.floor(waveNo / 2),
      color: i % 5 === 0 ? 0xffd18c : 0xbfe4ff,
      entranceIndex: i % state.entrances.length,
    }));

    if (scene.startWaveButton?.active) {
      scene.startWaveButton.disableInteractive();
      scene.startWaveButton.setFillStyle(0x3b4f5b, 0.75);
    }
    if (scene.startWaveButtonLabel?.active) {
      scene.startWaveButtonLabel.setText('WAVE ACTIVE');
      scene.startWaveButtonLabel.setColor('#c7d7e0');
    }

    scene.setStatus('Wave ' + waveNo + ' launched from four entrances.', '#8cf3ff');
    scene.updateHud();
  };

  const spawnEnemy = (spec) => {
    const entrance = state.entrances[spec.entranceIndex % state.entrances.length];
    const start = entrance.fullPath[0];
    const sprite = scene.enemies.create(start.x, start.y, 'soldierRunCp1Sheet', 0);
    sprite.setDepth(3.06);
    sprite.setScale(1.08);

    const hp = Math.max(6, spec.hp || 14);
    const enemy = {
      id: ++state.enemySerial,
      sprite,
      hp,
      maxHp: hp,
      speed: spec.speed || 72,
      reward: spec.reward || 4,
      color: spec.color || 0xcfe9ff,
      pathSegments: entrance.fullSegments,
      pathIndex: 0,
      segmentDistance: 0,
      alive: true,
    };

    sprite.setTint(enemy.color);
    sprite.setData('enemyRef', enemy);
    state.enemyList.push(enemy);
  };

  const handleEnemyLeak = (enemy) => {
    enemy.alive = false;
    enemy.sprite?.destroy();
    scene.gameState.lives -= 1;
    scene.updateHud();
    if (scene.gameState.lives <= 0) {
      scene.endGame();
    }
  };

  const moveEnemyAlongPath = (enemy, dt) => {
    let travel = enemy.speed * dt;
    while (travel > 0) {
      const seg = enemy.pathSegments[enemy.pathIndex];
      if (!seg) {
        handleEnemyLeak(enemy);
        return;
      }

      const remaining = seg.length - enemy.segmentDistance;
      if (travel < remaining) {
        enemy.segmentDistance += travel;
        travel = 0;
      } else {
        travel -= remaining;
        enemy.pathIndex += 1;
        enemy.segmentDistance = 0;
        if (enemy.pathIndex >= enemy.pathSegments.length) {
          handleEnemyLeak(enemy);
          return;
        }
      }
    }

    const seg = enemy.pathSegments[enemy.pathIndex];
    enemy.sprite.x = seg.start.x + (seg.ux * enemy.segmentDistance);
    enemy.sprite.y = seg.start.y + (seg.uy * enemy.segmentDistance);
    enemy.sprite.setRotation(Math.atan2(seg.uy, seg.ux) + (Math.PI / 2));
  };

  const spawnProjectile = (towerSprite, enemy, towerDef) => {
    const angle = Phaser.Math.Angle.Between(towerSprite.x, towerSprite.y, enemy.sprite.x, enemy.sprite.y);
    const speed = towerDef.projectileSpeed || 420;
    const sprite = scene.projectiles.create(towerSprite.x, towerSprite.y, 'projectile');
    sprite.setDepth(3.25);
    sprite.setScale(0.9);
    sprite.setTint(0xffcc84);

    const projectile = {
      sprite,
      damage: towerDef.damage || 1.2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      lifeMs: 1700,
      alive: true,
    };

    state.projectileList.push(projectile);
    towerSprite.setRotation(angle + (Math.PI / 2));
  };

  const updateTowers = (now) => {
    state.towerList.forEach((towerInfo) => {
      const tower = towerInfo.sprite;
      if (!tower?.active) return;

      const range = tower.getData('range') || 180;
      const fireRate = tower.getData('fireRate') || 420;
      const lastFire = tower.getData('lastFire') || 0;
      if (now - lastFire < fireRate) return;

      let bestEnemy = null;
      let bestDist = Number.POSITIVE_INFINITY;
      state.enemyList.forEach((enemy) => {
        if (!enemy.alive || !enemy.sprite?.active) return;
        const d = Phaser.Math.Distance.Between(tower.x, tower.y, enemy.sprite.x, enemy.sprite.y);
        if (d <= range && d < bestDist) {
          bestDist = d;
          bestEnemy = enemy;
        }
      });

      if (!bestEnemy) return;
      tower.setData('lastFire', now);
      spawnProjectile(tower, bestEnemy, towerInfo.def);

      const muzzle = scene.add.circle(tower.x, tower.y, 4, 0xfff0d2, 0.9).setDepth(3.3);
      scene.tweens.add({
        targets: muzzle,
        alpha: 0,
        scale: 2.1,
        duration: 95,
        onComplete: () => muzzle.destroy(),
      });
    });
  };

  const updateProjectiles = (dt) => {
    state.projectileList.forEach((p) => {
      if (!p.alive || !p.sprite?.active) return;

      p.lifeMs -= dt * 1000;
      p.sprite.x += p.vx * dt;
      p.sprite.y += p.vy * dt;

      if (p.lifeMs <= 0 || p.sprite.x < -20 || p.sprite.x > cfg.boardWidth + 20 || p.sprite.y < -20 || p.sprite.y > cfg.boardHeight + 20) {
        p.alive = false;
        p.sprite.destroy();
        return;
      }

      for (let i = 0; i < state.enemyList.length; i += 1) {
        const enemy = state.enemyList[i];
        if (!enemy.alive || !enemy.sprite?.active) continue;
        if (Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, enemy.sprite.x, enemy.sprite.y) <= 18) {
          enemy.hp -= p.damage;
          p.alive = false;
          p.sprite.destroy();

          enemy.sprite.setTintFill(0xffffff);
          scene.time.delayedCall(45, () => {
            if (enemy.sprite?.active) enemy.sprite.clearTint();
          });

          if (enemy.hp <= 0) {
            enemy.alive = false;
            scene.gameState.gold += enemy.reward;
            scene.gameState.score += Math.round(enemy.reward * 2.4);

            const burst = scene.add.circle(enemy.sprite.x, enemy.sprite.y, 9, 0xffb87f, 0.88).setDepth(3.35);
            scene.tweens.add({
              targets: burst,
              alpha: 0,
              scale: 2.8,
              duration: 160,
              onComplete: () => burst.destroy(),
            });

            enemy.sprite.destroy();
            scene.updateHud();
          }
          break;
        }
      }
    });
  };

  const cleanup = () => {
    state.enemyList = state.enemyList.filter((e) => e.alive && e.sprite?.active);
    state.projectileList = state.projectileList.filter((p) => p.alive && p.sprite?.active);
    state.towerList = state.towerList.filter((t) => t.sprite?.active);
  };

  const checkWaveClear = () => {
    if (!state.waveActive) return;
    if (state.spawnIndex < state.wavePlan.length) return;
    if (state.enemyList.some((e) => e.alive)) return;

    const cleared = scene.gameState.wave;
    scene.gameState.wave += 1;
    scene.gameState.gold += 24 + Math.round(cleared * 4);
    resetForPrep('Wave ' + cleared + ' cleared. Reposition and reinforce.');
  };

  const update = (dtMs) => {
    if (!state.active || scene.gameState.gameOver) return;

    const dt = Math.min(0.05, Math.max(0, dtMs / 1000));
    const now = scene.time.now;

    if (state.waveActive && state.spawnIndex < state.wavePlan.length && now >= state.nextSpawnAt) {
      spawnEnemy(state.wavePlan[state.spawnIndex]);
      state.spawnIndex += 1;
      state.nextSpawnAt = now + Phaser.Math.Between(320, 560);
    }

    state.enemyList.forEach((enemy) => {
      if (!enemy.alive || !enemy.sprite?.active) return;
      moveEnemyAlongPath(enemy, dt);
    });

    updateTowers(now);
    updateProjectiles(dt);
    cleanup();
    checkWaveClear();
  };

  const bootstrap = () => {
    scene.towers?.clear?.(true, true);
    scene.enemies?.clear?.(true, true);
    scene.projectiles?.clear?.(true, true);
    scene.enemyProjectiles?.clear?.(true, true);

    buildRoadLayout();
    createTowerPads();
    renderMap();
    updatePadVisuals();
    resetForPrep('Wave 1 – four-corner entrances, sweeping spline roads, staggered organic merges.');
  };

  const destroy = () => {
    clearActiveCombatObjects();
    state.towerList.forEach((tower) => {
      const sprite = tower.sprite;
      if (!sprite?.active) return;
      sprite.getData('idLabel')?.destroy();
      sprite.getData('hpBg')?.destroy();
      sprite.getData('hpFill')?.destroy();
      sprite.destroy();
    });
    destroyOldLayer();
  };

  bootstrap();

  return {
    isActive: () => state.active,
    startWave,
    placeTower,
    update,
    destroy,
    getState: () => ({
      waveActive: state.waveActive,
      towers: state.towerList.length,
      enemies: state.enemyList.length,
      projectiles: state.projectileList.length,
      entrances: state.entrances.length,
      chokePoints: state.chokePoints.length,
    }),
  };
}
