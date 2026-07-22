/**
 * Audio configuration
 */

export class AudioConfig {

  private musicVolume = 0.5;
  private sfxVolume = 1.0;

  private musicEnabled = true;
  private sfxEnabled = true;

  constructor() {
    this.loadFromLocalStorage();
  }

  // -----------------------
  // Music
  // -----------------------

  getMusicVolume(): number {
    return this.musicVolume;
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = this.clamp(volume);
    this.saveToLocalStorage();
  }

  isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    this.saveToLocalStorage();
  }

  // -----------------------
  // SFX
  // -----------------------

  getSfxVolume(): number {
    return this.sfxVolume;
  }

  setSfxVolume(volume: number): void {
    this.sfxVolume = this.clamp(volume);
    this.saveToLocalStorage();
  }

  isSfxEnabled(): boolean {
    return this.sfxEnabled;
  }

  setSfxEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled;
    this.saveToLocalStorage();
  }

  // -----------------------
  // Persistence
  // -----------------------

  private saveToLocalStorage(): void {

    localStorage.setItem("wizardwar_music_volume", this.musicVolume.toString());
    localStorage.setItem("wizardwar_sfx_volume", this.sfxVolume.toString());

    localStorage.setItem("wizardwar_music_enabled", this.musicEnabled.toString());
    localStorage.setItem("wizardwar_sfx_enabled", this.sfxEnabled.toString());

  }

  private loadFromLocalStorage(): void {

    const musicVolume = localStorage.getItem("wizardwar_music_volume");
    if (musicVolume !== null) {
      const value = parseFloat(musicVolume);
      if (!isNaN(value)) {
        this.musicVolume = this.clamp(value);
      }
    }

    const sfxVolume = localStorage.getItem("wizardwar_sfx_volume");
    if (sfxVolume !== null) {
      const value = parseFloat(sfxVolume);
      if (!isNaN(value)) {
        this.sfxVolume = this.clamp(value);
      }
    }

    const musicEnabled = localStorage.getItem("wizardwar_music_enabled");
    if (musicEnabled !== null) {
      this.musicEnabled = musicEnabled === "true";
    }

    const sfxEnabled = localStorage.getItem("wizardwar_sfx_enabled");
    if (sfxEnabled !== null) {
      this.sfxEnabled = sfxEnabled === "true";
    }

  }

  private clamp(value: number): number {
    return Math.max(0, Math.min(1, value));
  }

}

export const audioConfig = new AudioConfig();