import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  FONT_SCALE_CSS_VARIABLES,
  FontScaleKey,
  FontScales,
  fontConfig,
} from '../config/font-config';

/**
 * Owns the user's font-size scales and mirrors them onto :root as CSS
 * variables, which styles.css turns into the actual text scaling.
 */
@Injectable({
  providedIn: 'root',
})
export class FontSettingsService {
  private scalesSubject = new BehaviorSubject<FontScales>(fontConfig.getScales());
  scales$: Observable<FontScales> = this.scalesSubject.asObservable();

  constructor() {
    this.applyToDocument();
  }

  getScales(): FontScales {
    return fontConfig.getScales();
  }

  setScale(key: FontScaleKey, value: number): void {
    fontConfig.setScale(key, value);
    this.publish();
  }

  reset(): void {
    fontConfig.reset();
    this.publish();
  }

  private publish(): void {
    this.applyToDocument();
    this.scalesSubject.next(fontConfig.getScales());
  }

  private applyToDocument(): void {
    const root = document.documentElement;
    const scales = fontConfig.getScales();

    for (const key of Object.keys(FONT_SCALE_CSS_VARIABLES) as FontScaleKey[]) {
      root.style.setProperty(FONT_SCALE_CSS_VARIABLES[key], scales[key].toString());
    }
  }
}
