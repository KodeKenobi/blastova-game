import fs from 'node:fs';
import path from 'node:path';

const BASE_WIDTH = 1000;
const BASE_HEIGHT = 600;
const BOARD_WIDTH = 1600;
const BOARD_HEIGHT = 900;
const MAP_OFFSET_Y = sy(10);
const PATH_HALF_WIDTH = sx(14.5);

const PATH_LAYOUT_TEMPLATES = [
  {
    id: 'serpentine-north',
    name: 'Serpentine North',
    points: [
      { x: 40, y: 145 },
      { x: 116, y: 145 },
      { x: 116, y: 304 },
      { x: 385, y: 304 },
      { x: 385, y: 122 },
      { x: 694, y: 122 },
      { x: 694, y: 424 },
      { x: 960, y: 424 },
    ],
  },
  {
    id: 'south-detour',
    name: 'South Detour',
    points: [
      { x: 40, y: 145 },
      { x: 140, y: 145 },
      { x: 140, y: 468 },
      { x: 478, y: 468 },
      { x: 478, y: 198 },
      { x: 748, y: 198 },
      { x: 748, y: 424 },
      { x: 960, y: 424 },
    ],
  },
  {
    id: 'north-corridor',
    name: 'North Corridor',
    points: [
      { x: 40, y: 145 },
      { x: 230, y: 145 },
      { x: 230, y: 96 },
      { x: 610, y: 96 },
      { x: 610, y: 330 },
      { x: 820, y: 330 },
      { x: 820, y: 424 },
      { x: 960, y: 424 },
    ],
  },
  {
    id: 'midline-zigzag',
    name: 'Midline Zigzag',
    points: [
      { x: 40, y: 145 },
      { x: 96, y: 145 },
      { x: 96, y: 356 },
      { x: 318, y: 356 },
      { x: 318, y: 226 },
      { x: 564, y: 226 },
      { x: 564, y: 426 },
      { x: 960, y: 426 },
    ],
  },
];

function sx(value) {
  return (value / BASE_WIDTH) * BOARD_WIDTH;
}

function sy(value) {
  return (value / BASE_HEIGHT) * BOARD_HEIGHT;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function parseArgs(argv) {
  const args = {
    allWaves: true,
    wave: null,
    output: 'reports/path-map-report.json',
    csv: true,
    sampleStep: 8,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--wave') {
      const waveValue = Number.parseInt(argv[i + 1], 10);
      if (Number.isInteger(waveValue) && waveValue > 0) {
        args.wave = waveValue;
        args.allWaves = false;
      }
      i += 1;
    } else if (token === '--all-waves') {
      args.allWaves = true;
      args.wave = null;
    } else if (token === '--output') {
      const outputValue = argv[i + 1];
      if (outputValue) {
        args.output = outputValue;
      }
      i += 1;
    } else if (token === '--no-csv') {
      args.csv = false;
    } else if (token === '--sample-step') {
      const sampleStep = Number.parseInt(argv[i + 1], 10);
      if (Number.isInteger(sampleStep) && sampleStep > 0) {
        args.sampleStep = sampleStep;
      }
      i += 1;
    }
  }

  return args;
}

function getTemplateForWave(wave) {
  const index = (Math.max(1, wave) - 1) % PATH_LAYOUT_TEMPLATES.length;
  return PATH_LAYOUT_TEMPLATES[index];
}

function toWorldPath(points) {
  return points.map((point) => ({
    x: sx(point.x),
    y: sy(point.y) + MAP_OFFSET_Y,
  }));
}

