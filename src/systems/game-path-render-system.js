import Phaser from 'phaser';
import {
  BASE_HEIGHT,
  BASE_WIDTH,
  BOARD_HEIGHT,
  BOARD_WIDTH,
} from './game-config-constants';
import { createBoardScalers } from './game-core-utils';

const { sx, sy } = createBoardScalers({
  baseWidth: BASE_WIDTH,
  baseHeight: BASE_HEIGHT,
  boardWidth: BOARD_WIDTH,
  boardHeight: BOARD_HEIGHT,
});

const MAP_OFFSET_Y = sy(10);

export function drawPath() {
    if (this.allowedBuildZoneOverlay && this.allowedBuildZoneOverlay.active) {
      this.allowedBuildZoneOverlay.destroy();
      this.allowedBuildZoneOverlay = null;
    }
    if (this.pathRoadOverlay && this.pathRoadOverlay.active) {
      this.pathRoadOverlay.destroy();
      this.pathRoadOverlay = null;
    }
    if (this.pathGuideOverlay && this.pathGuideOverlay.active) {
      this.pathGuideOverlay.destroy();
      this.pathGuideOverlay = null;
    }
    if (Array.isArray(this.extraVisualPathOverlays)) {
      this.extraVisualPathOverlays.forEach((overlay) => overlay?.active && overlay.destroy());
      this.extraVisualPathOverlays = [];
    }
    if (Array.isArray(this.customEntranceMarkers)) {
      this.customEntranceMarkers.forEach((item) => item?.active && item.destroy());
      this.customEntranceMarkers = [];
    }

    const mapBackdropActive = Boolean(this.activeWorldMapKey && this.textures.exists(this.activeWorldMapKey));
    const roadHalf = mapBackdropActive ? sx(8.6) : sx(14.5);
    const roadGraphics = this.add.graphics().setDepth(1.5);

    if (!mapBackdropActive) {
      // Layered fills simulate compacted soil center, rough edges, and subtle wheel wear.
      this.stampDirtRoad(roadGraphics, this.path, roadHalf + sx(3.4), 0x4f3a23, 0.54, 11, 0.34, 0.85);
      this.stampDirtRoad(roadGraphics, this.path, roadHalf + sx(1.1), 0x76552f, 0.68, 10, 0.22, 0.92);
      this.stampDirtRoad(roadGraphics, this.path, roadHalf * 0.9, 0x9b7543, 0.36, 9, 0.15, 1.0);

      const leftRut = this.buildOffsetPath(this.path, roadHalf * 0.34);
      const rightRut = this.buildOffsetPath(this.path, -roadHalf * 0.34);
      roadGraphics.lineStyle(Math.max(1, sx(1.6)), 0x654825, 0.45);
      roadGraphics.beginPath();
      this.tracePathPolyline(roadGraphics, leftRut);
      roadGraphics.strokePath();
      roadGraphics.beginPath();
      this.tracePathPolyline(roadGraphics, rightRut);
      roadGraphics.strokePath();
    } else {
      const shoulderOffset = sx(10.5);
      const leftShoulder = this.buildOffsetPath(this.path, shoulderOffset);
      const rightShoulder = this.buildOffsetPath(this.path, -shoulderOffset);
      roadGraphics.lineStyle(Math.max(1, sx(2.3)), 0x2d1b0d, 0.16);
      roadGraphics.beginPath();
      this.tracePathPolyline(roadGraphics, leftShoulder);
      roadGraphics.strokePath();
      roadGraphics.beginPath();
      this.tracePathPolyline(roadGraphics, rightShoulder);
      roadGraphics.strokePath();

      roadGraphics.lineStyle(Math.max(1, sx(1.8)), 0x1d1207, 0.24);
      roadGraphics.beginPath();
      this.tracePathPolyline(roadGraphics, this.path);
      roadGraphics.strokePath();

      roadGraphics.lineStyle(Math.max(2, sx(2.6)), 0xffffff, 0.92);
      roadGraphics.beginPath();
      this.tracePathPolyline(roadGraphics, this.path);
      roadGraphics.strokePath();
    }

    if (this.path.length >= 2) {
      const start = this.path[0];
      const end = this.path[this.path.length - 1];
      if (!mapBackdropActive && this.showPathGuide !== false) {
        roadGraphics.fillStyle(0x4f3a23, 0.78);
        roadGraphics.fillCircle(start.x, start.y, roadHalf + sx(3.2));
        roadGraphics.fillCircle(end.x, end.y, roadHalf + sx(3.2));
        roadGraphics.fillStyle(0x8b6739, 0.88);
        roadGraphics.fillCircle(start.x, start.y, roadHalf + sx(0.8));
        roadGraphics.fillCircle(end.x, end.y, roadHalf + sx(0.8));
      }

      if (!mapBackdropActive) {
        // Direction marker from the yellow entry circle toward upper-right.
        roadGraphics.lineStyle(Math.max(2, sx(3.2)), 0xf3d86c, 0.9);
        const markerLengthScale = 0.9;
        const markerControlPoints = [
          { x: start.x, y: start.y },
          { x: start.x + sx(22), y: start.y - sy(20) },
          { x: start.x + sx(38), y: start.y - sy(46) },
          { x: start.x + sx(66), y: start.y - sy(64) },
          { x: start.x + sx(98), y: start.y - sy(76) },
          { x: start.x + sx(138), y: start.y - sy(82) },
          { x: start.x + sx(182), y: start.y - sy(82) },
          { x: start.x + sx(198), y: start.y - sy(68) },
          { x: start.x + sx(204), y: start.y - sy(48) },
          { x: start.x + sx(198), y: start.y - sy(26) },
          { x: start.x + sx(200), y: start.y - sy(10) },
          { x: start.x + sx(196), y: start.y + sy(2) },
          { x: start.x + sx(186), y: start.y + sy(18) },
          { x: start.x + sx(174), y: start.y + sy(34) },
          { x: start.x + sx(162), y: start.y + sy(50) },
          { x: start.x + sx(150), y: start.y + sy(66) },
          { x: start.x + sx(140), y: start.y + sy(82) },
          { x: start.x + sx(132), y: start.y + sy(98) },
          { x: start.x + sx(126), y: start.y + sy(114) },
          { x: start.x + sx(120), y: start.y + sy(132) },
          { x: start.x + sx(120), y: start.y + sy(150) },
          { x: start.x + sx(124), y: start.y + sy(166) },
          { x: start.x + sx(128), y: start.y + sy(182) },
          { x: start.x + sx(132), y: start.y + sy(198) },
          { x: start.x + sx(136), y: start.y + sy(214) },
          { x: start.x + sx(140), y: start.y + sy(230) },
          { x: start.x + sx(146), y: start.y + sy(246) },
          { x: start.x + sx(196), y: start.y + sy(280) },
          { x: start.x + sx(248), y: start.y + sy(300) },
          { x: start.x + sx(296), y: start.y + sy(294) },
          { x: start.x + sx(334), y: start.y + sy(270) },
          { x: start.x + sx(374), y: start.y + sy(240) },
          { x: start.x + sx(414), y: start.y + sy(206) },
          { x: start.x + sx(456), y: start.y + sy(170) },
          { x: start.x + sx(498), y: start.y + sy(136) },
          { x: start.x + sx(540), y: start.y + sy(104) },
          { x: start.x + sx(584), y: start.y + sy(90) },
          { x: start.x + sx(630), y: start.y + sy(92) },
          { x: start.x + sx(676), y: start.y + sy(104) },
          { x: start.x + sx(720), y: start.y + sy(126) },
          { x: start.x + sx(738), y: start.y + sy(150) },
          { x: start.x + sx(750), y: start.y + sy(174) },
          { x: start.x + sx(766), y: start.y + sy(198) },
          { x: start.x + sx(772), y: start.y + sy(220) },
          { x: start.x + sx(784), y: start.y + sy(232) },
          { x: start.x + sx(792), y: start.y + sy(246) },
          { x: start.x + sx(800), y: start.y + sy(256) },
          { x: start.x + sx(812), y: start.y + sy(260) },
          { x: start.x + sx(826), y: start.y + sy(248) },
          { x: start.x + sx(844), y: start.y + sy(236) },
          { x: start.x + sx(862), y: start.y + sy(226) },
          { x: start.x + sx(884), y: start.y + sy(230) },
          { x: start.x + sx(908), y: start.y + sy(234) },
          { x: start.x + sx(932), y: start.y + sy(240) },
          { x: start.x + sx(956), y: start.y + sy(246) },
          { x: start.x + sx(980), y: start.y + sy(252) },
          { x: start.x + sx(1010), y: start.y + sy(268) },
          { x: start.x + sx(1030), y: start.y + sy(283) },
          { x: start.x + sx(1044), y: start.y + sy(291) },
          { x: start.x + sx(1052), y: start.y + sy(296) },
        ];
        const markerPoints = markerControlPoints.map((point, index) => {
          if (index === 0) {
            return point;
          }
          return {
            x: start.x + (point.x - start.x) * markerLengthScale,
            y: start.y + (point.y - start.y) * markerLengthScale,
          };
        });
        const markerSpline = new Phaser.Curves.Spline(markerPoints.map((p) => new Phaser.Math.Vector2(p.x, p.y)));
        const markerSamplePoints = markerSpline.getPoints(72);

        const markerOverlay = this.add.graphics().setDepth(1200);
        markerOverlay.lineStyle(Math.max(2, sx(3.2)), 0xf3d86c, 0.9);
        markerOverlay.beginPath();
        markerOverlay.moveTo(markerSamplePoints[0].x, markerSamplePoints[0].y);
        for (let i = 1; i < markerSamplePoints.length; i += 1) {
          markerOverlay.lineTo(markerSamplePoints[i].x, markerSamplePoints[i].y);
        }
        markerOverlay.strokePath();
        this.pathGuideOverlay = markerOverlay;
        markerOverlay.setVisible(this.showPathGuide !== false);
      }
    }

    if (!mapBackdropActive) {
      // Sparse shoulder specks help the lane read as dirt rather than hard-surface track.
      for (let i = 6; i < this.path.length - 6; i += 12) {
        const prev = this.path[i - 1];
        const point = this.path[i];
        const next = this.path[i + 1];
        const dx = next.x - prev.x;
        const dy = next.y - prev.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        const jitter = Math.sin(i * 0.7) * sx(1.4);
        const leftX = point.x + nx * (roadHalf + sx(2.6) + jitter);
        const leftY = point.y + ny * (roadHalf + sx(2.6) + jitter);
        const rightX = point.x - nx * (roadHalf + sx(2.6) - jitter);
        const rightY = point.y - ny * (roadHalf + sx(2.6) - jitter);

        roadGraphics.fillStyle(0x5d4527, 0.28);
        roadGraphics.fillCircle(leftX, leftY, sx(3.4));
        roadGraphics.fillCircle(rightX, rightY, sx(3.1));

        if (i % 24 === 0) {
          roadGraphics.fillStyle(0xb0844f, 0.24);
          roadGraphics.fillCircle(point.x + (nx * sx(1.2)), point.y + (ny * sx(1.2)), sx(2.8));
        }
      }
    }

    if (this.mapLayer) {
      this.mapLayer.add(roadGraphics);
    }
    this.pathRoadOverlay = roadGraphics;
    roadGraphics.setVisible(this.showPathGuide !== false);

    if (!mapBackdropActive) {
    this.routeGuideEntryText = this.add.text(sx(40), sy(104) + MAP_OFFSET_Y, 'ENTRY', {
      fontFamily: 'Trebuchet MS',
      fontSize: '20px',
      color: '#8cb6c8',
      letterSpacing: 2,
    }).setAlpha(0.88);
    if (this.mapLayer) {
      this.mapLayer.add(this.routeGuideEntryText);
    }

    this.routeGuideCoreText = this.add.text(sx(978), sy(440) + MAP_OFFSET_Y, 'CORE', {
      fontFamily: 'Trebuchet MS',
      fontSize: '20px',
      color: '#d8b678',
      letterSpacing: 2,
    }).setAlpha(0.9);
    if (this.mapLayer) {
      this.mapLayer.add(this.routeGuideCoreText);
    }

    // Numbered markers for the two other visible terrain entrances
    const markerStyle = { fontFamily: 'Trebuchet MS', fontSize: '22px', color: '#ff4444', fontStyle: 'bold' };
    const entryStyle  = { fontFamily: 'Trebuchet MS', fontSize: '13px', color: '#ffb347', fontStyle: 'bold', letterSpacing: 1 };
    const worldIndex = this.gameState?.selectedWorldIndex || 0;
    this.routeGuideMarker1 = this.add.text(sx(227), sy(468) + MAP_OFFSET_Y, '①', markerStyle).setAlpha(0.95).setDepth(10);
    this.routeGuideLabel1 = this.add.text(sx(227) + sx(18), sy(468) - sy(2) + MAP_OFFSET_Y, 'ROUTE ①', entryStyle).setAlpha(0.85).setDepth(10);
    this.routeGuideMarker2 = this.add.text(sx(706), sy(100) + MAP_OFFSET_Y, '②', markerStyle).setAlpha(0.95).setDepth(10);
    this.routeGuideLabel2 = this.add.text(sx(706) + sx(18), sy(100) - sy(2) + MAP_OFFSET_Y, 'ROUTE ②', entryStyle).setAlpha(0.85).setDepth(10);
    this.routeTwoEntranceGroundShadow = null;
    this.routeTwoEntranceShadow = null;
    this.routeTwoEntranceTerrainWash = null;
    this.routeTwoEntranceBezel = null;
    this.routeTwoEntranceHighlight = null;
    this.routeTwoEntranceImg = null;
    this.routeGuideMarker3 = this.add.text(sx(425), sy(468) + MAP_OFFSET_Y, '③', markerStyle).setAlpha(0.95).setDepth(10);
    this.routeGuideLabel3 = this.add.text(sx(425) + sx(18), sy(468) - sy(2) + MAP_OFFSET_Y, 'ROUTE ③', entryStyle).setAlpha(0.85).setDepth(10);
    if (this.mapLayer) { this.mapLayer.add(this.routeGuideMarker1); this.mapLayer.add(this.routeGuideLabel1); this.mapLayer.add(this.routeGuideMarker2); this.mapLayer.add(this.routeGuideLabel2); this.mapLayer.add(this.routeGuideMarker3); this.mapLayer.add(this.routeGuideLabel3); }
    }

    this.setPathGuideVisible(this.showPathGuide !== false);

    // Draw secondary path guide (orange) from ① to main path join
    if (this.secondaryPath && this.secondaryPath.length >= 2) {
      const secOverlay = this.add.graphics().setDepth(1200);
      secOverlay.lineStyle(Math.max(2, sx(3.2)), 0xff8c30, 0.85);
      secOverlay.beginPath();
      secOverlay.moveTo(this.secondaryPath[0].x, this.secondaryPath[0].y);
      for (let i = 1; i < this.secondaryPath.length; i++) {
        secOverlay.lineTo(this.secondaryPath[i].x, this.secondaryPath[i].y);
      }
      secOverlay.strokePath();
      secOverlay.setVisible(this.showPathGuide !== false);
      this.secondaryPathOverlay = secOverlay;
    }

    // Draw tertiary path guide (green) from ② to main path join
    if (this.tertiaryPath && this.tertiaryPath.length >= 2) {
      const terOverlay = this.add.graphics().setDepth(1200);
      terOverlay.lineStyle(Math.max(2, sx(3.2)), 0x40e060, 0.85);
      terOverlay.beginPath();
      terOverlay.moveTo(this.tertiaryPath[0].x, this.tertiaryPath[0].y);
      for (let i = 1; i < this.tertiaryPath.length; i++) {
        terOverlay.lineTo(this.tertiaryPath[i].x, this.tertiaryPath[i].y);
      }
      terOverlay.strokePath();
      terOverlay.setVisible(this.showPathGuide !== false);
      this.tertiaryPathOverlay = terOverlay;
    }

    // Draw quaternary path guide (cyan) from ③ to main path join
    if (this.quaternaryPath && this.quaternaryPath.length >= 2) {
      const quatOverlay = this.add.graphics().setDepth(1200);
      quatOverlay.lineStyle(Math.max(2, sx(3.2)), 0x30d8e8, 0.85);
      quatOverlay.beginPath();
      quatOverlay.moveTo(this.quaternaryPath[0].x, this.quaternaryPath[0].y);
      for (let i = 1; i < this.quaternaryPath.length; i++) {
        quatOverlay.lineTo(this.quaternaryPath[i].x, this.quaternaryPath[i].y);
      }
      quatOverlay.strokePath();
      quatOverlay.setVisible(this.showPathGuide !== false);
      this.quaternaryPathOverlay = quatOverlay;
    }

    if (Array.isArray(this.extraVisualPaths) && this.extraVisualPaths.length > 0) {
      const colors = [0xf6d743, 0xff66b3, 0x8b5cf6, 0x4ade80];
      this.extraVisualPathOverlays = this.extraVisualPaths
        .filter((pathPoints) => Array.isArray(pathPoints) && pathPoints.length >= 2)
        .map((pathPoints, index) => {
          const overlay = this.add.graphics().setDepth(1200);
          overlay.lineStyle(Math.max(2, sx(3.2)), colors[index % colors.length], 0.85);
          overlay.beginPath();
          overlay.moveTo(pathPoints[0].x, pathPoints[0].y);
          for (let i = 1; i < pathPoints.length; i += 1) {
            overlay.lineTo(pathPoints[i].x, pathPoints[i].y);
          }
          overlay.strokePath();
          overlay.setVisible(this.showPathGuide !== false);
          return overlay;
        });
    }

    if (mapBackdropActive && Array.isArray(this.customSpawnRoutes) && this.customSpawnRoutes.length > 0) {
      const routeColors = ['#ffffff', '#ffb06a', '#79f08c', '#70e7ff', '#ffe66b', '#ff8fd3', '#c6a4ff'];
      const routeEntries = this.customSpawnRoutes
        .filter((route) => Array.isArray(route?.path) && route.path.length > 0)
        .map((route, index) => ({
          label: String(index + 1),
          color: routeColors[index % routeColors.length],
          point: route.path[0],
        }));

      const edgePaddingX = sx(34);
      const topSafeY = sy(122);
      const bottomSafeY = BOARD_HEIGHT - sy(108);
      const markerStyle = {
        fontFamily: 'Trebuchet MS',
        fontSize: `${Math.max(20, Math.round(sx(18)))}px`,
        fontStyle: 'bold',
      };
      const labelStyle = {
        fontFamily: 'Trebuchet MS',
        fontSize: `${Math.max(11, Math.round(sx(10)))}px`,
        fontStyle: 'bold',
      };

      this.customEntranceMarkers = routeEntries.flatMap((entry) => {
        const clampedX = Phaser.Math.Clamp(entry.point.x, edgePaddingX, BOARD_WIDTH - edgePaddingX);
        const clampedY = Phaser.Math.Clamp(entry.point.y, topSafeY, bottomSafeY);
        const number = this.add.text(clampedX, clampedY, entry.label, {
          ...markerStyle,
          color: entry.color,
          stroke: '#081018',
          strokeThickness: 3,
        }).setDepth(1300).setOrigin(0.5);
        const caption = this.add.text(clampedX + sx(12), clampedY - sy(14), `ENTRY ${entry.label}`, {
          ...labelStyle,
          color: entry.color,
          stroke: '#081018',
          strokeThickness: 4,
        }).setDepth(1300).setOrigin(0, 0.5);
        return [number, caption];
      });
      this.customEntranceMarkers.forEach((marker) => marker?.setVisible(this.showPathGuide !== false));
    }

    const allowedBuildPolygons = this.getScaledAllowedBuildPolygons?.() || [];
    if (Array.isArray(allowedBuildPolygons) && allowedBuildPolygons.length > 0) {
      const zoneColors = [0x4ad8ff, 0xffae58, 0x68ef83, 0xa38cff, 0xff77b9, 0xf8e16c, 0x7be7ff, 0xf7a5ff];
      const zoneOverlay = this.add.graphics().setDepth(1188);

      allowedBuildPolygons.forEach((polygon, index) => {
        if (!Array.isArray(polygon) || polygon.length < 3) {
          return;
        }
        const color = zoneColors[index % zoneColors.length];
        zoneOverlay.fillStyle(color, 0.11);
        zoneOverlay.lineStyle(Math.max(2, sx(2.2)), color, 0.74);
        zoneOverlay.beginPath();
        zoneOverlay.moveTo(polygon[0].x, polygon[0].y);
        for (let i = 1; i < polygon.length; i += 1) {
          zoneOverlay.lineTo(polygon[i].x, polygon[i].y);
        }
        zoneOverlay.closePath();
        zoneOverlay.fillPath();
        zoneOverlay.strokePath();
      });

      zoneOverlay.setVisible(this.showPathGuide !== false);
      this.allowedBuildZoneOverlay = zoneOverlay;
    }

    // Keep all path/entry visuals synchronized with current Settings state.
    this.setPathGuideVisible(this.showPathGuide !== false);
}

