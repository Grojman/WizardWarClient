import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  NgZone,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';

type Direction = 'up' | 'down' | 'left' | 'right';

interface Projectile {
  // 'row' travels horizontally along row `lane`, 'col' vertically along column `lane`.
  axis: 'row' | 'col';
  lane: number;
  // Position along its axis, in cells (cell centers are at 0..GRID_SIZE-1).
  pos: number;
  dir: 1 | -1;
  // Cells per second.
  speed: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  age: number;
}

const GRID_SIZE = 4;
// Logical canvas size (px); the backing store is scaled by devicePixelRatio.
const CELL_PX = 64;
const BOARD_PX = GRID_SIZE * CELL_PX;

const POINTS_PER_SECOND = 50;

// Difficulty ramps linearly with elapsed time, up to a cap.
const START_SPEED = 1.6;
const SPEED_GROWTH_PER_SECOND = 0.07;
const MAX_SPEED = 7;
const START_SPAWN_INTERVAL = 1.3;
const SPAWN_INTERVAL_DECAY_PER_SECOND = 0.025;
const MIN_SPAWN_INTERVAL = 0.3;

// Projectiles spawn this many cells outside the grid, giving a short warning.
const SPAWN_OFFSET = 1;
// Max distance (in cells) between centers along the lane that counts as a hit.
const HIT_DISTANCE = 0.55;
// After a hit, the block can't be hit again for this long (s).
const INVULNERABLE_SECONDS = 0.7;
const FLOATING_TEXT_SECONDS = 0.9;
// Frames longer than this (e.g. after the tab was hidden) are clamped, so
// neither score nor difficulty jumps while the player wasn't looking.
const MAX_FRAME_SECONDS = 0.05;

/**
 * Small dodge game shown while waiting for an online match: a block on a 4x4
 * grid, moved with the arrow keys (or the on-screen arrows), avoiding
 * projectiles that cross the grid along its rows/columns. +50 per second
 * survived, a hit resets the score to 0; projectiles get faster and more frequent over time.
 * The score is purely in-memory and discarded when the component is destroyed.
 */
@Component({
  selector: 'app-dodge-minigame',
  standalone: false,
  templateUrl: './dodge-minigame.component.html',
  styleUrl: './dodge-minigame.component.css',
})
export class DodgeMinigameComponent implements AfterViewInit, OnDestroy {
  @Output()
  cancel: EventEmitter<void> = new EventEmitter();

  @ViewChild('board')
  board!: ElementRef<HTMLCanvasElement>;

  score = 0;

  private ctx: CanvasRenderingContext2D | null = null;
  private frameId?: number;
  private lastFrame = 0;

  private elapsed = 0;
  private scoreTimer = 0;
  private spawnTimer = 0;
  private invulnerableFor = 0;

  private row = GRID_SIZE - 1;
  private col = 0;
  // Rendered position, eased toward row/col so moves slide instead of snapping.
  private drawRow = this.row;
  private drawCol = this.col;

  private projectiles: Projectile[] = [];
  private floatingTexts: FloatingText[] = [];

