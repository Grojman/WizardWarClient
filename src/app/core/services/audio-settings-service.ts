import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { audioConfig } from '../config/audio-config';

@Injectable({
  providedIn: 'root'
})
export class AudioSettingsService {

  private musicVolumeSubject = new BehaviorSubject<number>(audioConfig.getMusicVolume());
  readonly musicVolume$ = this.musicVolumeSubject.asObservable();

  private sfxVolumeSubject = new BehaviorSubject<number>(audioConfig.getSfxVolume());
  readonly sfxVolume$ = this.sfxVolumeSubject.asObservable();

  private musicEnabledSubject = new BehaviorSubject<boolean>(audioConfig.isMusicEnabled());
  readonly musicEnabled$ = this.musicEnabledSubject.asObservable();

  private sfxEnabledSubject = new BehaviorSubject<boolean>(audioConfig.isSfxEnabled());
  readonly sfxEnabled$ = this.sfxEnabledSubject.asObservable();

  // -----------------------
  // Music Volume
  // -----------------------

  getMusicVolume(): number {
    return audioConfig.getMusicVolume();
  }

  setMusicVolume(volume: number): void {
    audioConfig.setMusicVolume(volume);
    this.musicVolumeSubject.next(audioConfig.getMusicVolume());
  }

  // -----------------------
  // SFX Volume
  // -----------------------

  getSfxVolume(): number {
    return audioConfig.getSfxVolume();
  }

  setSfxVolume(volume: number): void {
    audioConfig.setSfxVolume(volume);
    this.sfxVolumeSubject.next(audioConfig.getSfxVolume());
  }

  // -----------------------
  // Music Enabled
  // -----------------------

  isMusicEnabled(): boolean {
    return audioConfig.isMusicEnabled();
  }

  setMusicEnabled(enabled: boolean): void {
    audioConfig.setMusicEnabled(enabled);
    this.musicEnabledSubject.next(enabled);
  }

  // -----------------------
  // SFX Enabled
  // -----------------------

  isSfxEnabled(): boolean {
    return audioConfig.isSfxEnabled();
  }

  setSfxEnabled(enabled: boolean): void {
    audioConfig.setSfxEnabled(enabled);
    this.sfxEnabledSubject.next(enabled);
  }

}