import fs from 'node:fs';
import path from 'node:path';
import jpeg from 'jpeg-js';

const BASE_WIDTH = 1000;
const BASE_HEIGHT = 600;
const BOARD_WIDTH = 1600;
const BOARD_HEIGHT = 900;

function sx(value) {
  return (value / BASE_WIDTH) * BOARD_WIDTH;
}

function sy(value) {
  return (value / BASE_HEIGHT) * BOARD_HEIGHT;
}

const MAP_OFFSET_Y = sy(10);

function parseArgs(argv) {
  const args = {
    layoutId: 'serpentine-north',
    gameFile: 'src/game.js',
    image: 'public/assets/maps/tower-defense/LAIMap1.jpg',
    output: 'reports/path-image-analysis.json',
    zoom: 1,
    scanRadius: 120,
    scanStep: 2,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--layout') {
      args.layoutId = argv[i + 1] || args.layoutId;
      i += 1;
    } else if (token === '--game-file') {
      args.gameFile = argv[i + 1] || args.gameFile;
      i += 1;
    } else if (token === '--image') {
      args.image = argv[i + 1] || args.image;
      i += 1;
    } else if (token === '--output') {
      args.output = argv[i + 1] || args.output;
      i += 1;
    } else if (token === '--zoom') {
      const zoom = Number.parseFloat(argv[i + 1]);
      if (Number.isFinite(zoom) && zoom > 0) {
        args.zoom = zoom;
      }
      i += 1;
    } else if (token === '--scan-radius') {
      const scanRadius = Number.parseInt(argv[i + 1], 10);
      if (Number.isInteger(scanRadius) && scanRadius > 0) {
        args.scanRadius = scanRadius;
      }
      i += 1;
    } else if (token === '--scan-step') {
      const scanStep = Number.parseInt(argv[i + 1], 10);
      if (Number.isInteger(scanStep) && scanStep > 0) {
        args.scanStep = scanStep;
      }
      i += 1;
    }
  }

  return args;
}

function extractTemplatePoints(gameSource, layoutId) {
  const escapedId = layoutId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const objectRegex = new RegExp(`id:\\s*'${escapedId}'[\\s\\S]*?points:\\s*\\[([\\s\\S]*?)\\]\\s*,\\s*\\}`, 'm');
  const match = gameSource.match(objectRegex);
  if (!match) {
    throw new Error(`Could not find layout "${layoutId}" in game file.`);
  }

  const pointsBlock = match[1];
  const points = [];
  const pointRegex = /\{\s*x:\s*([-0-9.]+)\s*,\s*y:\s*([-0-9.]+)\s*\}/g;
  let pointMatch;
  while ((pointMatch = pointRegex.exec(pointsBlock)) !== null) {
    points.push({
      x: Number.parseFloat(pointMatch[1]),
      y: Number.parseFloat(pointMatch[2]),
    });
  }

  if (points.length < 2) {
    throw new Error(`Layout "${layoutId}" has too few points (${points.length}).`);
  }

  return points;
}

function decodeJpeg(filePath) {
  const buffer = fs.readFileSync(filePath);
  return jpeg.decode(buffer, { useTArray: true });
}

function computeMapTransform(imageWidth, imageHeight, zoom) {
  const visibleWidth = BOARD_WIDTH / zoom;
  const visibleHeight = BOARD_HEIGHT / zoom;
  const playfieldTop = sy(98) + MAP_OFFSET_Y;
  const playfieldBottom = BOARD_HEIGHT - sy(104);
  const playfieldHeight = Math.max(sy(180), playfieldBottom - playfieldTop);
  const coverScale = Math.max(visibleWidth / imageWidth, visibleHeight / imageHeight);
  const displayWidth = imageWidth * coverScale;
  const displayHeight = imageHeight * coverScale;
  const mapDrawX = (BOARD_WIDTH * 0.5) - (displayWidth * 0.5);
  const mapDrawY = (playfieldTop + (playfieldHeight * 0.5)) - (displayHeight * 0.5);

  return {
    visibleWidth,
    visibleHeight,
    playfieldTop,
    playfieldBottom,
    playfieldHeight,
    coverScale,
    displayWidth,
    displayHeight,
    mapDrawX,
    mapDrawY,
  };
}

function boardToImage(point, transform) {
  return {
    x: (point.x - transform.mapDrawX) / transform.coverScale,
    y: (point.y - transform.mapDrawY) / transform.coverScale,
  };
}

function imageToBoard(point, transform) {
  return {
    x: point.x * transform.coverScale + transform.mapDrawX,
    y: point.y * transform.coverScale + transform.mapDrawY,
  };
}

function getPixel(image, x, y) {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) {
    return null;
  }
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const idx = ((iy * image.width) + ix) * 4;
  return {
    r: image.data[idx],
    g: image.data[idx + 1],
    b: image.data[idx + 2],
  };
}

function roadScore(pixel) {
  const { r, g, b } = pixel;
  const brightness = (r + g + b) / 3;
  const redDominance = (r - g) + (r - b);
  const greenPenalty = Math.max(0, g - r) * 1.7;
  const bluePenalty = Math.max(0, b - r) * 1.4;
  const cyanPenalty = Math.max(0, Math.min(g, b) - r) * 1.6;
  const darkPenalty = Math.abs(brightness - 92) * 0.35;
  return redDominance - greenPenalty - bluePenalty - cyanPenalty - darkPenalty;
}

function toWorldPath(basePoints) {
  return basePoints.map((point) => ({
    x: sx(point.x),
    y: sy(point.y) + MAP_OFFSET_Y,
  }));
}