  private colors = { gold: '#d39a42', goldDark: '#a76e04', text: 'white' };

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    const canvas = this.board.nativeElement;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = BOARD_PX * dpr;
    canvas.height = BOARD_PX * dpr;
    this.ctx = canvas.getContext('2d');
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);

    const styles = getComputedStyle(document.documentElement);
    this.colors = {
      gold: styles.getPropertyValue('--color-gold').trim() || this.colors.gold,
      goldDark: styles.getPropertyValue('--color-gold-dark').trim() || this.colors.goldDark,
      text: styles.getPropertyValue('--text-color').trim() || this.colors.text,
    };

    this.zone.runOutsideAngular(() => {
      this.lastFrame = performance.now();
      this.frameId = requestAnimationFrame(t => this.loop(t));
    });
  }

  ngOnDestroy(): void {
    if (this.frameId !== undefined) cancelAnimationFrame(this.frameId);
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const direction = ({
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
    } as Record<string, Direction>)[event.key];

    if (!direction) return;
    event.preventDefault();
    this.move(direction);
  }

  move(direction: Direction): void {
    switch (direction) {
      case 'up':
        this.row = Math.max(0, this.row - 1);
        break;
      case 'down':
        this.row = Math.min(GRID_SIZE - 1, this.row + 1);
        break;
      case 'left':
        this.col = Math.max(0, this.col - 1);
        break;
      case 'right':
        this.col = Math.min(GRID_SIZE - 1, this.col + 1);
        break;
    }
  }

  private loop(now: number): void {
    const dt = Math.min(MAX_FRAME_SECONDS, (now - this.lastFrame) / 1000);
    this.lastFrame = now;

    this.update(dt);
    this.draw();

    this.frameId = requestAnimationFrame(t => this.loop(t));
  }

  private update(dt: number): void {
    this.elapsed += dt;

    this.scoreTimer += dt;
    while (this.scoreTimer >= 1) {
      this.scoreTimer -= 1;
      this.addScore(POINTS_PER_SECOND);
    }

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnProjectile();
      this.spawnTimer = Math.max(
        MIN_SPAWN_INTERVAL,
        START_SPAWN_INTERVAL - this.elapsed * SPAWN_INTERVAL_DECAY_PER_SECOND,
      );
    }

    this.invulnerableFor = Math.max(0, this.invulnerableFor - dt);

    const ease = Math.min(1, dt * 20);
    this.drawRow += (this.row - this.drawRow) * ease;
    this.drawCol += (this.col - this.drawCol) * ease;

    for (const p of this.projectiles) {
      p.pos += p.dir * p.speed * dt;
    }

    this.projectiles = this.projectiles.filter(p => {
      if (this.invulnerableFor <= 0 && this.collides(p)) {
        this.hit();
        return false;
      }
      return p.pos > -SPAWN_OFFSET - 1 && p.pos < GRID_SIZE + SPAWN_OFFSET;
    });

    for (const t of this.floatingTexts) t.age += dt;
    this.floatingTexts = this.floatingTexts.filter(t => t.age < FLOATING_TEXT_SECONDS);
  }

  private spawnProjectile(): void {
    const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
    this.projectiles.push({
      axis: Math.random() < 0.5 ? 'row' : 'col',
      lane: Math.floor(Math.random() * GRID_SIZE),
      pos: dir === 1 ? -SPAWN_OFFSET : GRID_SIZE - 1 + SPAWN_OFFSET,
      dir,
      speed: Math.min(MAX_SPEED, START_SPEED + this.elapsed * SPEED_GROWTH_PER_SECOND),
    });
  }

  private drawArrow(ctx: CanvasRenderingContext2D, p: Projectile): void {
    const size = CELL_PX * 0.18;
    const edge = p.dir === 1 ? size : BOARD_PX - size;
    const center = (p.lane + 0.5) * CELL_PX;
    const [x, y] = p.axis === 'row' ? [edge, center] : [center, edge];
    const angle = p.axis === 'row' ? (p.dir === 1 ? 0 : Math.PI) : (p.dir === 1 ? Math.PI / 2 : -Math.PI / 2);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size, -size);
    ctx.lineTo(-size * 0.4, 0);
    ctx.lineTo(-size, size);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private collides(p: Projectile): boolean {
    return p.axis === 'row'
      ? p.lane === this.row && Math.abs(p.pos - this.col) < HIT_DISTANCE
      : p.lane === this.col && Math.abs(p.pos - this.row) < HIT_DISTANCE;
  }

  private hit(): void {
    this.invulnerableFor = INVULNERABLE_SECONDS;
    const lost = this.score;
    this.addScore(-lost);
    this.floatingTexts.push({
      x: (this.col + 0.5) * CELL_PX,
      y: (this.row + 0.5) * CELL_PX,
      text: `-${lost}`,
      age: 0,
    });
  }

  // The loop runs outside Angular's zone, so re-enter it only when the
  // displayed score actually changes.
  private addScore(amount: number): void {
    this.zone.run(() => (this.score += amount));
  }

  private draw(): void {
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.clearRect(0, 0, BOARD_PX, BOARD_PX);

    // Grid.
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(c * CELL_PX, r * CELL_PX, CELL_PX, CELL_PX);
      }
    }
    ctx.strokeStyle = this.colors.goldDark;
    ctx.lineWidth = 1;
    for (let i = 1; i < GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_PX, 0);
      ctx.lineTo(i * CELL_PX, BOARD_PX);
      ctx.moveTo(0, i * CELL_PX);
      ctx.lineTo(BOARD_PX, i * CELL_PX);
      ctx.stroke();
    }

    // Lane warning: tint the lane of every projectile still outside the grid.
    ctx.fillStyle = 'rgba(255, 70, 70, 0.12)';
    for (const p of this.projectiles) {
      if (p.pos >= -0.5 && p.pos <= GRID_SIZE - 0.5) continue;
      if (p.axis === 'row') ctx.fillRect(0, p.lane * CELL_PX, BOARD_PX, CELL_PX);
      else ctx.fillRect(p.lane * CELL_PX, 0, CELL_PX, BOARD_PX);
    }

    // Direction arrows: on the edge a still-outside projectile will enter
    // from, pointing the way it travels.
    ctx.fillStyle = 'rgb(255, 90, 90)';
    for (const p of this.projectiles) {
      if (p.pos >= -0.5 && p.pos <= GRID_SIZE - 0.5) continue;
      this.drawArrow(ctx, p);
    }

    // Player block (blinks while invulnerable after a hit).
    const blinking = this.invulnerableFor > 0 && Math.floor(this.invulnerableFor * 12) % 2 === 0;
    const inset = CELL_PX * 0.12;
    ctx.fillStyle = blinking ? 'rgb(235, 60, 60)' : this.colors.gold;
    ctx.beginPath();
    ctx.roundRect(
      this.drawCol * CELL_PX + inset,
      this.drawRow * CELL_PX + inset,
      CELL_PX - inset * 2,
      CELL_PX - inset * 2,
      8,
    );
    ctx.fill();

    // Projectiles.
    ctx.fillStyle = 'rgb(255, 90, 90)';
    for (const p of this.projectiles) {
      const cell = p.axis === 'row' ? { x: p.pos, y: p.lane } : { x: p.lane, y: p.pos };
      ctx.beginPath();
      ctx.arc((cell.x + 0.5) * CELL_PX, (cell.y + 0.5) * CELL_PX, CELL_PX * 0.17, 0, Math.PI * 2);
      ctx.fill();
    }

    // Floating penalty texts.
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    for (const t of this.floatingTexts) {
      const progress = t.age / FLOATING_TEXT_SECONDS;
      ctx.fillStyle = `rgba(255, 90, 90, ${1 - progress})`;
      ctx.fillText(t.text, t.x, t.y - progress * CELL_PX * 0.8);
    }
  }
}
