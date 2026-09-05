import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();

const gamePath = path.join(ROOT, 'src', 'game.js');
const hudPath = path.join(ROOT, 'public', 'hud.html');

const checks = [];

function addCheck(name, passed, details = '') {
  checks.push({ name, passed, details });
}

function regexCheck(source, name, regex, detailsOnFail) {
  addCheck(name, regex.test(source), detailsOnFail);
}

async function run() {
  const [gameSource, hudSource] = await Promise.all([
    readFile(gamePath, 'utf8'),
    readFile(hudPath, 'utf8'),
  ]);

  // Core feature wiring checks
  regexCheck(
    gameSource,
    'Player lightning trigger method exists',
    /triggerPlayerLightningFromControl\s*:\s*function\s*\(/,
    'Expected triggerPlayerLightningFromControl() in src/game.js'
  );

  regexCheck(
    gameSource,
    'Barrage gate exists in canTriggerPlayerLightning',
    /canTriggerPlayerLightning\s*:\s*function\s*\([\s\S]*?if\s*\(!this\.barrageLightningWindowOpen\)\s*\{[\s\S]*?return\s+false;[\s\S]*?\}/,
    'Expected canTriggerPlayerLightning() to block when barrage window is closed'
  );

  regexCheck(
    gameSource,
    'Barrage window computed from active barrage enemies or active barrage spawn step',
    /barrageEnemiesActive\s*=\s*activeWaveEnemies\.some\(\(enemy\)\s*=>\s*!!enemy\.getData\('isBarrage'\)\);[\s\S]*?barrageSpawningNow\s*=\s*!!\(spawningStep\s*&&\s*spawningStep\.isBarrage\);[\s\S]*?this\.barrageLightningWindowOpen\s*=\s*!this\.gameState\.prepPhase\s*&&\s*\(barrageEnemiesActive\s*\|\|\s*barrageSpawningNow\);/,
    'Expected update() to open barrage window from real barrage activity'
  );

  regexCheck(
    gameSource,
    'Spawned enemies carry barrage metadata',
    /enemy\.setData\('isBarrage',\s*!!spawnStep\?\.isBarrage\);[\s\S]*?enemy\.setData\('barrageTag',\s*spawnStep\?\.barrageTag\s*\|\|\s*null\);/,
    'Expected spawnEnemy() to tag enemies with barrage metadata'
  );

  regexCheck(
    gameSource,
    'Top control setup exists',
    /setupLightningBlobControl\s*:\s*function\s*\(/,
    'Expected setupLightningBlobControl() for top-trigger control'
  );

  regexCheck(
    gameSource,
    'Barrage status prompts manual trigger',
    /Trigger LIGHTNING when ready\./,
    'Expected barrage status message to prompt manual trigger'
  );

  // UI regression checks
  addCheck(
    'HUD lightning button removed',
    !/data-hud-action="lightning"/.test(hudSource),
    'public/hud.html should not contain a lightning button'
  );

  // Print report
  const failed = checks.filter((c) => !c.passed);
  const passed = checks.length - failed.length;

  console.log('Lightning Barrage Feature Test');
  console.log('Passed:', passed + '/' + checks.length);
  checks.forEach((c) => {
    console.log(`${c.passed ? 'PASS' : 'FAIL'} - ${c.name}`);
    if (!c.passed && c.details) {
      console.log('  ' + c.details);
    }
  });

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error('FAIL - Test runner crashed');
  console.error(error?.stack || error);
  process.exitCode = 1;
});
