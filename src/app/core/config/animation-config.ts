/**
 * Animation configuration for game speeds
 * Contains default durations and user-friendly speed multipliers
 */

export interface AnimationSpeedOption {
  label: string;
  value: number;
  description: string;
}

export const ANIMATION_SPEED_OPTIONS: AnimationSpeedOption[] = [
  { label: 'SETTINGS_SPEED_VERY_SLOW', value: 1.5, description: 'SETTINGS_SPEED_VERY_SLOW_DESC' },
  { label: 'SETTINGS_SPEED_SLOW', value: 1.2, description: 'SETTINGS_SPEED_SLOW_DESC' },
  { label: 'SETTINGS_SPEED_NORMAL', value: 1.0, description: 'SETTINGS_SPEED_NORMAL_DESC' },
  { label: 'SETTINGS_SPEED_FAST', value: 0.75, description: 'SETTINGS_SPEED_FAST_DESC' },
  { label: 'SETTINGS_SPEED_VERY_FAST', value: 0.5, description: 'SETTINGS_SPEED_VERY_FAST_DESC' },
];

/**
 * Default animation durations (in milliseconds)
 * These are the base durations used in the game
 */
export const DEFAULT_ANIMATION_DURATIONS = {
  ATTACK_SWING: 240,
  IMPACT_BURST: 420,
  IMPACT_SPARK: 280,
  PULSE_TARGET: 360,
  DASH_RETURN: 500,
  DECK_CARD_TRAVEL: 0, // Dynamic - passed as parameter
  PROJECTILE_TRAVEL: 250,
  UNIT_DEATH: 420,
  SPARK_RANDOM_EXTRA: 120, // Random up to this value
};

/**
 * Animation configuration class for managing speed settings
 */
export class AnimationConfig {
  private currentSpeedMultiplier: number = 1.0;

  constructor() {
    this.loadFromLocalStorage();
  }

  /**
   * Get the current speed multiplier
   */
  getSpeedMultiplier(): number {
    return this.currentSpeedMultiplier;
  }

  /**
   * Set the speed multiplier
   */
  setSpeedMultiplier(multiplier: number): void {
    this.currentSpeedMultiplier = multiplier;
    this.saveToLocalStorage();
  }

  /**
   * Get adjusted duration based on current speed multiplier
   */
  getAdjustedDuration(baseDuration: number): number {
    return Math.round(baseDuration * this.currentSpeedMultiplier);
  }

  /**
   * Save current configuration to localStorage
   */
  private saveToLocalStorage(): void {
    localStorage.setItem('wizardwar_animation_speed', this.currentSpeedMultiplier.toString());
  }

  /**
   * Load configuration from localStorage
   */
  private loadFromLocalStorage(): void {
    const saved = localStorage.getItem('wizardwar_animation_speed');
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed)) {
        this.currentSpeedMultiplier = parsed;
      }
    }
  }
}

export const animationConfig = new AnimationConfig();
