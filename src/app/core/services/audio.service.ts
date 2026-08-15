import { Injectable } from '@angular/core';
import { AudioSettingsService } from './audio-settings-service';

@Injectable({
  providedIn: 'root'
})
export class AudioService {

  private audioContext = new AudioContext();
  private sfxCache = new Map<string, AudioBuffer>();
  private async getBuffer(path: string): Promise<AudioBuffer> {

    const cached = this.sfxCache.get(path);

    if (cached) {
      return cached;
    }

    const response = await fetch(path);
    const data = await response.arrayBuffer();

    const buffer = await this.audioContext.decodeAudioData(data);

    this.sfxCache.set(path, buffer);

    return buffer;
  }
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

  playSong(song: string)
  {
    if (!this.musicEnabled) return;
    this.loadSong(song);
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

  playNotification()
  {
    const options = [...Array(9).keys()];
    
    const notification = options[Math.floor(Math.random() * options.length)];

    this.playSfx(`/audio/notifications/${notification + 1}.mp4`, true);
  }

  playSfx(path: string, addVariation: boolean = true): void {

    if (!this.sfxEnabled) return;

    // Algunos navegadores suspenden el AudioContext
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }

    this.getBuffer(path).then(buffer => {

      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;

      if(addVariation)
      {
        // Variación aleatoria del pitch ±8%
        source.playbackRate.value = 0.92 + Math.random() * 0.16;
      }
      
      const gain = this.audioContext.createGain();
      gain.gain.value = this.sfxVolume;

      source.connect(gain);
      gain.connect(this.audioContext.destination);

      source.start();

    }).catch(() => {});
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
    this.loadSong(this.playlist[this.currentSong]);
  }

  

  private loadSong(song: string)
  {
    this.music.src = song;
    this.music.load();
    this.music.volume = this.musicVolume;
    this.music.muted = !this.musicEnabled;
  }


  coinIds = ["96", "98", "99", "100", "101", "102"]
  playCardSound(id: string)
  {
    if (this.coinIds.includes(id))
    {
      this.playSfx("/audio/special_card/coin.mpeg", true);
      return;
    }
    this.playSfx(`/audio/special_card/${id}.mpeg`, true)
  }
}