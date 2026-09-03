import { Injectable } from '@angular/core';
import { AnimationSettingsService } from './animation-settings.service';
import { AudioService } from './audio.service';

@Injectable({
  providedIn: 'root',
})
export class GameAnimationService {
  constructor(private animationSettingsService: AnimationSettingsService,
    private audioService: AudioService
  ) {}

  private getAnimationLayer(): HTMLElement | null {
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

  private spawnBurst(x: number, y: number, size: number, duration: number, extraClass: string = ''): void {
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

  private spawnSparks(x: number, y: number, count: number, className: string = 'spark-particle'): void {
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
          { transform: 'translate(-50%, -50%) translate(0px, 0px) scale(1) rotate(0deg)', opacity: 1 },
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
    const anchor = cardElement?.querySelector(stat === 'attack' ? '.attack-value' : '.health') as HTMLElement | null;

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

async animateAttack(
  attackerElement: HTMLElement,
  targetElement: HTMLElement,
  targetPlayer: { Health: { changeHealth: (amount: number, duration: number, originX?: number, originY?: number) => void } },
  targetIndex: number,
  targetType: 'BOARD' | 'PLAYER',
  attackerDamage: number,
  defenderDamage: number,
  attackerPlayer: { Board: Array<{ id: string; changeHealth: (amount: number) => void } | null> },
  attackerId: string,
): Promise<void> {
  attackerElement.style.transformOrigin = '50% 100%';
  targetElement.style.transformOrigin = '50% 100%';
  attackerElement.style.willChange = 'transform, filter';
  targetElement.style.willChange = 'transform, filter';

  const attackerRect = attackerElement.getBoundingClientRect();
  const targetRect = targetElement.getBoundingClientRect();

  const attackerCenterX = attackerRect.left + attackerRect.width / 2;
  const attackerCenterY = attackerRect.top + attackerRect.height / 2;
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;

  const dx = targetCenterX - attackerCenterX;
  const dy = targetCenterY - attackerCenterY;

  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const swingAngle = Math.max(-34, Math.min(34, angle * 0.14));
  const lift = dy > 0 ? 8 : -8;

  // Movement tuning
  let attackerTravel = 0.50;   // Distance attacker travels toward target
  const attackerRecoil = 0.45;   // Distance after impact before returning

  let targetTravel = 0.50;     // Distance target lunges forward
  let targetRecoil = 0.45;     // Distance after impact before returning

  if (targetType === 'PLAYER')
  {
    attackerTravel = 1;
    targetTravel = 0;
    targetRecoil = 0;
  }

  // Wind-up: both combatants rotate the same amount before moving, each in the
  // opposite direction, like they're squaring up before the clash. Only the
  // target rotates too when it's an actual card (attacking player life has
  // nothing on the target side to wind up).
  const attackerWindup = attackerElement.animate(
    [
      { transform: 'rotate(0deg) translateY(0px) scale(1)', filter: 'brightness(1)' },
      { transform: `rotate(${swingAngle}deg) translateY(${lift}px) scale(1.03)`, filter: 'brightness(1.15)' },
    ],
    {
      duration: this.animationSettingsService.getAdjustedDuration(240),
      easing: 'ease-out',
    },
  );

  const windupFinished = [attackerWindup.finished];

  if (targetType === 'BOARD') {
    const targetWindup = targetElement.animate(
      [
        { transform: 'rotate(0deg) scale(1)' },
        { transform: `rotate(${-swingAngle}deg) scale(1.03)` },
      ],
      {
        duration: this.animationSettingsService.getAdjustedDuration(240),
        easing: 'ease-out',
      },
    );
    windupFinished.push(targetWindup.finished);
  }

  await Promise.all(windupFinished);

  const pulse = targetElement.animate(
    [
      { filter: 'brightness(1)' },
      { filter: 'brightness(1.3)' },
      { filter: 'brightness(1)' },
    ],
    {
      duration: this.animationSettingsService.getAdjustedDuration(360),
      easing: 'ease-out',
    },
  );

  const targetRotatePeak = targetType === 'BOARD' ? -swingAngle : 0;

  const attackerDash = attackerElement.animate(
  [
    {
      transform: 'translate(0px,0px) rotate(0deg) scale(1)',
    },
    {
      transform: `translate(${dx * attackerTravel}px, ${dy * attackerTravel}px)
                  rotate(${swingAngle}deg) scale(1.06)`,
      offset: 0.45,
    },
    {
      transform: `translate(${dx * attackerRecoil}px, ${dy * attackerRecoil}px)
                  rotate(${swingAngle * 0.5}deg) scale(1.02)`,
      offset: 0.60,
    },
    {
      transform: 'translate(0px,0px) rotate(0deg) scale(1)',
    },
  ],
  {
    duration: this.animationSettingsService.getAdjustedDuration(500),
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
);

const targetDash = targetElement.animate(
  [
    {
      transform: 'translate(0px,0px) rotate(0deg) scale(1)',
    },
    {
      transform: `translate(${-dx * targetTravel}px, ${-dy * targetTravel}px)
                  rotate(${targetRotatePeak}deg) scale(1.05)`,
      offset: 0.45,
    },
    {
      transform: `translate(${-dx * targetRecoil}px, ${-dy * targetRecoil}px)
                  rotate(${targetRotatePeak * 0.5}deg) scale(1.02)`,
      offset: 0.60,
    },
    {
      transform: 'translate(0px,0px) rotate(0deg) scale(1)',
    },
  ],
  {
    duration: this.animationSettingsService.getAdjustedDuration(500),
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
);

  await new Promise(resolve =>
    setTimeout(resolve, this.animationSettingsService.getAdjustedDuration(220))
  );

  this.spawnBurst(targetCenterX, targetCenterY, 150, 400, 'attack-burst');
  this.spawnSparks(targetCenterX, targetCenterY, 6);

  switch (targetType) {
    case 'PLAYER':
      targetPlayer.Health.changeHealth(-attackerDamage, 500, dx, dy);
      break;

    case 'BOARD':
      if (targetPlayer && targetIndex >= 0) {
        const boardTarget = targetPlayer as unknown as {
          Board: Array<{ changeHealth: (amount: number) => void } | null>;
        };
        boardTarget.Board[targetIndex]?.changeHealth?.(-attackerDamage);
        const targetCardId = targetElement.getAttribute('data-game-id');
        if (targetCardId) {
          this.spawnFloatingNumber(targetCardId, -attackerDamage, 'health');
        }
      }

      const attackerIndex = attackerPlayer.Board.findIndex(card => card?.id === attackerId);
      if (attackerIndex !== -1) {
        attackerPlayer.Board[attackerIndex]?.changeHealth?.(-defenderDamage);
        this.spawnFloatingNumber(attackerId, -defenderDamage, 'health');
      }

      break;
  }

  this.audioService.playSfx("audio/sound1.mp3");

  await Promise.all([
    attackerDash.finished,
    targetDash.finished,
    pulse.finished,
  ]);

  attackerElement.style.transform = '';
  attackerElement.style.filter = '';
  targetElement.style.transform = '';
  targetElement.style.filter = '';
}
  async animateCardDrawn(deck: string, duration:number, up: boolean): Promise<void> {
    await this.nextFrame();

    const deckElement = document.querySelector(`[data-game-id="${deck}"]`) as HTMLElement | null;
    const cardImageElement = document.querySelector('.card-icon') as HTMLElement | null;

    if (!deckElement || !cardImageElement) {
      return;
    }

    cardImageElement.style.display = 'block';
    cardImageElement.style.position = 'fixed';
    const deckRect = deckElement.getBoundingClientRect();
    const startX = deckRect.left + deckRect.width / 2 - cardImageElement.offsetWidth;
    const startY = deckRect.top + deckRect.height / 2 - cardImageElement.offsetHeight / 2;

    cardImageElement.style.left = `${startX}px`;
    cardImageElement.style.top = `${startY}px`;
    cardImageElement.style.willChange = 'transform, opacity';
    cardImageElement.style.transformOrigin = '50% 0%';

    const animation = cardImageElement.animate(
  [
    {
      transform: 'translate(0px, 0px) scale(0.8) rotate(-22deg)',
      opacity: 1,
      offset: 0
    },

    // Card comes out of deck
    {
      transform: `translate(0px, ${-deckRect.height}px) scale(1) rotate(12deg)`,
      opacity: 1,
      offset: 0.3
    },

    // Start swinging
    {
      transform: `translate(0px, ${-deckRect.height}px) scale(1) rotate(18deg)`,
      opacity: 1,
      offset: 0.35
    },
    {
      transform: `translate(0px, ${-deckRect.height}px) scale(1) rotate(-10deg)`,
      opacity: 1,
      offset: 0.45
    },
    {
      transform: `translate(0px, ${-deckRect.height}px) scale(1) rotate(-15deg)`,
      opacity: 1,
      offset: 0.55
    },
    {
      transform: `translate(0px, ${-deckRect.height}px) scale(1) rotate(0deg)`,
      opacity: 1,
      offset: 0.6
    },

    // Moving sideways
    {
      transform: `translate(${-deckRect.width / 2}px, ${-deckRect.height}px) scale(1) rotate(15deg)`,
      opacity: 1,
      offset: 0.65
    },

    // Smaller swings as it leaves
    {
      transform: `translate(${-deckRect.width / 2}px, ${-deckRect.height}px) scale(1) rotate(-7deg)`,
      opacity: 1,
      offset: 0.75
    },
    {
      transform: `translate(${-deckRect.width / 2}px, ${-deckRect.height}px) scale(1) rotate(5deg)`,
      opacity: 1,
      offset: 0.82
    },
    {
      transform: `translate(${-deckRect.width / 2}px, ${-deckRect.height}px) scale(1) rotate(-2deg)`,
      opacity: 1,
      offset: 0.88
    },

    // Fly away
    {
      transform: `translate(${-deckRect.width / 2}px, ${up ? '-1000px' : '1000px'}) scale(1) rotate(90deg)`,
      opacity: 0,
      offset: 1
    }
  ],
  {
    duration: this.animationSettingsService.getAdjustedDuration(duration),
    easing: 'ease-out',
  }
);

    await animation.finished;

    cardImageElement.style.display = 'none';
    cardImageElement.style.transform = '';
    cardImageElement.style.opacity = '';
    cardImageElement.style.position = '';
    cardImageElement.style.left = '';
    cardImageElement.style.top = '';
    cardImageElement.style.willChange = '';
    return;
  }


async animateAddedCard(
  cardId: string,
  deckEnd: string,
  cardOrigin: string,
  duration: number
) {
  await this.nextFrame();

  let origin = document.querySelector(
    `[data-game-id="${cardOrigin}"]`
  ) as HTMLElement | null;

  const destination = document.querySelector(
    `[data-game-id="${deckEnd}"]`
  ) as HTMLElement | null;

  const cardImageElement = document.querySelector(
    '.card-icon'
  ) as HTMLImageElement | null;

  if (!destination || !cardImageElement) return;

  if(!origin)
  {
    origin = destination;
  }

  cardImageElement.style.display = 'block';
  cardImageElement.style.position = 'fixed';
  cardImageElement.src = `/images/cards/${cardId}.webp`;
  cardImageElement.style.willChange = 'transform, opacity';
  cardImageElement.style.transformOrigin = '50% 0%';

  const destRect = destination.getBoundingClientRect();
  const originRect = origin.getBoundingClientRect();

  // Position the card at the origin
  cardImageElement.style.left = `${originRect.left}px`;
  cardImageElement.style.top = `${originRect.top}px`;

  // Force layout so cardRect is correct
  const cardRect = cardImageElement.getBoundingClientRect();

  // Distance from origin -> destination
  const endX =
    destRect.left - originRect.left + originRect.width / 2;

  const endY =
    destRect.top - originRect.top - originRect.height;

  const animation = cardImageElement.animate(
    [
      // Start
      {
        transform: 'translate(0px, 0px) scale(0.6) rotate(-10deg)',
        opacity: 1,
        offset: 0
      },

      // Move towards destination
      {
        transform: `translate(${endX * 0.25}px, ${endY * 0.25}px)
                    scale(0.75) rotate(7deg)`,
        opacity: 1,
        offset: 0.15
      },

      // First swing
      {
        transform: `translate(${endX * 0.45}px, ${endY * 0.45}px)
                    scale(0.85) rotate(-9deg)`,
        opacity: 1,
        offset: 0.25
      },

      // Swing back
      {
        transform: `translate(${endX * 0.6}px, ${endY * 0.6}px)
                    scale(0.9) rotate(10deg)`,
        opacity: 1,
        offset: 0.35
      },

      // Smaller swing
      {
        transform: `translate(${endX * 0.72}px, ${endY * 0.72}px)
                    scale(0.93) rotate(-7deg)`,
        opacity: 1,
        offset: 0.43
      },

      // Swing back again
      {
        transform: `translate(${endX * 0.82}px, ${endY * 0.82}px)
                    scale(0.96) rotate(6deg)`,
        opacity: 1,
        offset: 0.51
      },

      // Smaller movement
      {
        transform: `translate(${endX * 0.89}px, ${endY * 0.89}px)
                    scale(0.98) rotate(-4deg)`,
        opacity: 1,
        offset: 0.59
      },

      // Almost settled
      {
        transform: `translate(${endX * 0.94}px, ${endY * 0.94}px)
                    scale(1) rotate(2deg)`,
        opacity: 1,
        offset: 0.67
      },

      // Final small wiggle
      {
        transform: `translate(${endX * 0.97}px, ${endY * 0.97}px)
                    scale(1) rotate(-1deg)`,
        opacity: 1,
        offset: 0.75
      },

      // Arrive at destination
      {
        transform: `translate(${endX}px, ${endY}px)
                    scale(1) rotate(0deg)`,
        opacity: 1,
        offset: 0.85
      },

      // Shrink into deck
      {
        transform: `translate(${endX}px, ${endY + originRect.height}px)
                    scale(0.2) rotate(1deg)`,
        opacity: 0,
        offset: 1
      }
    ],
    {
      duration: this.animationSettingsService.getAdjustedDuration(duration),
      easing: 'ease-out'
    }
  );

  await animation.finished;

  cardImageElement.src = '/images/cards/reverse_card.svg';
  cardImageElement.style.display = 'none';
  cardImageElement.style.transform = '';
  cardImageElement.style.opacity = '';
  cardImageElement.style.position = '';
  cardImageElement.style.left = '';
  cardImageElement.style.top = '';
  cardImageElement.style.willChange = '';
}



  async animateDeckCard(startIcon: string, cardOrigin: string, deckEnd: string, duration: number): Promise<void> {
    await this.nextFrame();

    const origin = document.querySelector(`[data-game-id="${cardOrigin}"]`) as HTMLElement | null;
    const destination = document.querySelector(`[data-game-id="${deckEnd}"]`) as HTMLElement | null;
    if (!origin || !destination) {
      return;
    }

    const icon = document.querySelector(startIcon) as HTMLElement | null;
    if (!icon) {
      return;
    }

    icon.style.display = 'block';
    const iconRect = icon.getBoundingClientRect();
    const start = this.getCenter(origin);
    const end = destination.getBoundingClientRect();
    const endCenter = {
      x: end.left + end.width / 2,
      y: end.top,
    };

    const dx = endCenter.x - start.x - (iconRect.width / 4);
    const dy = endCenter.y - start.y - iconRect.height;

    icon.style.position = 'fixed';
    icon.style.left = `${start.x - iconRect.width / 2}px`;
    icon.style.top = `${start.y - iconRect.height / 2}px`;
    icon.style.willChange = 'transform';

    const animation = icon.animate(
      [
        { transform: 'translate(0px, 0px) rotate(0deg) scale(0.9)', offset: 0.1 },
        { transform: `translate(${dx * 0.45}px, ${dy * 0.3}px) rotate(14deg) scale(1.05)`, offset: 0.55 },
        { transform: `translate(${dx}px, ${dy}px) rotate(0deg) scale(1)`, offset: 0.8 },
        { transform: `translate(${dx}px, ${dy}px) rotate(0deg) scale(1)`, opacity: 1, offset: 0.9 },
        { transform: `translate(${dx}px, ${dy + iconRect.height * 2}px) rotate(180deg) scale(0.8)`, opacity: 0, offset: 1 },
      ],
      {
        duration: this.animationSettingsService.getAdjustedDuration(duration),
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    );

    await animation.finished;



    icon.style.display = 'none';
  }

async animateSkillEfect(card: string): Promise<void>
{
  const origin = document.querySelector(`[data-game-id="${card}"]`) as HTMLElement | null;
  if (origin == null)
  {
    return;
  }

  const el = origin.querySelector('.card-info') as HTMLElement | null;
  if (el == null)
  {
    return;
  }

  const center = this.getCenter(origin);
  this.spawnBurst(center.x, center.y, 130, 500, 'effect-glow');

  const animation = el.animate(
    [
      { transform: 'translateX(-50%) translateY(0) scale(1)' },
      { transform: 'translateX(-50%) translateY(-2rem) scale(2) rotateZ(-180deg)' },
      { transform: 'translateX(-50%) translateY(0) scale(1) rotateZ(0)' }
    ],
    {
      duration: this.animationSettingsService.getAdjustedDuration(750),
      easing: 'ease-in-out'
    }
  );

  await animation.finished;
}

async animateSpellCast(cardId: string): Promise<void> {
  await this.nextFrame();

  const element = document.querySelector(`[data-game-id="${cardId}"]`) as HTMLElement | null;
  if (!element) {
    return;
  }

  const center = this.getCenter(element);
  this.spawnBurst(center.x, center.y, 230, 640, 'spell-burst');
  this.spawnSparks(center.x, center.y, 10);

  element.style.transformOrigin = '50% 50%';
  element.style.willChange = 'transform, filter';

  const animation = element.animate(
    [
      { transform: 'scale(0.35) rotate(-16deg)', filter: 'brightness(2.6) saturate(1.7)', opacity: 0.2 },
      { transform: 'scale(1.2) rotate(6deg)', filter: 'brightness(1.6) saturate(1.3)', opacity: 1, offset: 0.55 },
      { transform: 'scale(0.95) rotate(-2deg)', filter: 'brightness(1.1)', offset: 0.8 },
      { transform: 'scale(1) rotate(0deg)', filter: 'brightness(1)' },
    ],
    {
      duration: this.animationSettingsService.getAdjustedDuration(650),
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    },
  );

  await animation.finished;
  element.style.transform = '';
  element.style.filter = '';
}

  async createProjectile(source: string, target: string, optionalTarget: string = "", amount: number = 0): Promise<void> {
  if (source === target) {
    return;
  }

  const projectile = document.createElement('div');
  projectile.classList.add('proyectile');
  if (amount > 0) {
    projectile.classList.add('heal');
  } else if (amount < 0) {
    projectile.classList.add('damage');
  }
  const layer = this.getAnimationLayer();
  layer?.appendChild(projectile);
  await this.nextFrame();

  let sourceElement = document.querySelector(`[data-game-id="${source}"]`) as HTMLElement | null;
  const targetElement = document.querySelector(`[data-game-id="${target}"]`) as HTMLElement | null;

  if (optionalTarget && !sourceElement) {
    sourceElement = document.querySelector(`[data-game-id="${optionalTarget}"]`) as HTMLElement | null;
  }

  if (!projectile || !sourceElement || !targetElement) {
    projectile.remove();
    return;
  }

  const start = this.getCenter(sourceElement);
  const end = this.getCenter(targetElement);
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  projectile.style.left = `${start.x}px`;
  projectile.style.top = `${start.y}px`;
  projectile.style.transform = 'translate(-50%, -50%)';

  // How high the arc lifts above the straight line, in px.
  // Scale it a bit with distance so short throws don't look flat
  // and long throws don't look absurdly high.
  const distance = Math.hypot(dx, dy);
  const arcHeight = Math.min(160, Math.max(50, distance * 0.35));

  const steps = 20;
  const keyframes: Keyframe[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;

    // Linear position along the straight path
    const x = dx * t;
    const y = dy * t;

    // Parabolic lift: 0 at t=0 and t=1, peak at t=0.5
    // (negative because CSS y grows downward, so "up" is negative)
    const lift = -4 * arcHeight * t * (1 - t);

    // Slight forward tilt toward camera at the peak to sell the
    // "above the table" feel given the perspective/rotateX parent
    const z = 60 * Math.sin(Math.PI * t);

    // Scale: slightly bigger at the peak (closer to camera),
    // slightly smaller as it lands (settling down)
    const scale = 0.7 + 0.35 * Math.sin(Math.PI * t) - 0.1 * t;

    const rotate = 1080 * t;

    // Fade in fast, hold, fade out near landing
    const opacity = t < 0.08 ? t / 0.08 * 0.9 + 0.1
      : t > 0.85 ? 1 - (t - 0.85) / 0.15 * 0.8
      : 1;

    keyframes.push({
      transform: `translate(-50%, -50%) translate3d(${x}px, ${y + lift}px, ${z}px) scale(${scale}) rotate(${rotate}deg)`,
      opacity,
    });
  }

  const animation = projectile.animate(keyframes, {
    duration: this.animationSettingsService.getAdjustedDuration(250),
    easing: 'ease-in-out',
    fill: 'forwards',
  });

  await animation.finished;
  projectile.remove();

  this.spawnBurst(end.x, end.y, 120, 380, amount > 0 ? 'effect-glow' : 'attack-burst');
  this.spawnSparks(end.x, end.y, 5);
}

  async animateUnitDeath(element: HTMLElement): Promise<void> {
    if (!element) {
      return;
    }

    const center = this.getCenter(element);
    this.spawnSparks(center.x, center.y, 8, 'debris-particle');

    const animation = element.animate(
      [
        { opacity: 1, transform: 'scale(1) rotate(0deg)', filter: 'brightness(1)' },
        { opacity: 0.25, transform: 'scale(0.85) rotate(8deg)', filter: 'brightness(1.3)' },
        { opacity: 0, transform: 'scale(0.55) rotate(16deg)', filter: 'brightness(0.8)' },
      ],
      {
        duration: this.animationSettingsService.getAdjustedDuration(420),
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'forwards',
      },
    );

    await animation.finished;
    element.style.opacity = '0';
    element.style.transform = 'scale(0.55) rotate(16deg)';
  }
}
