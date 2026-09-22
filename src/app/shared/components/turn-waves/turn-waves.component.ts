import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
} from '@angular/core';
import { Health } from '../../../models/health.model';

interface WaveParticle {
  orbitRadius: number;
  orbitSeconds: number;
  orbitPhaseSeconds: number;
  orbitReverse: boolean;
  // Circle diameter.
  size: number;
  // How far (px) and how late (ms) this particle is flung on a hit, so the
  // swarm scatters unevenly instead of moving as one rigid block.
  knockbackDistance: number;
  knockbackDelayMs: number;
  // Picks a shade within whichever palette is currently active (base/mine/rival),
  // so each particle keeps a consistent variant as the state (and palette) changes.
  colorIndex: number;
}

// Inactive palette: very light blue.
const WAVE_COLORS_BASE = ['189 224 255', '170 210 255', '205 232 255', '150 200 250'];
// Active, when this is the rival's swarm.
const WAVE_COLORS_RIVAL = ['255 90 90', '235 45 60', '255 60 60', '220 30 45'];
// Active, when this is your swarm: a more intense, saturated blue than the base palette.
const WAVE_COLORS_MINE = ['30 100 255', '10 80 240', '55 130 255', '0 65 220'];

const PARTICLE_COUNT = 16;
// How much faster (orbit) and further (scale) the swarm dances while active.
const ACTIVE_SPEED_MULTIPLIER = 2.4;
// Knockback distance multiplier by damage taken, as [damage, scale] points
// (ascending). Damage between points is linearly interpolated; below the first
// / above the last point it's clamped to that point's scale.
const KNOCKBACK_SCALE_POINTS: [number, number][] = [
  [1, 1.0],
  [3, 1.5],
  [6, 1.75],
  [9, 2.25],
];

const rand = (min: number, max: number) => min + Math.random() * (max - min);

function createParticles(): WaveParticle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    orbitRadius: rand(28, 55),
    orbitSeconds: rand(6, 11),
    orbitPhaseSeconds: rand(0, 11),
    orbitReverse: Math.random() < 0.5,
    size: rand(10, 20),
    knockbackDistance: rand(18, 42),
    knockbackDelayMs: rand(0, 80),
    colorIndex: Math.floor(Math.random() * WAVE_COLORS_BASE.length),
  }));
}

/**
 * Decorative particle swarm that permanently dances around a player's health
 * container. It must be a sibling of that player's `<app-health>`, both
 * direct children of a `position: relative` container (see
 * player.component.html/css) — it locates that sibling itself and tracks its
 * position/size via ResizeObserver, the same way the old table-wide version
 * tracked `.player-slot`s, so it re-centers itself if the layout shifts.
 *
 * It has two states: inactive (small, slow, light blue) and active (wider
 * orbit, faster spin, colored red for the rival / a deeper blue for you).
 * When `health` takes damage, every particle is knocked back away from the
 * hit, along the same attacker->target vector HealthComponent shakes along,
 * then drifts back into its orbit. The harder the hit, the further they fly.
 */
@Component({
  selector: 'app-turn-waves',
  standalone: false,
  templateUrl: './turn-waves.component.html',
  styleUrl: './turn-waves.component.css',
})
export class TurnWavesComponent implements AfterViewInit, OnDestroy {
  @Input()
  active = false;

  // Whether this swarm belongs to the local player (drives the "active, mine"
  // color) or a rival (drives the "active, theirs" color).
  @Input()
  isMe = false;

  // Same Health instance HealthComponent gets; its shake state/vector drives
  // the particles' knockback, in sync with the health hit.
  @Input()
  health: Health | null = null;

  particles = createParticles();

  private resizeObserver?: ResizeObserver;

  constructor(private host: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    const container = this.host.nativeElement.parentElement;
    const target = this.healthElement();

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.updatePosition());
      if (target) this.resizeObserver.observe(target);
      if (container) this.resizeObserver.observe(container);
    }

    this.updatePosition();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updatePosition();
  }

  private healthElement(): HTMLElement | null {
    return this.host.nativeElement.parentElement?.querySelector<HTMLElement>(':scope > app-health') ?? null;
  }

  // Centers the swarm on its sibling health element, in the same positioned
  // container both live in.
  private updatePosition(): void {
    const target = this.healthElement();
    if (!target) return;

    const host = this.host.nativeElement;
    host.style.setProperty('--wave-x', `${target.offsetLeft + target.offsetWidth / 2}px`);
    host.style.setProperty('--wave-y', `${target.offsetTop + target.offsetHeight / 2}px`);
  }

  knockbackScale(): number {
    const damage = this.health?.shakeDamage ?? 0;
    const points = KNOCKBACK_SCALE_POINTS;
    if (damage <= points[0][0]) return points[0][1];

    for (let i = 1; i < points.length; i++) {
      const [d1, s1] = points[i];
      if (damage <= d1) {
        const [d0, s0] = points[i - 1];
        return s0 + ((damage - d0) / (d1 - d0)) * (s1 - s0);
      }
    }

    return points[points.length - 1][1];
  }

  orbitTimeFor(p: WaveParticle): number {
    return this.active ? p.orbitSeconds / ACTIVE_SPEED_MULTIPLIER : p.orbitSeconds;
  }

  rgbFor(p: WaveParticle): string {
    const palette = !this.active
      ? WAVE_COLORS_BASE
      : this.isMe
        ? WAVE_COLORS_MINE
        : WAVE_COLORS_RIVAL;
    return palette[p.colorIndex % palette.length];
  }
}
