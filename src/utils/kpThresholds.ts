/**
 * F4.4 / §4.11: single source of truth for Kp classification thresholds.
 * AuroraForecast (moderate / high / storm gradient) and the notification
 * preferences default used to keep three independent copies of these numbers.
 */
export const KP_MODERATE_INDEX = 3;
export const KP_HIGH_INDEX = 4;
export const KP_STORM_INDEX = 5;

/** Default user-facing aurora alert threshold (smart notifications). */
export const DEFAULT_KP_ALERT_THRESHOLD = KP_STORM_INDEX;
