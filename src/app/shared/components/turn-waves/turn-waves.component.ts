import {
  AfterViewInit,
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';

interface WaveParticle {
  // Position inside the active player's section, as a fraction of its size (-0.5..0.5).
  fx: number;
  fy: number;
  // Delay before this particle leaves when the turn changes (staggers the jump).
  moveDelayMs: number;
  orbitRadius: number;
  orbitSeconds: number;
  orbitPhaseSeconds: number;
  orbitReverse: boolean;
  size: number;
  // height / width: ~1 gives squares, a small value gives long thin rectangles.
  ratio: number;
  tiltDeg: number;
  rgb: string;
}

// Light tones so they still read against the dark and wooden parts of the table.
const WAVE_COLORS = ['255 244 214', '150 255 230', '170 130 255', '255 200 90'];
const PARTICLE_COUNT = 42;
const TRAVEL_HIGHLIGHT_MS = 800;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

function createParticles(): WaveParticle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const isRectangle = i % 3 === 0;

    return {
      fx: rand(-0.45, 0.45),
      fy: rand(-0.4, 0.4),
      moveDelayMs: Math.round(rand(0, 240)),
      orbitRadius: rand(30, 120),
      orbitSeconds: rand(5, 12),
      orbitPhaseSeconds: rand(0, 12),
      orbitReverse: Math.random() < 0.5,
      size: isRectangle ? rand(60, 150) : rand(14, 42),
      ratio: isRectangle ? rand(0.16, 0.3) : 1,
      tiltDeg: isRectangle ? rand(-25, 25) : rand(0, 45),
      rgb: WAVE_COLORS[Math.floor(Math.random() * WAVE_COLORS.length)],
    };
  });
}

/**
 * Decorative layer laid over the table (and under everything else on it):
 * squares and rectangles that circle around the section of the player whose turn
 * it is, and dash over to the next player's section whenever the turn changes.
 *
 * It must be a direct child of the table container; `activeIndex` is the position
 * of the active player's `.player-slot` among that container's slots.
 */
@Component({
  selector: 'app-turn-waves',
  standalone: false,
  templateUrl: './turn-waves.component.html',
  styleUrl: './turn-waves.component.css',
})
export class TurnWavesComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input()
  activeIndex: number | null = null;

  particles = createParticles();

  @HostBinding('class.idle')
  get idle(): boolean {
    return this.activeIndex === null;
  }

  private viewReady = false;
  private placed = false;
  private resizeObserver?: ResizeObserver;
  private travelTimer?: ReturnType<typeof setTimeout>;

  constructor(private host: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    this.viewReady = true;

    const container = this.host.nativeElement.parentElement;
    if (container && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.updateTarget(false));
      this.resizeObserver.observe(container);
    }

    this.updateTarget(false);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.viewReady && changes['activeIndex']) {
      this.updateTarget(true);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    clearTimeout(this.travelTimer);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateTarget(false);
  }

  private get slots(): HTMLElement[] {
    const container = this.host.nativeElement.parentElement;
    if (!container) return [];
    return Array.from(container.querySelectorAll<HTMLElement>(':scope > .player-slot'));
  }

  // Points the swarm at the active player's slot. Layout-only updates (resize,
  // first placement) snap there; a real turn change is what animates.
  private updateTarget(animate: boolean): void {
    if (this.activeIndex === null) return;

    const slot = this.slots[this.activeIndex];
    if (!slot) return;

    const host = this.host.nativeElement;
    const shouldAnimate = animate && this.placed;

    if (!shouldAnimate) {
      host.classList.add('placing');
    }

    host.style.setProperty('--wave-x', `${slot.offsetLeft + slot.offsetWidth / 2}px`);
    host.style.setProperty('--wave-y', `${slot.offsetTop + slot.offsetHeight / 2}px`);
    host.style.setProperty('--wave-w', `${slot.offsetWidth}px`);
    host.style.setProperty('--wave-h', `${slot.offsetHeight}px`);

    if (!shouldAnimate) {
      // Commit the snap before transitions are turned back on.
      void host.offsetWidth;
      host.classList.remove('placing');
    } else {
      this.flashTravel();
    }

    this.placed = true;
  }

  private flashTravel(): void {
    const host = this.host.nativeElement;
    host.classList.add('travelling');
    clearTimeout(this.travelTimer);
    this.travelTimer = setTimeout(() => host.classList.remove('travelling'), TRAVEL_HIGHLIGHT_MS);
  }
}
