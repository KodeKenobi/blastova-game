// Injects the world-select HTML overlay and its styles/logic into the page
import worldSelectHTML from './world-select.html?raw';
import {
  decodeMultiplayerInvite,
  encodeMultiplayerInvite,
  generateMultiplayerInviteQrSvg,
} from './utils/multiplayer-invite';
import {
  getSession,
  signInWithGoogle,
  signOut,
} from './systems/game-supabase-auth-system.js';

window.__tdDecodeMultiplayerInvite = decodeMultiplayerInvite;
window.__tdEncodeMultiplayerInvite = encodeMultiplayerInvite;
window.__tdGenerateMultiplayerInviteQrSvg = generateMultiplayerInviteQrSvg;
window.__tdAuthApi = {
  getSession,
  signInWithGoogle,
  signOut,
};

window.__tdReportWorldSelectionReady = () => {
  if (window.__tdWorldSelectionReadyReported || window.__tdWorldSelectionReadyReporting) return;
  window.__tdWorldSelectionReadyReporting = true;

  const report = () => {
    if (typeof window.BlastovaStartup?.worldSelectionReady !== 'function') return false;
    window.BlastovaStartup.worldSelectionReady();
    window.__tdWorldSelectionReadyReported = true;
    window.__tdWorldSelectionReadyReporting = false;
    return true;
  };

  if (report()) return;
  const readinessTimer = window.setInterval(() => {
    if (report()) window.clearInterval(readinessTimer);
  }, 250);
  window.setTimeout(() => {
    window.clearInterval(readinessTimer);
    window.__tdWorldSelectionReadyReporting = false;
  }, 10000);
};

if (!window.__tdButtonClickSoundBound) {
  window.__tdButtonClickSoundBound = true;
  document.addEventListener('click', (event) => {
    const control = event.target?.closest?.('button, [role="button"]');
    if (!control || control.disabled || control.getAttribute('aria-disabled') === 'true') return;
    const sound = new Audio('/assets/audio/button-click.wav');
    sound.volume = 0.45;
    void sound.play().catch(() => {});
  }, true);
}

const mount = document.getElementById('world-select-mount');
if (mount) {
  // Inject HTML (without script tags — we'll eval them separately)
  const parser = new DOMParser();
  const doc = parser.parseFromString(worldSelectHTML, 'text/html');

  // Inject styles
  doc.querySelectorAll('style').forEach(s => {
    document.head.appendChild(s.cloneNode(true));
  });

  // Inject the HTML structure
  const overlay = doc.getElementById('world-select-overlay');
  const existingOverlay = document.getElementById('world-select-overlay');
  if (overlay && !existingOverlay) {
    document.body.appendChild(overlay);
  }

  // Execute scripts
  doc.querySelectorAll('script').forEach(s => {
    const ns = document.createElement('script');
    ns.text = s.textContent;
    document.body.appendChild(ns);
  });

  // Phaser can finish creating its scene before this module's Supabase import
  // and HTML injection complete. Hand the already-created scene its UI now.
  if (window.__tdScene && typeof window.__showWorldSelect === 'function') {
    window.__tdScene.showWorldSelectionSplashScreen?.();
  }
}
