import { Injectable } from '@angular/core';
import { AnimationSettingsService } from './animation-settings.service';

// Low-level building blocks shared by every animation service: the overlay
// layer, geometry helpers, and small reusable effects (bursts, sparks,
// floating numbers, shakes).
@Injectable({
  providedIn: 'root',
})
export class AnimationFxService {
  constructor(private animationSettingsService: AnimationSettingsService) {}

  getAnimationLayer(): HTMLElement | null {
    return document.querySelector('.animation-layer') as HTMLElement | null;
  }

  nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }

  getCenter(element: HTMLElement): { x: number; y: number } {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }

  spawnBurst(x: number, y: number, size: number, duration: number, extraClass: string = ''): void {
    const layer = this.getAnimationLayer();
    if (!layer) {
      return;
    }

    const burst = document.createElement('div');
    burst.classList.add('impact-burst');
    if (extraClass) {
      burst.classList.add(extraClass);
    }
    burst.style.left = `${x}px`;
    burst.style.top = `${y}px`;
    burst.style.width = `${size}px`;
    burst.style.height = `${size}px`;
    layer.appendChild(burst);

    const animation = burst.animate(
      [
        { transform: 'translate(-50%, -50%) scale(0.25) rotate(0deg)', opacity: 0 },
        { transform: 'translate(-50%, -50%) scale(1.05) rotate(30deg)', opacity: 1, offset: 0.35 },
        { transform: 'translate(-50%, -50%) scale(1.55) rotate(65deg)', opacity: 0 },
      ],
      {
        duration: this.animationSettingsService.getAdjustedDuration(duration),
        easing: 'ease-out',
      },
    );

    const cleanup = () => burst.remove();
    animation.finished.then(cleanup).catch(cleanup);
  }

  spawnSparks(x: number, y: number, count: number, className: string = 'spark-particle'): void {
    const layer = this.getAnimationLayer();
    if (!layer) {
      return;
    }

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.classList.add(className);
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      layer.appendChild(particle);

      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
      const distance = 36 + Math.random() * 46;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      const spin = 160 + Math.random() * 200;

      const animation = particle.animate(
        [
          {
            transform: 'translate(-50%, -50%) translate(0px, 0px) scale(1) rotate(0deg)',
            opacity: 1,
          },
          {
            transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(0.25) rotate(${spin}deg)`,
            opacity: 0,
          },
        ],
        {
          duration: this.animationSettingsService.getAdjustedDuration(420 + Math.random() * 220),
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        },
      );

      const cleanup = () => particle.remove();
      animation.finished.then(cleanup).catch(cleanup);
    }
  }

  // Spawns a floating +/- number over a card's attack or health stat, anchored to that
  // stat's own on-screen position rather than living inside the card, so it always reads
  // clearly above neighbouring cards instead of being clipped/overlapped by them.
  spawnFloatingNumber(cardId: string, amount: number, stat: 'attack' | 'health'): void {
    if (!amount) {
      return;
    }

    const layer = this.getAnimationLayer();
    const cardElement = document.querySelector(`[data-game-id="${cardId}"]`) as HTMLElement | null;
    const anchor = cardElement?.querySelector(
      stat === 'attack' ? '.attack-value' : '.health',
    ) as HTMLElement | null;

    if (!layer || !anchor) {
      return;
    }

    const rect = anchor.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;

    const el = document.createElement('div');
    el.classList.add('floating-number', amount > 0 ? 'positive' : 'negative');
    el.textContent = `${amount > 0 ? '+' : ''}${amount}`;
    el.style.left = `${originX}px`;
    el.style.top = `${originY}px`;

    layer.appendChild(el);

    // Randomised per-hit so several floating numbers landing at once (a multi-target
    // effect, a counter-attack) drift apart instead of stacking exactly on top of each other.
    const drift = (Math.random() - 0.5) * 46;
    const tilt = (Math.random() - 0.5) * 18;

    const animation = el.animate(
      [
        {
          transform: 'translate(-50%, -50%) translate(0px, 8px) scale(0.35) rotate(0deg)',
          opacity: 0,
          filter: 'blur(0px)',
        },
        {
          transform: `translate(-50%, -50%) translate(${drift * 0.2}px, -20px) scale(1.4) rotate(${tilt}deg)`,
          opacity: 1,
          filter: 'blur(0px)',
          offset: 0.25,
        },
        {
          transform: `translate(-50%, -50%) translate(${drift * 0.55}px, -38px) scale(1) rotate(${tilt * 0.3}deg)`,
          opacity: 1,
          filter: 'blur(0px)',
          offset: 0.6,
        },
        {
          transform: `translate(-50%, -50%) translate(${drift}px, -78px) scale(0.85) rotate(0deg)`,
          opacity: 0,
          filter: 'blur(3px)',
        },
      ],
      {
        duration: this.animationSettingsService.getAdjustedDuration(950),
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    );

    const cleanup = () => el.remove();
    animation.finished.then(cleanup).catch(cleanup);
  }

  // Twinkling stars scattered over an element (e.g. a deck that was just
  // enchanted). Appended to <body> rather than the tilted animation layer so
  // they line up exactly with the element's on-screen box.
  spawnSparkles(element: HTMLElement, count: number): Promise<void> {
    const rect = element.getBoundingClientRect();
    const animations: Promise<unknown>[] = [];

    for (let i = 0; i < count; i++) {
      const sparkle = document.createElement('div');
      sparkle.classList.add('deck-sparkle');
      const size = 0.9 + Math.random() * 1.1;
      sparkle.style.width = `${size}rem`;
      sparkle.style.height = `${size}rem`;
      sparkle.style.left = `${rect.left + Math.random() * rect.width}px`;
      sparkle.style.top = `${rect.top + Math.random() * rect.height}px`;
      document.body.appendChild(sparkle);

      const spin = 90 + Math.random() * 120;
      const animation = sparkle.animate(
        [
          { transform: 'translate(-50%, -50%) scale(0) rotate(0deg)', opacity: 0 },
          {
            transform: `translate(-50%, -50%) scale(1) rotate(${spin * 0.5}deg)`,
            opacity: 1,
            offset: 0.4,
          },
          { transform: `translate(-50%, -60%) scale(0) rotate(${spin}deg)`, opacity: 0 },
        ],
        {
          duration: this.animationSettingsService.getAdjustedDuration(550 + Math.random() * 350),
          delay: this.animationSettingsService.getAdjustedDuration(Math.random() * 450),
          easing: 'ease-in-out',
          fill: 'backwards',
        },
      );

      const cleanup = () => sparkle.remove();
      animations.push(animation.finished.then(cleanup, cleanup));
    }

    return Promise.all(animations).then(() => undefined);
  }

  // A little shake, used to call out that an event's source (see
  // GameComponent.playEvent) was a global effect rather than a board card —
  // e.g. a damage-over-time effect ticking on its own. Same
  // resolve-by-data-game-id + Web Animations API idiom as the rest of the
  // animation services, so it works on any [data-game-id] element, not just effects.
  async shakeElement(id: string): Promise<void> {
    const element = document.querySelector(`[data-game-id="${id}"]`) as HTMLElement | null;
    if (element == null) {
      return;
    }

    const animation = element.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-4px)' },
        { transform: 'translateX(4px)' },
        { transform: 'translateX(-3px)' },
        { transform: 'translateX(3px)' },
        { transform: 'translateX(0)' },
      ],
      {
        duration: this.animationSettingsService.getAdjustedDuration(350),
        easing: 'ease-in-out',
      },
    );

    await animation.finished;
    element.style.transform = '';
  }
}
