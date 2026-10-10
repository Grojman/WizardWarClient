import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  CURSOR_CSS_VARIABLES,
  CURSOR_OPTIONS,
  CursorOption,
  cursorConfig,
  cursorImage,
} from '../config/cursor-config';

/**
 * Owns the selected custom cursor and mirrors it onto :root as the
 * --cursor-default / --cursor-pointer CSS variables used by styles.css.
 */
@Injectable({
  providedIn: 'root',
})
export class CursorSettingsService {
  private currentSubject = new BehaviorSubject<CursorOption>(cursorConfig.getCurrent());
  current$: Observable<CursorOption> = this.currentSubject.asObservable();

  constructor() {
    this.applyToDocument();
  }

  getCurrent(): CursorOption {
    return cursorConfig.getCurrent();
  }

  // Steps through CURSOR_OPTIONS, wrapping around at both ends.
  cycle(step: 1 | -1): void {
    const index = CURSOR_OPTIONS.findIndex((o) => o.id === cursorConfig.getCurrent().id);
    const next = CURSOR_OPTIONS[(index + step + CURSOR_OPTIONS.length) % CURSOR_OPTIONS.length];
    this.select(next.id);
  }

  select(id: string): void {
    cursorConfig.setCurrent(id);
    this.applyToDocument();
    this.currentSubject.next(cursorConfig.getCurrent());
  }

  private applyToDocument(): void {
    const root = document.documentElement;
    const option = cursorConfig.getCurrent();
    const [dx, dy] = option.defaultHotspot;
    const [px, py] = option.pointerHotspot;

    // The keyword after each url() is the fallback if the image can't load.
    root.style.setProperty(CURSOR_CSS_VARIABLES.default, `url("${cursorImage(option, 'default')}") ${dx} ${dy}, default`);
    root.style.setProperty(CURSOR_CSS_VARIABLES.pointer, `url("${cursorImage(option, 'pointer')}") ${px} ${py}, pointer`);
  }
}
