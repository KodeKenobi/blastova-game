const STORAGE_KEY = 'tdFirstRunTutorialV1';

const NAV_STEP_COUNT = 4;

const STEPS = [
  {
    title: 'GET STARTED',
    copy: 'Tap GAME OPTIONS.',
    target: '[data-onboarding-target="game-options-btn"]',
  },
  {
    title: 'CHOOSE YOUR ROLE',
    copy: 'Tap PLAY DEFEND.',
    target: '[data-onboarding-target="play-defend-btn"]',
    cardAbove: '.ws-front-role-choice-row',
  },
  {
    title: 'PICK YOUR MATCH',
    copy: 'Tap VS for Versus AI.',
    target: '[data-onboarding-target="vs-ai-btn"]',
    cardAbove: '.ws-front-mode-row',
  },
  {
    title: 'CHOOSE A MAP',
    copy: 'Tap the first map to begin.',
    target: '[data-onboarding-target="world-1-card"]',
  },
  {
    title: 'ARM YOUR WEAPON',
    copy: 'Tap a weapon below to arm it.',
    target: '#ht-weapon-tray, [data-hud="weapon-tray"]',
  },
  {
    title: 'PLACE IT',
    copy: 'Tap the map to deploy it.',
    target: '#game-container',
  },
  {
    title: 'READY UP',
    copy: 'Tap START WAVE.',
    target: '[data-hud-action="start-or-pause"], #start-wave-btn',
  },
];

let state = null;
let root = null;
let spotlight = null;
let card = null;
let title = null;
let copy = null;
let actionButton = null;
let skipButton = null;
let keyHandler = null;
let resizeHandler = null;
let trackedTarget = null;
let trackingRaf = null;

function readState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      completed: parsed.completed === true,
      step: Math.max(0, Math.min(STEPS.length - 1, Number(parsed.step) || 0)),
    };
  } catch (_) {
    return { completed: false, step: 0 };
  }
}

function writeState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
}

function eligible() {
  if (window.__landingAttractMode === true) return false;
  const scene = window.__tdScene;
  if (scene?.isMultiplayerModeEnabled?.()) return false;
  // Steps before gameplay starts (nav phase) only need the mode not to be locked in yet.
  if (!state || state.step < NAV_STEP_COUNT) return true;
  // Onboarding only runs on the real first-match path: Play Defend vs AI, World 1.
  const mode = scene?.gameState?.selectedMode;
  if (mode && mode !== 'singleplayer' && mode !== 'vsAiDefense') return false;
  if ((scene?.gameState?.selectedWorldIndex || 0) !== 0) return false;
  return true;
}

function findTarget(selector) {
  if (!selector) return null;
  return selector.split(',').map((part) => part.trim()).map((part) => document.querySelector(part)).find(Boolean) || null;
}

function updateSpotlight() {
  if (!root || root.style.display === 'none') return;
  const step = STEPS[state.step];
  const target = findTarget(step.target);
  if (target !== trackedTarget) cleanupTarget();
  trackedTarget = target;
  if (!target) {
    spotlight.style.display = 'none';
    return;
  }
  const rect = target.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    spotlight.style.display = 'none';
    return;
  }
  spotlight.style.display = 'block';
  spotlight.style.left = `${Math.max(6, rect.left - 10)}px`;
  spotlight.style.top = `${Math.max(6, rect.top - 10)}px`;
  spotlight.style.width = `${rect.width + 20}px`;
  spotlight.style.height = `${rect.height + 20}px`;
  if (getComputedStyle(target).position === 'static') {
    target.style.position = 'relative';
  }
  target.style.zIndex = '601';
  const cardRect = card.getBoundingClientRect();
  const gap = 18;
  const aboveContainer = step.cardAbove ? findTarget(step.cardAbove) : null;
  if (aboveContainer) {
    const containerRect = aboveContainer.getBoundingClientRect();
    const left = containerRect.left + (containerRect.width - cardRect.width) / 2;
    const top = containerRect.top - cardRect.height - gap;
    card.style.left = `${Math.max(16, Math.min(window.innerWidth - cardRect.width - 16, left))}px`;
    card.style.top = `${Math.max(16, top)}px`;
    card.style.transform = 'none';
    return;
  }
  const left = rect.left > window.innerWidth * 0.55
    ? rect.left - cardRect.width - gap
    : rect.right + gap;
  const top = Math.max(16, Math.min(window.innerHeight - cardRect.height - 16, rect.top));
  card.style.left = `${Math.max(16, Math.min(window.innerWidth - cardRect.width - 16, left))}px`;
  card.style.top = `${top}px`;
  card.style.transform = 'none';
}

