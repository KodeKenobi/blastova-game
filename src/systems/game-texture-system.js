import { TERRAIN_TILE_SIZE } from './game-config-constants';
import { WEAPON_LIBRARY } from './game-weapon-data';

export function createTextures() {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    const createSingleFrameTexture = (sourceKey, targetKey, frameWidth = 128, frameHeight = 128, frameIndex = 0) => {
      const sourceTexture = this.textures.get(sourceKey);
      const sourceImage = sourceTexture?.getSourceImage();
      if (!sourceImage) {
        return;
      }

      if (this.textures.exists(targetKey)) {
        this.textures.remove(targetKey);
      }

      const texture = this.textures.createCanvas(targetKey, frameWidth, frameHeight);
      const context = texture.getSourceImage().getContext('2d');
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, frameWidth, frameHeight);
      context.drawImage(
        sourceImage,
        frameIndex * frameWidth,
        0,
        frameWidth,
        frameHeight,
        0,
        0,
        frameWidth,
        frameHeight
      );
      texture.refresh();
    };

    const createWeaponPreviewTexture = (sourceKey, targetKey) => {
      const sourceTexture = this.textures.get(sourceKey);
      const sourceImage = sourceTexture?.getSourceImage();
      if (!sourceImage) {
        return;
      }

      if (this.textures.exists(targetKey)) {
        this.textures.remove(targetKey);
      }

      const texture = this.textures.createCanvas(targetKey, 96, 96);
      const context = texture.getSourceImage().getContext('2d');
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, 96, 96);
      context.drawImage(
        sourceImage,
        30,
        14,
        68,
        92,
        16,
        4,
        64,
        86
      );
      texture.refresh();
    };

    const createSingleFrameTextureFromAtlas = (atlasKey, frameKey, targetKey, outputSize = 128) => {
      const frame = this.textures.getFrame(atlasKey, frameKey);
      if (!frame) {
        return;
      }

      if (this.textures.exists(targetKey)) {
        this.textures.remove(targetKey);
      }

      const texture = this.textures.createCanvas(targetKey, outputSize, outputSize);
      const context = texture.getSourceImage().getContext('2d');
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, outputSize, outputSize);
      context.drawImage(
        frame.source.image,
        frame.cutX,
        frame.cutY,
        frame.cutWidth,
        frame.cutHeight,
        0,
        0,
        outputSize,
        outputSize
      );
      texture.refresh();
    };

    const createTowerTileTexture = (sourceKey, targetKey, col, row) => {
      const tileSize = 128;
      const sourceTexture = this.textures.get(sourceKey);
      const sourceImage = sourceTexture?.getSourceImage();
      if (!sourceImage) {
        return;
      }

      if (this.textures.exists(targetKey)) {
        this.textures.remove(targetKey);
      }

      const texture = this.textures.createCanvas(targetKey, tileSize, tileSize);
      const context = texture.getSourceImage().getContext('2d');
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, tileSize, tileSize);
      context.drawImage(
        sourceImage,
        col * tileSize,
        row * tileSize,
        tileSize,
        tileSize,
        0,
        0,
        tileSize,
        tileSize
      );
      texture.refresh();
    };

    const initialTheme = this.activeVisualTheme || this.getThemeVariantForLevel(1);
    this.activeVisualTheme = initialTheme;
    createTowerTileTexture('gsTowerSheetBlank_' + initialTheme, 'gsBaseBlank', 0, 0);
    createTowerTileTexture('gsTowerSheetGrass_' + initialTheme, 'gsBaseGrass', 0, 1);
    createTowerTileTexture('gsTowerSheetBlank_' + initialTheme, 'gsConnStartBlank', 1, 0);
    createTowerTileTexture('gsTowerSheetBlank_' + initialTheme, 'gsConnMidBlank', 2, 0);
    createTowerTileTexture('gsTowerSheetBlank_' + initialTheme, 'gsConnTBlank', 3, 0);
    createTowerTileTexture('gsTowerSheetGrass_' + initialTheme, 'gsConnStartGrass', 1, 1);
    createTowerTileTexture('gsTowerSheetGrass_' + initialTheme, 'gsConnMidGrass', 2, 1);
    createTowerTileTexture('gsTowerSheetGrass_' + initialTheme, 'gsConnTGrass', 3, 1);
    WEAPON_LIBRARY.forEach((weapon) => {
      if (typeof weapon.atlasFrame === 'number') {
        createSingleFrameTextureFromAtlas('gsWeaponsAtlas_' + initialTheme, weapon.atlasFrame, weapon.textureKey);
      } else {
        createSingleFrameTexture(weapon.sourceKey + '_' + initialTheme, weapon.textureKey);
      }
      createWeaponPreviewTexture(weapon.textureKey, weapon.textureKey + 'Preview');
    });

    graphics.fillStyle(0x162038, 1);
    graphics.fillCircle(36, 36, 30);
    graphics.fillStyle(0x263c6b, 1);
    graphics.fillCircle(36, 36, 22);
    graphics.fillStyle(0x77f2ff, 0.95);
    graphics.fillCircle(36, 36, 12);
    graphics.fillStyle(0xeafcff, 1);
    graphics.fillCircle(36, 36, 5);
    graphics.fillStyle(0x08101d, 1);
    graphics.fillRoundedRect(30, 8, 12, 28, 5);
    graphics.generateTexture('tower', 72, 72);
    graphics.clear();

    graphics.fillStyle(0x1a1f3f, 1);
    graphics.fillCircle(36, 36, 30);
    graphics.fillStyle(0x3a4f9b, 1);
    graphics.fillCircle(36, 36, 22);
    graphics.fillStyle(0x9bb3ff, 0.95);
    graphics.fillCircle(36, 36, 12);
    graphics.fillStyle(0xf3f7ff, 1);
    graphics.fillCircle(36, 36, 5);
    graphics.fillStyle(0x111736, 1);
    graphics.fillRoundedRect(30, 6, 12, 30, 5);
    graphics.fillStyle(0x2f3c73, 1);
    graphics.fillRoundedRect(18, 40, 36, 7, 3);
    graphics.generateTexture('towerMk2', 72, 72);
    graphics.clear();

    graphics.fillStyle(0x122f2e, 1);
    graphics.fillCircle(36, 36, 30);
    graphics.fillStyle(0x1f6662, 1);
    graphics.fillCircle(36, 36, 22);
    graphics.fillStyle(0x7af0df, 0.96);
    graphics.fillCircle(36, 36, 11);
    graphics.fillStyle(0xeffffc, 1);
    graphics.fillCircle(36, 36, 4);
    graphics.fillStyle(0x0b201f, 1);
    graphics.fillRoundedRect(30, 6, 12, 32, 5);
    graphics.fillStyle(0x22524f, 1);
    graphics.fillRoundedRect(18, 42, 36, 6, 3);
    graphics.fillStyle(0x9bf7ec, 0.72);
    graphics.fillCircle(18, 45, 3);
    graphics.fillCircle(54, 45, 3);
    graphics.generateTexture('towerMk3', 72, 72);
    graphics.clear();

    graphics.fillStyle(0x3d0915, 1);
    graphics.fillCircle(22, 22, 18);
    graphics.fillStyle(0xca304e, 1);
    graphics.fillCircle(22, 22, 14);
    graphics.fillStyle(0xff8ca0, 0.95);
    graphics.fillCircle(22, 22, 7);
    graphics.fillStyle(0x160208, 1);
    graphics.fillCircle(17, 18, 3);
    graphics.fillCircle(27, 18, 3);
    graphics.fillStyle(0xffffff, 0.8);
    graphics.fillCircle(14, 12, 4);
    graphics.generateTexture('enemy', 44, 44);
    graphics.clear();

    graphics.fillStyle(0x141b2d, 1);
    graphics.fillRoundedRect(2, 7, 52, 22, 7);
    graphics.fillStyle(0x2f436d, 1);
    graphics.fillRoundedRect(8, 10, 36, 16, 5);
    graphics.fillStyle(0x9edcff, 0.9);
    graphics.fillRoundedRect(16, 12, 14, 8, 3);
    graphics.fillStyle(0x0b0f19, 1);
    graphics.fillCircle(12, 29, 5);
    graphics.fillCircle(44, 29, 5);
    graphics.fillStyle(0x6e7fa6, 0.7);
    graphics.fillRect(3, 15, 4, 6);
    graphics.fillRect(49, 15, 4, 6);
    graphics.generateTexture('enemyVehicleA', 56, 34);
    graphics.clear();

    graphics.fillStyle(0x2c1822, 1);
    graphics.fillRoundedRect(2, 7, 52, 22, 7);
    graphics.fillStyle(0x7a2f4f, 1);
    graphics.fillRoundedRect(8, 10, 36, 16, 5);
    graphics.fillStyle(0xffc9db, 0.9);
    graphics.fillRoundedRect(15, 12, 14, 8, 3);
    graphics.fillStyle(0x120a0f, 1);
    graphics.fillCircle(12, 29, 5);
    graphics.fillCircle(44, 29, 5);
    graphics.fillStyle(0xb95b82, 0.7);
    graphics.fillRect(3, 15, 4, 6);
    graphics.fillRect(49, 15, 4, 6);
    graphics.generateTexture('enemyVehicleB', 56, 34);
    graphics.clear();

    graphics.fillStyle(0xffff00, 1);
    graphics.fillRoundedRect(3, 4, 16, 6, 2);
    graphics.fillStyle(0xffff99, 1);
    graphics.fillRoundedRect(6, 5, 10, 4, 1.5);
    graphics.fillStyle(0xffffff, 0.95);
    graphics.fillTriangle(19, 4, 24, 7, 19, 10);
    graphics.fillStyle(0xffcc00, 0.82);
    graphics.fillRect(1, 5, 3, 4);
    graphics.generateTexture('projectile', 24, 14);
    graphics.clear();

    createSingleFrameTexture('foozleProjectileBallisticSource', 'projectileBallisticSprite', 32, 32, 0);
    createSingleFrameTexture('foozleProjectileRocketSource', 'projectileRocketSprite', 96, 96, 0);
    createSingleFrameTexture('foozleProjectileEnergySource', 'projectileEnergySprite', 40, 37, 0);

    graphics.fillStyle(0x6f7786, 1);
    graphics.fillRoundedRect(2, 3, 18, 6, 2);
    graphics.fillStyle(0xadb8cf, 1);
    graphics.fillRoundedRect(14, 4, 7, 4, 1.5);
    graphics.fillStyle(0xff8652, 1);
    graphics.fillTriangle(2, 6, -6, 2, -6, 10);
    graphics.fillStyle(0xffd8a8, 0.9);
    graphics.fillTriangle(1, 6, -3, 4, -3, 8);
    graphics.generateTexture('rocketProjectile', 24, 12);
    graphics.clear();

    graphics.fillStyle(0xff9944, 1);
    graphics.fillEllipse(8, 8, 14, 7);
    graphics.fillStyle(0xffcc88, 0.9);
    graphics.fillEllipse(6, 8, 6, 4);
    graphics.generateTexture('enemyProjectile', 16, 16);
    graphics.clear();

    graphics.fillStyle(0xffcb84, 0.95);
    graphics.fillEllipse(12, 8, 20, 10);
    graphics.fillStyle(0xfff0cf, 0.9);
    graphics.fillEllipse(9, 8, 9, 5);
    graphics.generateTexture('muzzleBallistic', 24, 16);
    graphics.clear();

    graphics.fillStyle(0xff9c5c, 0.95);
    graphics.fillTriangle(24, 8, 2, 2, 2, 14);
    graphics.fillStyle(0xffdfb6, 0.88);
    graphics.fillTriangle(20, 8, 6, 4, 6, 12);
    graphics.generateTexture('muzzleRocket', 26, 16);
    graphics.clear();

    graphics.fillStyle(0x9ee8ff, 0.94);
    graphics.fillTriangle(10, 0, 20, 10, 10, 20);
    graphics.fillTriangle(0, 10, 10, 0, 10, 20);
    graphics.fillStyle(0xefffff, 0.78);
    graphics.fillCircle(10, 10, 4);
    graphics.generateTexture('muzzleEnergy', 20, 20);
    graphics.clear();

    graphics.fillStyle(0xffd29a, 0.62);
    graphics.fillRoundedRect(0, 0, 14, 5, 2);
    graphics.generateTexture('trailBallistic', 14, 5);
    graphics.clear();

    graphics.fillStyle(0x95deff, 0.55);
    graphics.fillEllipse(8, 8, 12, 12);
    graphics.fillStyle(0xe4ffff, 0.46);
    graphics.fillEllipse(8, 8, 7, 7);
    graphics.generateTexture('trailEnergy', 16, 16);
    graphics.clear();

    graphics.fillStyle(0xb9c6d8, 0.42);
    graphics.fillCircle(8, 8, 6);
    graphics.fillStyle(0xdce6f4, 0.3);
    graphics.fillCircle(8, 8, 3);
    graphics.generateTexture('trailRocket', 16, 16);
    graphics.clear();

    graphics.fillStyle(0x132134, 1);
    graphics.fillCircle(48, 48, 40);
    graphics.lineStyle(6, 0x33597f, 0.9);
    graphics.strokeCircle(48, 48, 34);
    graphics.fillStyle(0x7bf7ff, 0.18);
    graphics.fillCircle(48, 48, 24);
    graphics.fillStyle(0x99ffff, 0.32);
    graphics.fillCircle(48, 48, 8);
    graphics.generateTexture('pad', 96, 96);
    graphics.clear();

    graphics.fillStyle(0x0b1320, 0.45);
    graphics.fillEllipse(36, 18, 52, 20);
    graphics.generateTexture('shadow', 72, 36);
    graphics.clear();

    for (let i = 0; i < 28; i++) {
      for (let j = 0; j < 28; j++) {
        const tone = 0x213622 + ((i + j) % 4) * 0x030300;
        graphics.fillStyle(tone, 0.82);
        graphics.fillRect(i * 4, j * 4, 4, 4);
      }
    }
    graphics.fillStyle(0x2d4528, 0.24);
    graphics.fillCircle(54, 42, 24);
    graphics.fillCircle(30, 70, 18);
    graphics.fillStyle(0x1a2d1c, 0.2);
    graphics.fillCircle(76, 90, 22);
    graphics.generateTexture('grassTile', 112, 112);
    graphics.clear();

    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 24; j++) {
        const tone = 0x3f3324 + ((i * 2 + j) % 5) * 0x020100;
        graphics.fillStyle(tone, 0.84);
        graphics.fillRect(i * 4, j * 4, 4, 4);
      }
    }
    graphics.fillStyle(0x5a4530, 0.18);
    graphics.fillEllipse(48, 40, 70, 28);
    graphics.fillStyle(0x2f2418, 0.18);
    graphics.fillEllipse(62, 70, 48, 20);
    graphics.generateTexture('dirtTile', 96, 96);
    graphics.clear();

    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 20; j++) {
        const tone = 0x4d525b + ((i + j * 3) % 6) * 0x010101;
        graphics.fillStyle(tone, 0.9);
        graphics.fillRect(i * 4, j * 4, 4, 4);
      }
    }
    graphics.fillStyle(0x71767e, 0.24);
    graphics.fillCircle(30, 24, 18);
    graphics.fillCircle(68, 56, 14);
    graphics.fillStyle(0x2a3039, 0.24);
    graphics.fillCircle(50, 68, 12);
    graphics.generateTexture('rockTile', 80, 80);
    graphics.clear();

    for (let i = 0; i < 28; i++) {
      for (let j = 0; j < 18; j++) {
        const tone = 0x1f727f + ((i + j) % 4) * 0x010608;
        graphics.fillStyle(tone, 0.66);
        graphics.fillRect(i * 4, j * 4, 4, 4);
      }
    }
    graphics.fillStyle(0x7bd3ea, 0.16);
    graphics.fillEllipse(52, 26, 72, 18);
    graphics.fillEllipse(66, 52, 48, 14);
    graphics.generateTexture('waterTile', 112, 72);
    graphics.clear();

    graphics.fillStyle(0x6d737a, 1);
    graphics.fillRect(0, 0, 52, 22);
    graphics.fillStyle(0x8a9097, 0.55);
    graphics.fillRect(0, 1, 52, 2);
    graphics.fillStyle(0x525962, 0.7);
    graphics.fillRect(0, 19, 52, 2);
    for (let i = 0; i < 18; i++) {
      const x = 3 + (i * 11) % 48;
      const y = 4 + (i * 7) % 14;
      graphics.fillStyle(i % 2 === 0 ? 0x7d838a : 0x5f666e, 0.28);
      graphics.fillCircle(x, y, i % 3 === 0 ? 1.8 : 1.2);
    }
    graphics.generateTexture('pathTopTile', 52, 22);
    graphics.clear();

    graphics.fillStyle(0x434952, 1);
    graphics.fillRect(0, 0, 52, 18);
    graphics.fillStyle(0x2e343d, 0.88);
    graphics.fillRect(0, 14, 52, 2);
    graphics.fillStyle(0x69707b, 0.35);
    graphics.fillRect(0, 1, 52, 1);
    for (let i = 0; i < 10; i++) {
      const x = 4 + (i * 9) % 46;
      const y = 4 + (i * 5) % 9;
      graphics.fillStyle(0x59606a, 0.18);
      graphics.fillCircle(x, y, 1.1);
    }
    graphics.generateTexture('pathSideTile', 52, 18);
    graphics.clear();

    graphics.fillStyle(0x20301e, 1);
    graphics.fillRect(20, 50, 8, 24);
    graphics.fillStyle(0x2f4e2c, 1);
    graphics.fillCircle(24, 44, 17);
    graphics.fillStyle(0x3f6939, 0.96);
    graphics.fillCircle(14, 46, 12);
    graphics.fillCircle(34, 46, 12);
    graphics.fillStyle(0x5b854a, 0.9);
    graphics.fillCircle(24, 32, 11);
    graphics.generateTexture('treeA', 48, 76);
    graphics.clear();

    graphics.fillStyle(0x263520, 1);
    graphics.fillRect(18, 50, 9, 24);
    graphics.fillStyle(0x355b31, 0.98);
    graphics.fillCircle(22, 42, 14);
    graphics.fillCircle(12, 46, 10);
    graphics.fillCircle(32, 46, 10);
    graphics.fillStyle(0x4a7640, 0.9);
    graphics.fillCircle(22, 30, 9);
    graphics.fillCircle(18, 36, 7);
    graphics.generateTexture('treeB', 44, 76);
    graphics.clear();

    graphics.fillStyle(0x21331f, 1);
    graphics.fillRect(21, 52, 7, 22);
    graphics.fillStyle(0x2e522b, 0.98);
    graphics.fillCircle(24, 44, 13);
    graphics.fillStyle(0x3f6a3a, 0.92);
    graphics.fillCircle(14, 46, 9);
    graphics.fillCircle(34, 46, 9);
    graphics.fillStyle(0x6f9259, 0.88);
    graphics.fillCircle(24, 34, 8);
    graphics.generateTexture('treeC', 48, 76);
    graphics.clear();

    graphics.fillStyle(0x2a3a29, 1);
    graphics.fillCircle(16, 16, 12);
    graphics.fillStyle(0x3e5a35, 0.9);
    graphics.fillCircle(26, 14, 10);
    graphics.fillCircle(22, 22, 10);
    graphics.generateTexture('shrub', 40, 34);
    graphics.clear();

    graphics.fillStyle(0x5a5f64, 0.98);
    graphics.fillCircle(18, 20, 14);
    graphics.fillStyle(0x767b81, 0.3);
    graphics.fillCircle(14, 15, 5);
    graphics.fillStyle(0x383e45, 0.24);
    graphics.fillCircle(22, 25, 6);
    graphics.generateTexture('boulder', 36, 38);
    graphics.clear();

    graphics.fillStyle(0x7a5f3e, 0.98);
    graphics.fillRoundedRect(0, 0, 28, 24, 3);
    graphics.fillStyle(0x5f472e, 0.42);
    graphics.fillRect(0, 8, 28, 2);
    graphics.fillRect(0, 16, 28, 2);
    graphics.fillStyle(0x8e724c, 0.4);
    graphics.fillRect(8, 0, 2, 24);
    graphics.fillRect(18, 0, 2, 24);
    graphics.generateTexture('crate', 28, 24);
    graphics.clear();

    graphics.fillStyle(0x6f5a3b, 0.98);
    graphics.fillCircle(10, 10, 8);
    graphics.fillStyle(0x8d7350, 0.4);
    graphics.fillCircle(8, 8, 3);
    graphics.generateTexture('stump', 20, 20);
    graphics.clear();

    graphics.fillStyle(0x6f5a3a, 0.96);
    graphics.fillRoundedRect(2, 2, 8, 22, 2);
    graphics.fillRoundedRect(16, 2, 8, 22, 2);
    graphics.fillStyle(0x8d7651, 0.88);
    graphics.fillRoundedRect(0, 7, 26, 4, 2);
    graphics.fillRoundedRect(0, 15, 26, 4, 2);
    graphics.generateTexture('fence', 26, 26);
    graphics.clear();

    graphics.fillStyle(0xead8b2, 0.26);
    graphics.fillEllipse(80, 80, 144, 88);
    graphics.fillStyle(0xb69a6d, 0.24);
    graphics.lineStyle(4, 0xdcc69d, 0.35);
    graphics.strokeEllipse(80, 80, 140, 84);
    graphics.generateTexture('shoreDecal', 160, 160);
    graphics.clear();
}