function buildSegments(pathPoints) {
  const segments = [];
  for (let i = 0; i < pathPoints.length - 1; i += 1) {
    const start = pathPoints[i];
    const end = pathPoints[i + 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    if (length === 0) {
      continue;
    }

    segments.push({
      index: i,
      start,
      end,
      dx,
      dy,
      length,
      ux: dx / length,
      uy: dy / length,
      angleDeg: Math.atan2(dy, dx) * (180 / Math.PI),
    });
  }
  return segments;
}

function distancePointToSegment(px, py, segment) {
  const { start, end, dx, dy } = segment;
  const denom = (dx * dx) + (dy * dy);
  const t = denom === 0 ? 0 : clamp((((px - start.x) * dx) + ((py - start.y) * dy)) / denom, 0, 1);
  const cx = start.x + (t * dx);
  const cy = start.y + (t * dy);
  const ddx = px - cx;
  const ddy = py - cy;
  return Math.hypot(ddx, ddy);
}

function collectPathPixels(segments, halfWidth) {
  const expandedBounds = segments.map((segment) => {
    const minX = Math.floor(Math.min(segment.start.x, segment.end.x) - halfWidth - 1);
    const maxX = Math.ceil(Math.max(segment.start.x, segment.end.x) + halfWidth + 1);
    const minY = Math.floor(Math.min(segment.start.y, segment.end.y) - halfWidth - 1);
    const maxY = Math.ceil(Math.max(segment.start.y, segment.end.y) + halfWidth + 1);
    return {
      index: segment.index,
      minX: clamp(minX, 0, BOARD_WIDTH - 1),
      maxX: clamp(maxX, 0, BOARD_WIDTH - 1),
      minY: clamp(minY, 0, BOARD_HEIGHT - 1),
      maxY: clamp(maxY, 0, BOARD_HEIGHT - 1),
    };
  });

  const globalBounds = expandedBounds.reduce((acc, bounds) => ({
    minX: Math.min(acc.minX, bounds.minX),
    maxX: Math.max(acc.maxX, bounds.maxX),
    minY: Math.min(acc.minY, bounds.minY),
    maxY: Math.max(acc.maxY, bounds.maxY),
  }), {
    minX: BOARD_WIDTH - 1,
    maxX: 0,
    minY: BOARD_HEIGHT - 1,
    maxY: 0,
  });

  const occupiedPixels = [];
  const threshold = halfWidth + 0.0001;

  for (let y = globalBounds.minY; y <= globalBounds.maxY; y += 1) {
    for (let x = globalBounds.minX; x <= globalBounds.maxX; x += 1) {
      const px = x + 0.5;
      const py = y + 0.5;
      let onPath = false;

      for (let i = 0; i < segments.length; i += 1) {
        if (distancePointToSegment(px, py, segments[i]) <= threshold) {
          onPath = true;
          break;
        }
      }

      if (onPath) {
        occupiedPixels.push([x, y]);
      }
    }
  }

  return {
    occupiedPixels,
    expandedBounds,
    globalBounds,
  };
}

function sampleCenterline(segments, stepPx) {
  const samples = [];
  segments.forEach((segment) => {
    const steps = Math.max(1, Math.ceil(segment.length / stepPx));
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      samples.push({
        x: Math.round(segment.start.x + ((segment.end.x - segment.start.x) * t)),
        y: Math.round(segment.start.y + ((segment.end.y - segment.start.y) * t)),
        segmentIndex: segment.index,
      });
    }
  });
  return samples;
}

function analyzeWave(wave, sampleStep) {
  const template = getTemplateForWave(wave);
  const worldPath = toWorldPath(template.points);
  const segments = buildSegments(worldPath);
  const { occupiedPixels, expandedBounds, globalBounds } = collectPathPixels(segments, PATH_HALF_WIDTH);
  const centerlineSamples = sampleCenterline(segments, sampleStep);

  return {
    wave,
    layoutId: template.id,
    layoutName: template.name,
    centerlineBaseCoordinates: template.points,
    centerlineBoardCoordinates: worldPath.map((point) => ({
      x: Number(point.x.toFixed(3)),
      y: Number(point.y.toFixed(3)),
    })),
    segmentCount: segments.length,
    segments: segments.map((segment, idx) => ({
      index: idx,
      start: {
        x: Number(segment.start.x.toFixed(3)),
        y: Number(segment.start.y.toFixed(3)),
      },
      end: {
        x: Number(segment.end.x.toFixed(3)),
        y: Number(segment.end.y.toFixed(3)),
      },
      lengthPx: Number(segment.length.toFixed(3)),
      angleDeg: Number(segment.angleDeg.toFixed(3)),
      bounds: expandedBounds[idx],
    })),
    pathBounds: globalBounds,
    centerlineSamples,
    occupiedPixelCount: occupiedPixels.length,
    occupiedPixels,
  };
}

function writeCsv(csvPath, waveReports) {
  const lines = ['wave,layout_id,layout_name,x,y'];
  waveReports.forEach((report) => {
    report.occupiedPixels.forEach(([x, y]) => {
      lines.push([report.wave, report.layoutId, report.layoutName, x, y].join(','));
    });
  });

  fs.mkdirSync(path.dirname(csvPath), { recursive: true });
  fs.writeFileSync(csvPath, lines.join('\n'));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const waves = args.allWaves
    ? Array.from({ length: PATH_LAYOUT_TEMPLATES.length }, (_, idx) => idx + 1)
    : [args.wave || 1];

  const waveReports = waves.map((wave) => analyzeWave(wave, args.sampleStep));

  const report = {
    generatedAt: new Date().toISOString(),
    board: {
      width: BOARD_WIDTH,
      height: BOARD_HEIGHT,
      baseWidth: BASE_WIDTH,
      baseHeight: BASE_HEIGHT,
      mapOffsetY: MAP_OFFSET_Y,
    },
    path: {
      halfWidthPx: PATH_HALF_WIDTH,
      fullWidthPx: PATH_HALF_WIDTH * 2,
      templateCount: PATH_LAYOUT_TEMPLATES.length,
    },
    waves: waveReports,
  };

  fs.mkdirSync(path.dirname(args.output), { recursive: true });
  fs.writeFileSync(args.output, JSON.stringify(report, null, 2));

  if (args.csv) {
    const csvPath = args.output.replace(/\.json$/i, '.csv');
    writeCsv(csvPath, waveReports);
    console.log('Wrote:', args.output);
    console.log('Wrote:', csvPath);
  } else {
    console.log('Wrote:', args.output);
  }

  waveReports.forEach((waveReport) => {
    console.log(
      [
        'Wave ' + waveReport.wave,
        '(' + waveReport.layoutName + ')',
        '- occupied path pixels:',
        waveReport.occupiedPixelCount,
      ].join(' ')
    );
  });
}

main();