function render() {
  const step = STEPS[state.step];
  title.textContent = step.title;
  copy.textContent = step.copy;
  actionButton.style.display = 'none';
  root.style.display = 'flex';
  card.style.left = '50%';
  card.style.top = '50%';
  card.style.transform = 'translate(-50%, -50%)';
  updateSpotlight();
  startTracking();
}

function startTracking() {
  if (trackingRaf) return;
  const loop = () => {
    if (!root || root.style.display === 'none') {
      trackingRaf = null;
      return;
    }
    updateSpotlight();
    trackingRaf = requestAnimationFrame(loop);
  };
  trackingRaf = requestAnimationFrame(loop);
}

function stopTracking() {
  if (trackingRaf) cancelAnimationFrame(trackingRaf);
  trackingRaf = null;
}

function cleanupTarget() {
  if (trackedTarget) {
    trackedTarget.style.zIndex = '';
    if (trackedTarget.style.position === 'relative') trackedTarget.style.position = '';
  }
  trackedTarget = null;
}

function close() {
  stopTracking();
  cleanupTarget();
  if (root) root.style.display = 'none';
}

function finish() {
  state.completed = true;
  writeState();
  close();
  window.dispatchEvent(new CustomEvent('blastova:onboarding-complete'));
}

function confirmSkip() {
  title.textContent = 'SKIP TUTORIAL?';
  copy.textContent = 'You can restart the tutorial later from Settings.';
  actionButton.style.display = '';
  actionButton.textContent = 'SKIP';
  actionButton.onclick = finish;
  skipButton.textContent = 'KEEP TUTORIAL';
  skipButton.onclick = render;
  spotlight.style.display = 'none';
}

function notify(eventName) {
  if (eventName === 'tutorial-restart') {
    if (!state) return;
    state = { completed: false, step: 0 };
    writeState();
    if (!eligible()) return;
    render();
    return;
  }
  if (!state || state.completed || !eligible()) return;
  if (eventName === 'session-mode') {
    close();
    return;
  }
  if (eventName === 'gameplay-ready') {
    render();
    return;
  }
  if (eventName === 'turret-selected' && state.step === NAV_STEP_COUNT) {
    state.step = NAV_STEP_COUNT + 1;
    writeState();
    render();
  } else if (eventName === 'turret-placed' && state.step <= NAV_STEP_COUNT + 1) {
    state.step = NAV_STEP_COUNT + 2;
    writeState();
    render();
  } else if (eventName === 'wave-started' && state.step === NAV_STEP_COUNT + 2) {
    finish();
  }
}

function handleNavClick(event) {
  if (!state || state.completed || state.step >= NAV_STEP_COUNT) return;
  if (window.__landingAttractMode === true) return;
  const target = event.target.closest?.('[data-onboarding-target]');
  if (!target) return;
  const id = target.getAttribute('data-onboarding-target');
  if (id === 'play-attack-btn' || id === 'one-v-one-btn') {
    // Player chose a different path — hide until they land back on the guided route.
    close();
    return;
  }
  const expected = STEPS[state.step].target;
  if (!expected || !expected.includes(id)) return;
  state.step += 1;
  writeState();
  if (state.step < NAV_STEP_COUNT) {
    render();
  } else {
    close();
  }
}

function addRestartControl() {
  const footer = document.querySelector('#settings-overlay .sp-footer');
  if (!footer || document.getElementById('settingsTutorialRestartBtn')) return;
  const button = document.createElement('button');
  button.id = 'settingsTutorialRestartBtn';
  button.className = 'sp-btn';
  button.textContent = 'Restart Tutorial';
  button.addEventListener('click', () => {
    window.__hideSettings?.();
    notify('tutorial-restart');
  });
  footer.insertBefore(button, footer.firstChild);
}

