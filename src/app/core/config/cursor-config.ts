/**
 * Custom mouse cursor configuration.
 *
 * Each option has two images under public/cursors/<id>/: `default.svg` (the
 * normal cursor) and `pointer.svg` (over clickable elements). The hotspots
 * are the pixel, inside the 32x32 image, that actually points at things.
 */

export interface CursorOption {
  id: string;
  labelKey: string;
  defaultHotspot: [number, number];
  pointerHotspot: [number, number];
}

export const CURSOR_OPTIONS: CursorOption[] = [
  { id: 'wizard-hand', labelKey: 'CURSOR_WIZARD_HAND', defaultHotspot: [3, 3], pointerHotspot: [3, 3] },
  { id: 'mystic-eye', labelKey: 'CURSOR_MYSTIC_EYE', defaultHotspot: [16, 16], pointerHotspot: [16, 17] },
  { id: 'hand', labelKey: 'CURSOR_HAND', defaultHotspot: [14, 2], pointerHotspot: [11, 1] },
  { id: 'beer-jar', labelKey: 'CURSOR_BEER_JAR', defaultHotspot: [4, 5], pointerHotspot: [2, 10] },
];

export const DEFAULT_CURSOR_ID = CURSOR_OPTIONS[0].id;

// Read by styles.css (and any component with its own cursor rule).
export const CURSOR_CSS_VARIABLES = {
  default: '--cursor-default',
  pointer: '--cursor-pointer',
};

export function cursorImage(option: CursorOption, kind: 'default' | 'pointer'): string {
  return `/cursors/${option.id}/${kind}.svg`;
}

const STORAGE_KEY = 'wizardwar_cursor';

export class CursorConfig {
  private currentId = DEFAULT_CURSOR_ID;

  constructor() {
    this.loadFromLocalStorage();
  }

  getCurrent(): CursorOption {
    return CURSOR_OPTIONS.find((o) => o.id === this.currentId) ?? CURSOR_OPTIONS[0];
  }

  setCurrent(id: string): void {
    if (!CURSOR_OPTIONS.some((o) => o.id === id)) return;
    this.currentId = id;
    this.saveToLocalStorage();
  }

  private saveToLocalStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, this.currentId);
    } catch {
      // Storage can be unavailable (private mode, blocked cookies): the choice just won't persist.
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // Ignore ids of cursors that no longer exist.
      if (stored && CURSOR_OPTIONS.some((o) => o.id === stored)) {
        this.currentId = stored;
      }
    } catch {
      // See saveToLocalStorage.
    }
  }
}

export const cursorConfig = new CursorConfig();
