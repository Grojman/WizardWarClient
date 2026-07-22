import { Component, OnInit } from '@angular/core';
import { AnimationSettingsService } from '../../../core/services/animation-settings.service';
import { ANIMATION_SPEED_OPTIONS } from '../../../core/config/animation-config';
import { AudioSettingsService } from '../../../core/services/audio-settings-service';

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

  constructor(
  private animationSettingsService: AnimationSettingsService,
  private audioSettings: AudioSettingsService
) {}


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

    // Valores actuales
  musicVolume: number= 0;
  sfxVolume: number = 0;

  musicEnabled: boolean = true;
  sfxEnabled: boolean = true;

  ngOnInit(): void {

    this.musicVolume = this.audioSettings.getMusicVolume();
    this.sfxVolume = this.audioSettings.getSfxVolume();

    this.musicEnabled = this.audioSettings.isMusicEnabled();
    this.sfxEnabled = this.audioSettings.isSfxEnabled();

    this.currentSpeedMultiplier = this.animationSettingsService.getSpeedMultiplier();

    this.audioSettings.musicVolume$.subscribe(volume => {
      this.musicVolume = volume;
    });

    this.audioSettings.sfxVolume$.subscribe(volume => {
      this.sfxVolume = volume;
    });

    this.audioSettings.musicEnabled$.subscribe(enabled => {
      this.musicEnabled = enabled;
    });

    this.audioSettings.sfxEnabled$.subscribe(enabled => {
      this.sfxEnabled = enabled;
    });

  }

  setMusicVolume(volume: number): void {
    this.audioSettings.setMusicVolume(volume);
  }

  setSfxVolume(volume: number): void {
    this.audioSettings.setSfxVolume(volume);
  }

  setMusicEnabled(enabled: boolean): void {
    this.audioSettings.setMusicEnabled(enabled);
  }

  setSfxEnabled(enabled: boolean): void {
    this.audioSettings.setSfxEnabled(enabled);
  }
}
