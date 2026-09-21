/**
 * Font size configuration.
 *
 * The user can scale three groups of text independently. Each scale is a
 * multiplier applied through the CSS variables below (see styles.css).
 */

export type FontScaleKey = 'title' | 'subtitle' | 'text';

export interface FontScales {
  title: number;
  subtitle: number;
  text: number;
}

export const FONT_SCALE_MIN = 0.75;
export const FONT_SCALE_MAX = 1.5;
export const FONT_SCALE_STEP = 0.05;

export const FONT_SCALE_CSS_VARIABLES: Record<FontScaleKey, string> = {
  title: '--font-scale-title',
  subtitle: '--font-scale-subtitle',
  text: '--font-scale-text',
};

export const DEFAULT_FONT_SCALES: FontScales = { title: 1, subtitle: 1, text: 1 };

export class FontConfig {
  private scales: FontScales = { ...DEFAULT_FONT_SCALES };

  constructor() {
    this.loadFromLocalStorage();
  }

  getScale(key: FontScaleKey): number {
    return this.scales[key];
  }

  getScales(): FontScales {
    return { ...this.scales };
  }

  setScale(key: FontScaleKey, value: number): void {
    this.scales[key] = this.clamp(value);
    this.saveToLocalStorage();
  }

  reset(): void {
    this.scales = { ...DEFAULT_FONT_SCALES };
    this.saveToLocalStorage();
  }

  private storageKey(key: FontScaleKey): string {
    return `wizardwar_font_scale_${key}`;
  }

  private saveToLocalStorage(): void {
    try {
      for (const key of Object.keys(this.scales) as FontScaleKey[]) {
        localStorage.setItem(this.storageKey(key), this.scales[key].toString());
      }
    } catch {
      // Storage can be unavailable (private mode, blocked cookies): the scale just won't persist.
    }
  }

  private loadFromLocalStorage(): void {
    try {
      for (const key of Object.keys(this.scales) as FontScaleKey[]) {
        const stored = localStorage.getItem(this.storageKey(key));
        if (stored === null) continue;

        const value = parseFloat(stored);
        if (!isNaN(value)) {
          this.scales[key] = this.clamp(value);
        }
      }
    } catch {
      // See saveToLocalStorage.
    }
  }

  private clamp(value: number): number {
    const clamped = Math.max(FONT_SCALE_MIN, Math.min(FONT_SCALE_MAX, value));
    // Sliders hand back floats like 1.0500000000000003.
    return Math.round(clamped * 100) / 100;
  }
}

export const fontConfig = new FontConfig();