function toBasePoint(worldPoint) {
  return {
    x: Number(((worldPoint.x / BOARD_WIDTH) * BASE_WIDTH).toFixed(1)),
    y: Number((((worldPoint.y - MAP_OFFSET_Y) / BOARD_HEIGHT) * BASE_HEIGHT).toFixed(1)),
  };
}

function normalize(vec) {
  const len = Math.hypot(vec.x, vec.y) || 1;
  return { x: vec.x / len, y: vec.y / len, len };
}

function buildTangent(path, index) {
  const prev = path[Math.max(0, index - 1)];
  const next = path[Math.min(path.length - 1, index + 1)];
  return normalize({ x: next.x - prev.x, y: next.y - prev.y });
}

function suggestPointsFromImage(worldPath, image, transform, scanRadius, scanStep) {
  const suggestions = [];

  for (let i = 0; i < worldPath.length; i += 1) {
    const anchor = worldPath[i];
    const tangent = buildTangent(worldPath, i);
    const normal = { x: -tangent.y, y: tangent.x };

    let best = {
      score: -Infinity,
      offset: 0,
      imagePoint: boardToImage(anchor, transform),
      boardPoint: { ...anchor },
      pixel: null,
    };

    for (let s = -scanRadius; s <= scanRadius; s += scanStep) {
      const candidateBoard = {
        x: anchor.x + (normal.x * s),
        y: anchor.y + (normal.y * s),
      };
      const candidateImage = boardToImage(candidateBoard, transform);
      const pixel = getPixel(image, candidateImage.x, candidateImage.y);
      if (!pixel) {
        continue;
      }
      const score = roadScore(pixel);
      if (score > best.score) {
        best = {
          score,
          offset: s,
          imagePoint: candidateImage,
          boardPoint: candidateBoard,
          pixel,
        };
      }
    }

    suggestions.push({
      index: i,
      original: anchor,
      suggested: best.boardPoint,
      bestOffsetPx: best.offset,
      bestScore: Number(best.score.toFixed(3)),
      imagePoint: {
        x: Number(best.imagePoint.x.toFixed(2)),
        y: Number(best.imagePoint.y.toFixed(2)),
      },
      pixel: best.pixel,
    });
  }

  // Preserve exact endpoints so spawn/core anchors stay stable.
  suggestions[0].suggested = { ...worldPath[0] };
  suggestions[suggestions.length - 1].suggested = { ...worldPath[worldPath.length - 1] };

  return suggestions;
}

function movingAverage(points, radius = 1) {
  return points.map((_, index) => {
    if (index === 0 || index === points.length - 1) {
      return points[index];
    }

    let count = 0;
    let sumX = 0;
    let sumY = 0;

    for (let i = Math.max(0, index - radius); i <= Math.min(points.length - 1, index + radius); i += 1) {
      sumX += points[i].x;
      sumY += points[i].y;
      count += 1;
    }

    return {
      x: sumX / count,
      y: sumY / count,
    };
  });
}

function formatPointBlock(basePoints) {
  return basePoints
    .map((p) => `      { x: ${Math.round(p.x)}, y: ${Math.round(p.y)} },`)
    .join('\n');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = process.cwd();

  const gameFilePath = path.resolve(root, args.gameFile);
  const imagePath = path.resolve(root, args.image);
  const outputPath = path.resolve(root, args.output);

  const gameSource = fs.readFileSync(gameFilePath, 'utf8');
  const basePoints = extractTemplatePoints(gameSource, args.layoutId);
  const worldPath = toWorldPath(basePoints);

  const image = decodeJpeg(imagePath);
  const transform = computeMapTransform(image.width, image.height, args.zoom);

  const rawSuggestions = suggestPointsFromImage(worldPath, image, transform, args.scanRadius, args.scanStep);
  const suggestedWorldPoints = rawSuggestions.map((item) => item.suggested);
  const smoothedWorldPoints = movingAverage(suggestedWorldPoints, 1);
  smoothedWorldPoints[0] = { ...worldPath[0] };
  smoothedWorldPoints[smoothedWorldPoints.length - 1] = { ...worldPath[worldPath.length - 1] };

  const suggestedBasePoints = smoothedWorldPoints.map(toBasePoint);

  const report = {
    generatedAt: new Date().toISOString(),
    layoutId: args.layoutId,
    input: {
      gameFile: args.gameFile,
      image: args.image,
      zoom: args.zoom,
      scanRadius: args.scanRadius,
      scanStep: args.scanStep,
    },
    board: {
      baseWidth: BASE_WIDTH,
      baseHeight: BASE_HEIGHT,
      boardWidth: BOARD_WIDTH,
      boardHeight: BOARD_HEIGHT,
      mapOffsetY: MAP_OFFSET_Y,
    },
    transform,
    originalBasePoints: basePoints,
    suggestedBasePoints,
    pointAnalysis: rawSuggestions.map((p, idx) => ({
      index: idx,
      originalBoard: {
        x: Number(p.original.x.toFixed(2)),
        y: Number(p.original.y.toFixed(2)),
      },
      suggestedBoard: {
        x: Number(smoothedWorldPoints[idx].x.toFixed(2)),
        y: Number(smoothedWorldPoints[idx].y.toFixed(2)),
      },
      bestOffsetPx: p.bestOffsetPx,
      bestScore: p.bestScore,
      imagePoint: p.imagePoint,
      pixel: p.pixel,
    })),
    suggestedPointBlock: formatPointBlock(suggestedBasePoints),
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

  console.log('Wrote:', path.relative(root, outputPath));
  console.log('Layout:', args.layoutId, '- points:', suggestedBasePoints.length);
  console.log('Suggested point block:');
  console.log(report.suggestedPointBlock);
}

main();
