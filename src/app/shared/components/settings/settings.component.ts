import { Component, OnInit } from '@angular/core';
import { AnimationSettingsService } from '../../../core/services/animation-settings.service';
import { ANIMATION_SPEED_OPTIONS } from '../../../core/config/animation-config';

@Component({
  selector: 'app-settings',
  standalone: false,
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent implements OnInit {
  isOpen = false;
  currentSpeedMultiplier: number = 1.0;
  speedOptions = ANIMATION_SPEED_OPTIONS;

  constructor(private animationSettingsService: AnimationSettingsService) {}

  ngOnInit(): void {
    this.currentSpeedMultiplier = this.animationSettingsService.getSpeedMultiplier();
  }

  /**
   * Open the settings panel
   */
  open(): void {
    this.isOpen = true;
  }

  /**
   * Close the settings panel
   */
  close(): void {
    this.isOpen = false;
  }

  /**
   * Change the animation speed
   */
  changeSpeed(multiplier: number): void {
    this.currentSpeedMultiplier = multiplier;
    this.animationSettingsService.setSpeedMultiplier(multiplier);
  }

  /**
   * Get the label for the current speed
   */
  getCurrentSpeedLabel(): string {
    const option = this.speedOptions.find(opt => opt.value === this.currentSpeedMultiplier);
    return option ? option.label : 'Unknown';
  }
}