export function rebuildThemeVisualTextures(themeName) {
    const getOrCreateCanvasTexture = (targetKey, width, height) => {
      let texture = this.textures.get(targetKey);
      let sourceImage = texture?.getSourceImage?.();
      const hasCanvasSource = sourceImage && typeof sourceImage.getContext === 'function';

      if (!hasCanvasSource || sourceImage.width !== width || sourceImage.height !== height) {
        if (this.textures.exists(targetKey)) {
          this.textures.remove(targetKey);
        }
        texture = this.textures.createCanvas(targetKey, width, height);
        sourceImage = texture.getSourceImage();
      }

      return texture;
    };

    const createSingleFrameTexture = (sourceKey, targetKey, frameWidth = 128, frameHeight = 128, frameIndex = 0) => {
      const sourceTexture = this.textures.get(sourceKey);
      const sourceImage = sourceTexture?.getSourceImage();
      if (!sourceImage) {
        return;
      }

      const texture = getOrCreateCanvasTexture(targetKey, frameWidth, frameHeight);
      const context = texture.getSourceImage().getContext('2d');
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, frameWidth, frameHeight);
      context.drawImage(
        sourceImage,
        frameIndex * frameWidth,
        0,
        frameWidth,
        frameHeight,
        0,
        0,
        frameWidth,
        frameHeight
      );
      texture.refresh();
    };

    const createWeaponPreviewTexture = (sourceKey, targetKey) => {
      const sourceTexture = this.textures.get(sourceKey);
      const sourceImage = sourceTexture?.getSourceImage();
      if (!sourceImage) {
        return;
      }

      const texture = getOrCreateCanvasTexture(targetKey, 96, 96);
      const context = texture.getSourceImage().getContext('2d');
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, 96, 96);
      context.drawImage(
        sourceImage,
        30,
        14,
        68,
        92,
        16,
        4,
        64,
        86
      );
      texture.refresh();
    };

    const createSingleFrameTextureFromAtlas = (atlasKey, frameKey, targetKey, outputSize = 128) => {
      const frame = this.textures.getFrame(atlasKey, frameKey);
      if (!frame) {
        return;
      }

      const texture = getOrCreateCanvasTexture(targetKey, outputSize, outputSize);
      const context = texture.getSourceImage().getContext('2d');
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, outputSize, outputSize);
      context.drawImage(
        frame.source.image,
        frame.cutX,
        frame.cutY,
        frame.cutWidth,
        frame.cutHeight,
        0,
        0,
        outputSize,
        outputSize
      );
      texture.refresh();
    };

    const createTowerTileTexture = (sourceKey, targetKey, col, row) => {
      const tileSize = 128;
      const sourceTexture = this.textures.get(sourceKey);
      const sourceImage = sourceTexture?.getSourceImage();
      if (!sourceImage) {
        return;
      }

      const texture = getOrCreateCanvasTexture(targetKey, tileSize, tileSize);
      const context = texture.getSourceImage().getContext('2d');
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, tileSize, tileSize);
      context.drawImage(
        sourceImage,
        col * tileSize,
        row * tileSize,
        tileSize,
        tileSize,
        0,
        0,
        tileSize,
        tileSize
      );
      texture.refresh();
    };

    createTowerTileTexture('gsTowerSheetBlank_' + themeName, 'gsBaseBlank', 0, 0);
    createTowerTileTexture('gsTowerSheetGrass_' + themeName, 'gsBaseGrass', 0, 1);
    createTowerTileTexture('gsTowerSheetBlank_' + themeName, 'gsConnStartBlank', 1, 0);
    createTowerTileTexture('gsTowerSheetBlank_' + themeName, 'gsConnMidBlank', 2, 0);
    createTowerTileTexture('gsTowerSheetBlank_' + themeName, 'gsConnTBlank', 3, 0);
    createTowerTileTexture('gsTowerSheetGrass_' + themeName, 'gsConnStartGrass', 1, 1);
    createTowerTileTexture('gsTowerSheetGrass_' + themeName, 'gsConnMidGrass', 2, 1);
    createTowerTileTexture('gsTowerSheetGrass_' + themeName, 'gsConnTGrass', 3, 1);

    WEAPON_LIBRARY.forEach((weapon) => {
      if (typeof weapon.atlasFrame === 'number') {
        createSingleFrameTextureFromAtlas('gsWeaponsAtlas_' + themeName, weapon.atlasFrame, weapon.textureKey);
      } else {
        createSingleFrameTexture(weapon.sourceKey + '_' + themeName, weapon.textureKey);
      }
      createWeaponPreviewTexture(weapon.textureKey, weapon.textureKey + 'Preview');
    });

    this.activeVisualTheme = themeName;
    this.createEnemyAnimations();
}