function mount() {
  root = document.createElement('div');
  root.id = 'blastova-onboarding';
  root.innerHTML = `
    <div class="blastova-onboarding-spotlight"></div>
    <section class="blastova-onboarding-card" role="dialog" aria-modal="true">
      <div class="blastova-onboarding-kicker">TACTICAL BRIEFING</div>
      <h2 class="blastova-onboarding-title"></h2>
      <p class="blastova-onboarding-copy"></p>
      <div class="blastova-onboarding-actions">
        <button type="button" class="blastova-onboarding-skip">SKIP TUTORIAL</button>
        <button type="button" class="blastova-onboarding-action"></button>
      </div>
    </section>`;
  document.body.appendChild(root);
  spotlight = root.querySelector('.blastova-onboarding-spotlight');
  card = root.querySelector('.blastova-onboarding-card');
  title = root.querySelector('.blastova-onboarding-title');
  copy = root.querySelector('.blastova-onboarding-copy');
  actionButton = root.querySelector('.blastova-onboarding-action');
  skipButton = root.querySelector('.blastova-onboarding-skip');
  skipButton.addEventListener('click', confirmSkip);
  resizeHandler = updateSpotlight;
  window.addEventListener('resize', resizeHandler);
  keyHandler = (event) => {
    if (!root || root.style.display === 'none') return;
    if (event.key === 'Escape') confirmSkip();
  };
  document.addEventListener('keydown', keyHandler);
  document.addEventListener('click', handleNavClick, true);

  const style = document.createElement('style');
  style.textContent = `
    #blastova-onboarding { position: fixed; inset: 0; z-index: 600; display: none; align-items: center; justify-content: center; pointer-events: none; padding: max(18px, env(safe-area-inset-top)) max(18px, env(safe-area-inset-right)) max(18px, env(safe-area-inset-bottom)) max(18px, env(safe-area-inset-left)); font-family: 'BlackOpsOne', monospace; }
    .blastova-onboarding-spotlight { position: fixed; display: none; pointer-events: none; border: 2px solid #b6a36a; box-shadow: 0 0 0 9999px rgba(0, 0, 0, .62), 0 0 14px rgba(182, 163, 106, .5); }
    .blastova-onboarding-card { position: fixed; width: min(240px, 70vw); padding: 10px 14px 10px; pointer-events: auto; color: #ded8bb; text-align: left; background: linear-gradient(165deg, #4a4b2d, #171a12 72%); border: 2px solid #77724a; box-shadow: 0 4px 0 rgba(0, 0, 0, .5), inset 0 0 0 2px #282b1b; }
    .blastova-onboarding-kicker { display: none; }
    .blastova-onboarding-title { margin: 0 0 4px; color: #f0e7c8; font-size: 13px; letter-spacing: 1px; text-shadow: 1px 1px 0 #10130e; }
    .blastova-onboarding-copy { margin: 0 0 8px; color: #c8c3a8; font-family: 'Teko', 'Trebuchet MS', sans-serif; font-size: 14px; line-height: 1.1; }
    .blastova-onboarding-actions { display: flex; justify-content: flex-start; gap: 8px; flex-wrap: wrap; }
    .blastova-onboarding-actions button { min-height: 32px; padding: 0 12px; font-family: inherit; font-size: 9px; letter-spacing: .5px; border: 1px solid #a39461; cursor: pointer; }
    .blastova-onboarding-action { color: #17180f; background: #c2b280; }
    .blastova-onboarding-skip { color: #c8c3a8; background: #292c1d; border-color: #5e6043 !important; }
  `;
  document.head.appendChild(style);
}

export function initOnboarding() {
  if (typeof window === 'undefined') return;
  if (!root) mount();
  state = readState();
  addRestartControl();
  window.__blastovaOnboarding = { notify };
  if (!state.completed && state.step < NAV_STEP_COUNT && eligible()) render();
  // Gameplay steps are shown later via the 'gameplay-ready' event, once the player is actually in a match.
}
