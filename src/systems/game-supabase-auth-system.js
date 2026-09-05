import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App as CapacitorApp } from '@capacitor/app';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '770862977930-k99t62t141m5dibvrks1lnmfbca162vg.apps.googleusercontent.com';
const NATIVE_OAUTH_REDIRECT_URL = 'com.kodekenobi.blastova://login-callback';

const existingClient = (typeof window !== 'undefined' && window.__blastovaSupabaseClient)
  ? window.__blastovaSupabaseClient
  : null;
export const supabase = existingClient || createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
if (typeof window !== 'undefined' && !window.__blastovaSupabaseClient) {
  window.__blastovaSupabaseClient = supabase;
}

function logAuthState(event, details = {}) {
  try {
    const page = (typeof window !== 'undefined' && window.location)
      ? window.location.pathname + window.location.search
      : 'unknown';
    console.log('[AuthFlow]', {
      event,
      page,
      loggedIn: !!window.__supabaseUserId,
      userId: window.__supabaseUserId || null,
      ...details,
    });
  } catch (_) {}
}

let oauthHashHydrationPromise = null;

function extractTokensFromUrlHash(hash) {
  const rawHash = String(hash || '').startsWith('#') ? String(hash).slice(1) : String(hash || '');
  const hashParams = new URLSearchParams(rawHash);
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

async function applyTokensToSession(accessToken, refreshToken) {
  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return !error;
}

let nativeDeepLinkListenerRegistered = false;

// Native (Android/iOS) apps load bundled assets from a local Capacitor origin,
// never the deployed web URL, and Google blocks OAuth inside embedded WebViews.
// So on native we open the OAuth flow in the system browser and listen for the
// app to be re-opened via a custom URL scheme carrying the session tokens.
function ensureNativeAuthDeepLinkListener() {
  if (nativeDeepLinkListenerRegistered || !Capacitor.isNativePlatform()) return;
  nativeDeepLinkListenerRegistered = true;
  CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
    if (!url || !url.startsWith(NATIVE_OAUTH_REDIRECT_URL)) return;
    logAuthState('native_deep_link_received');
    try {
      const fragmentIndex = url.indexOf('#');
      const tokens = fragmentIndex >= 0 ? extractTokensFromUrlHash(url.slice(fragmentIndex)) : null;
      if (tokens) {
        const applied = await applyTokensToSession(tokens.accessToken, tokens.refreshToken);
        logAuthState(applied ? 'native_deep_link_set_session_success' : 'native_deep_link_set_session_failed');
      } else {
        logAuthState('native_deep_link_missing_tokens');
      }
    } finally {
      try { await Browser.close(); } catch (_) {}
    }
  });
}

async function hydrateSessionFromOAuthHash() {
  if (typeof window === 'undefined' || !window.location?.hash) return false;
  const tokens = extractTokensFromUrlHash(window.location.hash);
  if (!tokens) return false;

  const applied = await applyTokensToSession(tokens.accessToken, tokens.refreshToken);
  if (!applied) {
    logAuthState('oauth_hash_set_session_failed');
    return false;
  }

  window.history.replaceState({}, '', window.location.pathname + window.location.search);
  logAuthState('oauth_hash_set_session_success');
  return true;
}

async function ensureSessionHydratedFromHash() {
  if (!oauthHashHydrationPromise) {
    oauthHashHydrationPromise = hydrateSessionFromOAuthHash()
      .catch(() => false)
      .finally(() => {
        oauthHashHydrationPromise = null;
      });
  }
  return oauthHashHydrationPromise;
}

let googleIdentityScriptPromise;

function createNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function loadGoogleIdentityScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google sign-in is only available in the browser.'));
  }
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }
  if (!googleIdentityScriptPromise) {
    googleIdentityScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[data-google-identity-client]');
      if (existingScript && window.google?.accounts?.id) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentityClient = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services.'));
      document.head.appendChild(script);
    });
  }
  return googleIdentityScriptPromise;
}

export async function signInWithGoogle() {
  const isNative = Capacitor.isNativePlatform();
  const redirectTarget = isNative
    ? NATIVE_OAUTH_REDIRECT_URL
    : (() => {
      try {
        const url = new URL(window.location.href);
        url.search = '';
        url.hash = '';
        url.searchParams.set('showFrontStage', '1');
        return url.toString();
      } catch (_) {
        return window.location.origin + '?showFrontStage=1';
      }
    })();

  logAuthState('sign_in_google_clicked', {
    redirectTarget,
    isNative,
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTarget,
      // On native we open the OAuth URL ourselves in the system browser
      // instead of letting supabase-js navigate the embedded WebView, which
      // Google's OAuth policy blocks.
      skipBrowserRedirect: isNative,
      queryParams: {
        prompt: 'select_account',
      },
    },
  });
  if (error) {
    logAuthState('sign_in_google_failed', { message: error.message || String(error) });
    throw error;
  }
  if (isNative && data?.url) {
    ensureNativeAuthDeepLinkListener();
    await Browser.open({ url: data.url });
  }
  logAuthState('sign_in_google_redirect_started', {
    hasOAuthUrl: !!data?.url,
    isNative,
  });
  return data;
}