export function createTerrainSubtextures(rowIndex) {
    const terrainTexture = this.textures.get('terrainSource');
    const sourceImage = terrainTexture?.getSourceImage();
    if (!sourceImage) {
      return;
    }

    const rowY = Phaser.Math.Clamp(rowIndex, 0, 4) * TERRAIN_TILE_SIZE;

    const createCropTexture = (key, cropX, cropY, cropWidth, cropHeight, width = cropWidth, height = cropHeight) => {
      if (this.textures.exists(key)) {
        this.textures.remove(key);
      }

      const texture = this.textures.createCanvas(key, width, height);
      const context = texture.getSourceImage().getContext('2d');
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, width, height);
      context.drawImage(
        sourceImage,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        width,
        height
      );
      texture.refresh();
    };

    const createRoadMaskTexture = (sourceKey, targetKey) => {
      const sourceTexture = this.textures.get(sourceKey);
      const sourceCanvas = sourceTexture?.getSourceImage();
      if (!sourceCanvas) {
        return;
      }

      if (this.textures.exists(targetKey)) {
        this.textures.remove(targetKey);
      }

      const width = sourceCanvas.width;
      const height = sourceCanvas.height;
      const maskedTexture = this.textures.createCanvas(targetKey, width, height);
      const ctx = maskedTexture.getSourceImage().getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(sourceCanvas, 0, 0);

      const image = ctx.getImageData(0, 0, width, height);
      const data = image.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const luminance = (r + g + b) / 3;
        const chroma = Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b);
        const isCoreRoad = luminance > 74 && luminance < 142 && chroma < 18;
        if (!isCoreRoad) {
          data[i + 3] = 0;
        } else if (luminance < 84 || luminance > 132) {
          data[i + 3] = Math.min(data[i + 3], 230);
        }
      }
      ctx.putImageData(image, 0, 0);
      maskedTexture.refresh();
    };

    // Use straight (col 3) + curve (col 4) from the active terrain row.
    createCropTexture('terrainRoadStrip', (3 * TERRAIN_TILE_SIZE) + 32, rowY, 64, TERRAIN_TILE_SIZE, 64, TERRAIN_TILE_SIZE);
    createCropTexture('terrainRoadCurve', 4 * TERRAIN_TILE_SIZE, rowY, TERRAIN_TILE_SIZE, TERRAIN_TILE_SIZE, TERRAIN_TILE_SIZE, TERRAIN_TILE_SIZE);
    createRoadMaskTexture('terrainRoadCurve', 'terrainRoadCurveMasked');

    // Keep one direct crop for fallback background tile.
    createCropTexture('terrainBgTile', 0, rowY, TERRAIN_TILE_SIZE, TERRAIN_TILE_SIZE, TERRAIN_TILE_SIZE, TERRAIN_TILE_SIZE);
}

