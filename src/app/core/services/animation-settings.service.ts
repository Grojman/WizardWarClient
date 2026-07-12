import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { animationConfig } from '../config/animation-config';

/**
 * Service to manage animation settings
 */
@Injectable({
  providedIn: 'root',
})
export class AnimationSettingsService {
  private speedMultiplierSubject = new BehaviorSubject<number>(animationConfig.getSpeedMultiplier());
  speedMultiplier$: Observable<number> = this.speedMultiplierSubject.asObservable();

  constructor() {}

  /**
   * Get the current speed multiplier
   */
  getSpeedMultiplier(): number {
    return animationConfig.getSpeedMultiplier();
  }

  /**
   * Set the speed multiplier and notify subscribers
   */
  setSpeedMultiplier(multiplier: number): void {
    animationConfig.setSpeedMultiplier(multiplier);
    this.speedMultiplierSubject.next(multiplier);
  }

  /**
   * Get adjusted duration based on current speed multiplier
   */
  getAdjustedDuration(baseDuration: number): number {
    return animationConfig.getAdjustedDuration(baseDuration);
  }
}
