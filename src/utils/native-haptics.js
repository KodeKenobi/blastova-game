import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

/**
 * Trigger a light tap haptic (like native iOS/Android button press)
 */
export async function hapticTap() {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch (e) {
    // Haptics may fail if not available
  }
}

/**
 * Trigger a medium impact haptic (for confirmations)
 */
export async function hapticMedium() {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch (e) {
    // Haptics may fail if not available
  }
}

/**
 * Trigger a heavy impact haptic (for errors or major actions)
 */
export async function hapticHeavy() {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch (e) {
    // Haptics may fail if not available
  }
}

/**
 * Trigger a success notification haptic (pattern: light-medium)
 */
export async function hapticSuccess() {
  if (!isNative) return;
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch (e) {
    // Haptics may fail if not available
  }
}

/**
 * Trigger a warning notification haptic
 */
export async function hapticWarning() {
  if (!isNative) return;
  try {
    await Haptics.notification({ type: NotificationType.Warning });
  } catch (e) {
    // Haptics may fail if not available
  }
}

/**
 * Trigger an error notification haptic
 */
export async function hapticError() {
  if (!isNative) return;
  try {
    await Haptics.notification({ type: NotificationType.Error });
  } catch (e) {
    // Haptics may fail if not available
  }
}

/**
 * Apply haptics feedback to a DOM element on click (native app feel)
 */
export function attachNativeHaptics(element, feedbackType = 'tap') {
  if (!element) return;
  
  const feedbackFunctions = {
    tap: hapticTap,
    medium: hapticMedium,
    heavy: hapticHeavy,
    success: hapticSuccess,
    warning: hapticWarning,
    error: hapticError,
  };
  
  const fn = feedbackFunctions[feedbackType] || hapticTap;
  
  element.addEventListener('touchend', () => {
    fn();
  });
}

/**
 * Apply haptics to all buttons in a container
 */
export function enableNativeHapticsForButtons(container) {
  if (!container) return;
  
  const buttons = container.querySelectorAll('button, [role="button"], input[type="button"]');
  buttons.forEach(btn => {
    attachNativeHaptics(btn, 'tap');
  });
}
