import { Injectable } from '@angular/core';
import { AudioSettingsService } from './audio-settings-service';

@Injectable({
  providedIn: 'root'
})
export class AudioService {

  // Lista de canciones
  private playlist: string[] = [
    'audio/music/song1.mp3',
  ];

  private currentSong = 0;

  // Reproductor de música
  private music = new Audio();

  // Configuración
  private musicVolume = 0.5;
  private sfxVolume = 1;
  private musicEnabled = true;
  private sfxEnabled = true;

  constructor(private audioSettings: AudioSettingsService) {

    this.music.addEventListener('ended', () => {
      this.playNextSong();
    });

    // Volumen de la música
    this.audioSettings.musicVolume$.subscribe(volume => {
      this.musicVolume = volume;
      this.music.volume = volume;
    });

    // Volumen de efectos
    this.audioSettings.sfxVolume$.subscribe(volume => {
      this.sfxVolume = volume;
    });

    // Música habilitada/deshabilitada
    this.audioSettings.musicEnabled$.subscribe(enabled => {
      this.musicEnabled = enabled;
      this.music.muted = !enabled;
    });

    // Efectos habilitados/deshabilitados
    this.audioSettings.sfxEnabled$.subscribe(enabled => {
      this.sfxEnabled = enabled;
    });
  }

  // ---------------------------
  // Música
  // ---------------------------

  startMusic(): void {

    if (!this.musicEnabled) return;
    if (this.playlist.length === 0) return;

    this.currentSong = 0;
    this.loadCurrentSong();

    this.music.play().catch(() => {
      // Algunos navegadores bloquean el autoplay
    });
  }

  stopMusic(): void {
    this.music.pause();
    this.music.currentTime = 0;
  }

  pauseMusic(): void {
    this.music.pause();
  }

  resumeMusic(): void {

    if (!this.musicEnabled) return;

    this.music.play().catch(() => {
      // Algunos navegadores bloquean el autoplay
    });
  }

  nextSong(): void {
    this.playNextSong();
  }

  previousSong(): void {

    if (this.playlist.length === 0) return;

    this.currentSong--;

    if (this.currentSong < 0) {
      this.currentSong = this.playlist.length - 1;
    }

    this.loadCurrentSong();

    if (this.musicEnabled) {
      this.music.play().catch(() => {});
    }
  }

  // ---------------------------
  // Efectos
  // ---------------------------

  playSfx(path: string): void {

    if (!this.sfxEnabled) return;

    const sound = new Audio(path);

    sound.volume = this.sfxVolume;
    
    sound.play().catch(() => {});

    sound.onended = () => {
      sound.remove();
    };
  }

  // ---------------------------
  // Privados
  // ---------------------------

  private playNextSong(): void {

    if (this.playlist.length === 0) return;

    this.currentSong++;

    if (this.currentSong >= this.playlist.length) {
      this.currentSong = 0;
    }

    this.loadCurrentSong();

    if (this.musicEnabled) {
      this.music.play().catch(() => {});
    }
  }

  private loadCurrentSong(): void {

    this.music.src = this.playlist[this.currentSong];
    this.music.load();
    this.music.volume = this.musicVolume;
    this.music.muted = !this.musicEnabled;
  }
}