export async function signOut() {
  logAuthState('sign_out_clicked');
  await supabase.auth.signOut();
}

export async function getSession() {
  await ensureSessionHydratedFromHash();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function loadProfileFromSupabase(userId) {
  const { data, error } = await supabase
    .from('player_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function saveProfileToSupabase(userId, profile) {
  const { error } = await supabase
    .from('player_profiles')
    .upsert({
      id: userId,
      level: Math.max(1, Number(profile.level) || 1),
      xp: Math.max(0, Number(profile.xp) || 0),
      worlds_cleared: Array.isArray(profile.worldsCleared) ? profile.worldsCleared : [],
      name: String(profile.name || 'Player').slice(0, 24),
      online_unlocks: profile.onlineUnlocks || {},
      weapon_upgrade_levels: profile.weaponUpgradeLevels || {},
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
  if (error) throw error;
}

// Merge remote profile into local — remote wins if it has higher level or more recent data.
export function mergeProfiles(local, remote) {
  if (!remote) return local;
  const localUpdatedAt = local.updatedAt || 0;
  const remoteUpdatedAt = remote.updated_at ? new Date(remote.updated_at).getTime() : 0;
  const useRemote = remoteUpdatedAt >= localUpdatedAt;
  return {
    level: Math.max(local.level || 1, remote.level || 1),
    xp: useRemote ? (remote.xp || 0) : (local.xp || 0),
    worldsCleared: useRemote ? (remote.worlds_cleared || []) : (local.worldsCleared || []),
    name: useRemote ? (remote.name || local.name || 'Player') : (local.name || 'Player'),
    onlineUnlocks: {
      gamesPlayed: Math.max(local.onlineUnlocks?.gamesPlayed || 0, remote.online_unlocks?.gamesPlayed || 0),
      wins: Math.max(local.onlineUnlocks?.wins || 0, remote.online_unlocks?.wins || 0),
      maxWaveSurvived: Math.max(local.onlineUnlocks?.maxWaveSurvived || 0, remote.online_unlocks?.maxWaveSurvived || 0),
      weaponsGranted: Array.from(new Set([
        ...(local.onlineUnlocks?.weaponsGranted || []),
        ...(remote.online_unlocks?.weaponsGranted || []),
      ])),
    },
    weaponUpgradeLevels: useRemote
      ? { ...(local.weaponUpgradeLevels || {}), ...(remote.weapon_upgrade_levels || {}) }
      : { ...(remote.weapon_upgrade_levels || {}), ...(local.weaponUpgradeLevels || {}) },
  };
}

// Call once on app start — resolves with the merged profile or null if not signed in.
export async function initSupabaseAuth(onProfileLoaded) {
  ensureNativeAuthDeepLinkListener();
  await ensureSessionHydratedFromHash();

  const applySignedInSessionToWindow = (authUser) => {
    window.__supabaseUserId = authUser.id;
    window.__supabaseUserEmail = authUser.email;
    window.__supabaseUserName = authUser.user_metadata?.full_name || authUser.email || 'Player';
    window.__supabaseUserAvatar = authUser.user_metadata?.avatar_url || null;
  };

  // Handle OAuth redirect on page load
  const { data: { session } } = await supabase.auth.getSession();
  logAuthState('init_session_checked', {
    hasSession: !!session?.user,
    sessionUserId: session?.user?.id || null,
  });
  if (session?.user) {
    applySignedInSessionToWindow(session.user);
    if (typeof onProfileLoaded === 'function') {
      const remote = await loadProfileFromSupabase(session.user.id);
      onProfileLoaded(session.user, remote);
    }
    logAuthState('init_session_loaded_user', {
      sessionUserId: session.user.id,
      email: session.user.email || null,
    });
    if (typeof window.__refreshAuthUI === 'function') window.__refreshAuthUI();
  }

  supabase.auth.onAuthStateChange(async (event, newSession) => {
    logAuthState('on_auth_state_change', {
      stateEvent: event,
      hasSession: !!newSession?.user,
      sessionUserId: newSession?.user?.id || null,
    });
    if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && newSession?.user) {
      applySignedInSessionToWindow(newSession.user);
      if (typeof onProfileLoaded === 'function') {
        const remote = await loadProfileFromSupabase(newSession.user.id);
        onProfileLoaded(newSession.user, remote);
      }
      logAuthState('signed_in_applied_to_window', {
        sessionUserId: newSession.user.id,
        email: newSession.user.email || null,
      });
      // Refresh sign-in button state across the UI
      if (typeof window.__refreshAuthUI === 'function') window.__refreshAuthUI();
    } else if (event === 'SIGNED_OUT') {
      window.__supabaseUserId = null;
      window.__supabaseUserEmail = null;
      window.__supabaseUserName = null;
      window.__supabaseUserAvatar = null;
      logAuthState('signed_out_cleared_window_state');
      if (typeof window.__refreshAuthUI === 'function') window.__refreshAuthUI();
    }
  });
}
