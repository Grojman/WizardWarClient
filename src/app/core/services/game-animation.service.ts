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

  this.spawnBurst(targetCenterX + targetRect.width, targetCenterY, 150, 400, 'attack-burst');
  this.spawnSparks(targetCenterX + targetRect.width, targetCenterY, 6);

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
          { transform: `translate(-50%, -50%) scale(1) rotate(${spin * 0.5}deg)`, opacity: 1, offset: 0.4 },
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

  // A wand held by its handle comes in from the left of the deck, taps it
  // twice with its tip (pivoting on the handle, like a wrist flick) and
  // leaves, then the deck sparkles to show it was enchanted.
  async animateModifyDeck(deck: string, duration: number): Promise<void> {
    await this.nextFrame();

    const deckElement = document.querySelector(`[data-game-id="${deck}"]`) as HTMLElement | null;
    if (!deckElement) {
      return;
    }

    const wand = document.createElement('img');
    wand.classList.add('wand-tool');
    wand.src = '/images/board/wand.svg';
    wand.alt = '';
    document.body.appendChild(wand);

    const deckRect = deckElement.getBoundingClientRect();
    const length = wand.offsetWidth;
    const thickness = wand.offsetHeight;

    // wand.svg is drawn horizontally: handle on the left edge, tip on the
    // right. Place the handle so that, at the tap angle, the tip lands on
    // the upper part of the deck.
    const restAngle = -28;
    const tapAngle = 14;
    const tapRad = (tapAngle * Math.PI) / 180;
    const tip = {
      x: deckRect.left + deckRect.width * 0.5,
      y: deckRect.top + deckRect.height * 0.22,
    };
    const handleX = tip.x - length * Math.cos(tapRad);
    const handleY = tip.y - length * Math.sin(tapRad);

    wand.style.left = `${handleX}px`;
    wand.style.top = `${handleY - thickness / 2}px`;

    const away = `translate(${-length * 0.6}px, ${thickness * 2}px)`;
    const adjustedDuration = this.animationSettingsService.getAdjustedDuration(duration);
    const tapOffsets = [0.42, 0.64];

    const animation = wand.animate(
      [
        { transform: `${away} rotate(${restAngle - 12}deg)`, opacity: 0, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', offset: 0 },
        { transform: `translate(0px, 0px) rotate(${restAngle}deg)`, opacity: 1, easing: 'ease-in', offset: 0.28 },
        { transform: `translate(0px, 0px) rotate(${tapAngle}deg)`, opacity: 1, easing: 'ease-out', offset: tapOffsets[0] },
        { transform: `translate(0px, 0px) rotate(${restAngle * 0.6}deg)`, opacity: 1, easing: 'ease-in', offset: 0.53 },
        { transform: `translate(0px, 0px) rotate(${tapAngle}deg)`, opacity: 1, easing: 'ease-out', offset: tapOffsets[1] },
        { transform: `translate(0px, 0px) rotate(${restAngle}deg)`, opacity: 1, easing: 'ease-in', offset: 0.78 },
        { transform: `${away} rotate(${restAngle - 12}deg)`, opacity: 0, offset: 1 },
      ],
      { duration: adjustedDuration, fill: 'forwards' },
    );

    // Each tap sends a small flash through the deck.
    const tapTimers = tapOffsets.map((offset) =>
      setTimeout(() => {
        this.spawnSparks(tip.x, tip.y, 4);
        deckElement.animate(
          [
            { transform: 'scale(1)', filter: 'brightness(1)' },
            { transform: 'scale(0.96)', filter: 'brightness(1.35)', offset: 0.4 },
            { transform: 'scale(1)', filter: 'brightness(1)' },
          ],
          { duration: this.animationSettingsService.getAdjustedDuration(220), easing: 'ease-out' },
        );
      }, adjustedDuration * offset),
    );

    await animation.finished.catch(() => undefined);
    tapTimers.forEach(clearTimeout);
    wand.remove();

    await this.spawnSparkles(deckElement, 14);
  }

  // Mirror of animateAddedCard's ending: a face-down card the size of the
  // deck rises out from behind it (clip-path hides whatever is still below
  // the deck's top edge), then swings off toward its owner's hand.
  async animateCardDrawn(deck: string, duration:number, up: boolean): Promise<void> {
    await this.nextFrame();

    const deckElement = document.querySelector(`[data-game-id="${deck}"]`) as HTMLElement | null;
    if (!deckElement) {
      return;
    }

    const deckRect = deckElement.getBoundingClientRect();
    const width = deckRect.width;
    const height = deckRect.height;

    // Resting spot: same box as the deck, sitting right on top of it.
    const card = document.createElement('div');
    card.classList.add('added-card-ghost', 'face-down');
    card.style.left = `${deckRect.left}px`;
    card.style.top = `${deckRect.top - height}px`;
    card.style.width = `${width}px`;
    card.style.height = `${height}px`;
    card.style.transformOrigin = '50% 0%';
    document.body.appendChild(card);

    // The first stretch is the card sliding up out of the deck; the rest is
    // the original draw flight, squeezed into what's left of the timeline.
    // Position keeps changing at every offset of the flight (never repeated
    // verbatim between consecutive keyframes) and it uses 'linear' easing,
    // so the browser doesn't decelerate-to-zero and re-accelerate at each
    // keyframe boundary - that combination is what previously made the card
    // look like it "stopped" at each pose instead of flowing between them.
    const emerge = 0.3;
    const at = (offset: number) => emerge + offset * (1 - emerge);
    const midX = -width / 2;
    const peakY = ((up ? 1 : -1) * height) * 1.15;
    const finalY = up ? -1000 : 1000;
    const shown = 'inset(0px 0px 0px 0px)';

    const animation = card.animate(
  [
    // Hidden behind the deck
    {
      transform: `translate(0px, ${height}px) rotate(0)`,
      clipPath: `inset(0px 0px ${height}px 0px)`,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      offset: 0
    },

    // Fully out, sitting on top of the deck
    {
      transform: 'translate(0px, 0px) rotate(0)',
      clipPath: shown,
      easing: 'linear',
      offset: emerge
    },

    // Card leaves the deck, settling upright
    {
      transform: `translate(0px, ${peakY * 0.5}px) rotate(0)`,
      clipPath: shown,
      offset: at(0.14)
    },
    {
      transform: `translate(${midX * 0.2}px, ${peakY * 0.95}px) rotate(25deg)`,
      clipPath: shown,
      offset: at(0.28)
    },

    // Drifting sideways, upright
    {
      transform: `translate(${midX * 0.45}px, ${peakY}px) rotate(35deg)`,
      clipPath: shown,
      offset: at(0.42)
    },
    {
      transform: `translate(${midX * 0.7}px, ${peakY * 0.85}px) rotate(45deg)`,
      clipPath: shown,
      offset: at(0.56)
    },
    {
      transform: `translate(${midX * 0.9}px, ${peakY * 0.55}px) rotate(65deg)`,
      clipPath: shown,
      offset: at(0.7)
    },

    // Settling into the exit line
    {
      transform: `translate(${midX}px, ${peakY * 0.15}px) rotate(35deg)`,
      clipPath: shown,
      opacity: 1,
      offset: at(0.82)
    },
    {
      transform: `translate(${midX}px, ${finalY * 0.35}px) rotate(0deg)`,
      clipPath: shown,
      opacity: 1,
      offset: at(0.92)
    },

    // Fly away
    {
      transform: `translate(${midX}px, ${finalY}px) rotate(90deg)`,
      clipPath: shown,
      opacity: 0,
      offset: 1
    }
  ],
  {
    duration: this.animationSettingsService.getAdjustedDuration(duration),
    fill: 'forwards',
  }
);

    await animation.finished.catch(() => undefined);
    card.remove();
  }


  // Own draws: we already know which card it is, so it rises face-up out of
  // the deck (same clip-path trick as animateCardDrawn), is shown off for a
  // moment and then flies straight into its slot in the hand, like
  // animateCardPlayed in reverse. `onEnterHand` adds the card to the hand so
  // its final slot can be measured; it stays hidden until the ghost lands.
  async animateCardDrawnToHand(
    deck: string,
    playerId: string,
    cardId: string,
    imageUrl: string | undefined,
    duration: number,
    onEnterHand: () => void,
  ): Promise<void> {
    await this.nextFrame();

    const deckElement = document.querySelector(`[data-game-id="${deck}"]`) as HTMLElement | null;
    if (!deckElement) {
      onEnterHand();
      return;
    }

    const deckRect = deckElement.getBoundingClientRect();
    const width = deckRect.width;
    const height = deckRect.height;
    const homeLeft = deckRect.left;
    const homeTop = deckRect.top - height;

    const card = document.createElement('div');
    card.classList.add('added-card-ghost');
    card.style.left = `${homeLeft}px`;
    card.style.top = `${homeTop}px`;
    card.style.width = `${width}px`;
    card.style.height = `${height}px`;
    card.style.backgroundImage =
      `url('/images/cards/${imageUrl ?? ''}'), url('/images/cards/placeholder.webp')`;
    document.body.appendChild(card);

    // Add the card now and let Angular render it, so the rest of the hand
    // has already shifted over and the new slot's position is final.
    onEnterHand();
    await this.nextFrame();
    await this.nextFrame();

    const slot = document.querySelector(
      `[data-hand-id="${playerId}"] [data-game-id="${cardId}"]`
    ) as HTMLElement | null;
    if (slot) {
      slot.style.visibility = 'hidden';
    }

    const slotRect = slot?.getBoundingClientRect();
    const dx = slotRect ? slotRect.left + slotRect.width / 2 - (homeLeft + width / 2) : 0;
    const dy = slotRect ? slotRect.top + slotRect.height / 2 - (homeTop + height / 2) : 0;
    const endScale = slotRect ? slotRect.height / height : 1;

    const showY = -height * 0.35;
    const showScale = 1.3;
    const shown = 'inset(0px 0px 0px 0px)';

    const animation = card.animate(
      [
        // Hidden behind the deck
        {
          transform: `translate(0px, ${height}px) scale(1)`,
          clipPath: `inset(0px 0px ${height}px 0px)`,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          offset: 0,
        },
        // Fully out, sitting on top of the deck
        {
          transform: 'translate(0px, 0px) scale(1)',
          clipPath: shown,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          offset: 0.28,
        },
        // Lifted and shown off
        {
          transform: `translate(0px, ${showY}px) scale(${showScale})`,
          clipPath: shown,
          easing: 'linear',
          offset: 0.45,
        },
        {
          transform: `translate(0px, ${showY - 6}px) scale(${showScale * 1.03})`,
          clipPath: shown,
          easing: 'cubic-bezier(0.55, 0, 0.75, 0.2)',
          offset: 0.6,
        },
        // Into the hand
        {
          transform: `translate(${dx}px, ${dy - 14}px) scale(${endScale * 1.08}) rotate(-4deg)`,
          clipPath: shown,
          easing: 'ease-out',
          offset: 0.9,
        },
        {
          transform: `translate(${dx}px, ${dy}px) scale(${endScale}) rotate(0deg)`,
          clipPath: shown,
          offset: 1,
        },
      ],
      {
        duration: this.animationSettingsService.getAdjustedDuration(duration),
        fill: 'forwards',
      },
    );

    await animation.finished.catch(() => undefined);

    if (slot) {
      slot.style.visibility = '';
    }
    // Same as animateCardPlayed: give the real card a frame to show under
    // the ghost before removing it.
    requestAnimationFrame(() => requestAnimationFrame(() => card.remove()));
  }

  // Card 34: the whole screen goes pitch dark except for two white rhombus
  // eyes staring out, then fades away.
  async animateCreatureEyes(): Promise<void> {
    const overlay = document.createElement('div');
    overlay.classList.add('creature-eyes-overlay');
    document.body.appendChild(overlay);

    const animation = overlay.animate(
      [
        { opacity: 0, transform: 'scale(1.08)', offset: 0 },
        { opacity: 0.9, transform: 'scale(1.02)', easing: 'linear', offset: 0.2 },
        { opacity: 0.9, transform: 'scale(1)', easing: 'ease-in', offset: 0.65 },
        { opacity: 0, transform: 'scale(1)', offset: 1 },
      ],
      {
        duration: this.animationSettingsService.getAdjustedDuration(2200),
        easing: 'ease-out',
        fill: 'forwards',
      },
    );

    await animation.finished.catch(() => undefined);
    overlay.remove();
  }

  // Coin cards: a coin pops up in the middle of the screen, is tossed up
  // spinning on its X axis (so it reads as flipping end over end), lands
  // back where it started and fades out.
  async animateCoinFlip(): Promise<void> {
    const coin = document.createElement('div');
    coin.classList.add('coin-flip');
    document.body.appendChild(coin);

    const toss = -window.innerHeight * 0.3;
    const at = (y: number, turns: number, scale = 1) =>
      `perspective(600px) translateY(${y}px) rotateX(${turns * 360}deg) scale(${scale})`;

    const animation = coin.animate(
      [
        { transform: at(0, 0, 0.3), opacity: 0, offset: 0 },
        { transform: at(0, 0), opacity: 1, easing: 'cubic-bezier(0.33, 1, 0.68, 1)', offset: 0.12 },
        // Going up slows down, coming back down speeds up.
        { transform: at(toss, 2.5, 1.15), opacity: 1, easing: 'cubic-bezier(0.32, 0, 0.67, 0)', offset: 0.5 },
        { transform: at(0, 5), opacity: 1, easing: 'ease-out', offset: 0.85 },
        // Small bounce on landing.
        { transform: at(-12, 5), opacity: 1, easing: 'ease-in', offset: 0.9 },
        { transform: at(0, 5), opacity: 0, offset: 1 },
      ],
      {
        duration: this.animationSettingsService.getAdjustedDuration(1150),
        fill: 'forwards',
      },
    );

    await animation.finished.catch(() => undefined);
    coin.remove();
  }

  // Card 62: the translucent shadow of a dragon, seen from above, glides
  // across the screen from left to right. The wrapper carries the flight
  // path while the inner image squashes vertically to fake wing beats.
  async animateDragonShadow(): Promise<void> {
    const shadow = document.createElement('div');
    shadow.classList.add('dragon-shadow');
    const img = document.createElement('img');
    img.src = '/images/effects/dragon_shadow.svg';
    img.alt = '';
    shadow.appendChild(img);
    document.body.appendChild(shadow);

    const width = shadow.offsetWidth;
    const height = shadow.offsetHeight;
    const startX = -width;
    const endX = window.innerWidth;
    // Enters a bit low and leaves a bit high, with a slight bank.
    const drift = window.innerHeight * 0.12;
    const duration = this.animationSettingsService.getAdjustedDuration(2400);

    const flight = shadow.animate(
      [
        { transform: `translate(${startX}px, ${-height / 2 + drift}px) rotate(-4deg)` },
        { transform: `translate(${(startX + endX) / 2}px, ${-height / 2}px) rotate(-6deg)` },
        { transform: `translate(${endX}px, ${-height / 2 - drift}px) rotate(-3deg)` },
      ],
      { duration, easing: 'linear', fill: 'forwards' },
    );

    const flapDuration = this.animationSettingsService.getAdjustedDuration(700);
    const flap = img.animate(
      [
        { transform: 'scaleY(1)' },
        { transform: 'scaleY(0.72)', offset: 0.5 },
        { transform: 'scaleY(1)' },
      ],
      { duration: flapDuration, iterations: Math.ceil(duration / flapDuration), easing: 'ease-in-out' },
    );

    await flight.finished.catch(() => undefined);
    flap.cancel();
    shadow.remove();
  }

  // Custom per-card animations, keyed by the card's serverId. Which of these
  // block the event queue is decided by the caller (see
  // GameComponent.cardAnimations).
  private readonly cardAnimations: Record<string, () => Promise<void>> = {
    '34': () => this.animateCreatureEyes(),
    '62': () => this.animateDragonShadow(),
    '96': () => this.animateCoinFlip(),
    '98': () => this.animateCoinFlip(),
    '99': () => this.animateCoinFlip(),
    '100': () => this.animateCoinFlip(),
    '101': () => this.animateCoinFlip(),
    '102': () => this.animateCoinFlip(),
  };

  playCardAnimation(serverId: string): Promise<void> {
    return this.cardAnimations[serverId]?.() ?? Promise.resolve();
  }

// Shows the added card over its origin, then flies it right above the
// target deck at the deck's own size and slides it down *behind* the deck:
// a clip-path keeps only the part above the deck's top edge visible, moving
// in lockstep with the card, so it reads as the card being tucked in.
async animateAddedCard(
  cardId: string,
  deckEnd: string,
  cardOrigin: string,
  duration: number
) {
  await this.nextFrame();

  const destination = document.querySelector(
    `[data-game-id="${deckEnd}"]`
  ) as HTMLElement | null;

  if (!destination) return;

  const origin =
    (document.querySelector(`[data-game-id="${cardOrigin}"]`) as HTMLElement | null) ??
    destination;

  const deckRect = destination.getBoundingClientRect();
  const originCenter = this.getCenter(origin);
  // The card ends a bit smaller than the deck so it tucks in neatly.
  const sizeRatio = 0.82;
  const width = deckRect.width * sizeRatio;
  const height = deckRect.height * sizeRatio;

  // Resting spot: centered on the deck, sitting right on top of it.
  const homeLeft = deckRect.left + (deckRect.width - width) / 2;
  const homeTop = deckRect.top - height;

  const card = document.createElement('div');
  card.classList.add('added-card-ghost');
  card.style.left = `${homeLeft}px`;
  card.style.top = `${homeTop}px`;
  card.style.width = `${width}px`;
  card.style.height = `${height}px`;
  card.style.backgroundImage =
    `url('/images/cards/${cardId}.webp'), url('/images/cards/placeholder.webp')`;
  document.body.appendChild(card);

  const ox = originCenter.x - (homeLeft + width / 2);
  const oy = originCenter.y - (homeTop + height / 2);
  // Shown off at the same size as before the card box was shrunk.
  const showScale = 1.6 / sizeRatio;
  const lift = height * 0.3;

  const animation = card.animate(
    [
      {
        transform: `translate(${ox}px, ${oy}px) scale(${showScale * 0.3}) rotate(-10deg)`,
        clipPath: 'inset(0px 0px 0px 0px)',
        opacity: 0,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        offset: 0,
      },
      {
        transform: `translate(${ox}px, ${oy}px) scale(${showScale}) rotate(0deg)`,
        clipPath: 'inset(0px 0px 0px 0px)',
        opacity: 1,
        easing: 'linear',
        offset: 0.18,
      },
      {
        transform: `translate(${ox}px, ${oy - 6}px) scale(${showScale * 1.03}) rotate(0deg)`,
        clipPath: 'inset(0px 0px 0px 0px)',
        opacity: 1,
        easing: 'cubic-bezier(0.45, 0, 0.25, 1)',
        offset: 0.45,
      },
      // Hovers above the deck at its final size
      {
        transform: `translate(0px, ${-lift}px) scale(1) rotate(0deg)`,
        clipPath: 'inset(0px 0px 0px 0px)',
        opacity: 1,
        easing: 'ease-in-out',
        offset: 0.68,
      },
      // Bottom edge touches the deck's top edge
      {
        transform: 'translate(0px, 0px) scale(1) rotate(0deg)',
        clipPath: 'inset(0px 0px 0px 0px)',
        opacity: 1,
        easing: 'ease-in',
        offset: 0.76,
      },
      // Fully slid down behind the deck
      {
        transform: `translate(0px, ${height}px) scale(1) rotate(0deg)`,
        clipPath: `inset(0px 0px ${height}px 0px)`,
        opacity: 1,
        offset: 1,
      },
    ],
    {
      duration: this.animationSettingsService.getAdjustedDuration(duration),
      fill: 'forwards',
    }
  );

  await animation.finished.catch(() => undefined);
  card.remove();

  // The deck settles a little as the card lands inside it.
  await destination.animate(
    [
      { transform: 'translateY(0px) scale(1)' },
      { transform: 'translateY(3px) scale(1.03, 0.97)', offset: 0.4 },
      { transform: 'translateY(0px) scale(1)' },
    ],
    {
      duration: this.animationSettingsService.getAdjustedDuration(220),
      easing: 'ease-out',
    }
  ).finished.catch(() => undefined);
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

// A little shake, used to call out that an event's source (see
// GameComponent.playEvent) was a global effect rather than a board card —
// e.g. a damage-over-time effect ticking on its own. Same
// resolve-by-data-game-id + Web Animations API idiom as the rest of this
// service, so it works on any [data-game-id] element, not just effects.
async shakeElement(id: string): Promise<void>
{
  const element = document.querySelector(`[data-game-id="${id}"]`) as HTMLElement | null;
  if (element == null)
  {
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
    }
  );

  await animation.finished;
  element.style.transform = '';
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

// Flies a played card out of its owner's hand to the board slot it lands on
// (a unit dock or the last-spell dock), stopping halfway to show it off.
// Rival hand cards are face-down with no id in the DOM, so for them the last
// hand card is used as the origin (the one *ngFor drops when HandSize goes
// down) and the ghost flips over on the way up to reveal the card.
// `onLeaveHand` runs once the origin has been measured, so the caller can
// take the card out of the hand while the ghost covers its old spot.
async animateCardPlayed(
  playerId: string,
  cardId: string,
  imageUrl: string | undefined,
  targetDockId: string,
  isSpell: boolean,
  onLeaveHand: () => void,
): Promise<void> {
  await this.nextFrame();

  const hand = document.querySelector(`[data-hand-id="${playerId}"]`) as HTMLElement | null;
  const handCards = hand ? Array.from(hand.querySelectorAll('.card')) as HTMLElement[] : [];
  const sourceElement =
    (hand?.querySelector(`[data-game-id="${cardId}"]`) as HTMLElement | null) ??
    handCards[handCards.length - 1] ??
    null;
  const targetElement = document.querySelector(
    `[data-dock-id="${targetDockId}"] .dock`
  ) as HTMLElement | null;

  if (!sourceElement || !targetElement) {
    onLeaveHand();
    return;
  }

  const faceDown = !sourceElement.hasAttribute('data-game-id');
  const sourceRect = sourceElement.getBoundingClientRect();
  const targetRect = targetElement.getBoundingClientRect();

  const ghost = document.createElement('div');
  ghost.classList.add('played-card-ghost');
  ghost.style.left = `${sourceRect.left}px`;
  ghost.style.top = `${sourceRect.top}px`;
  ghost.style.width = `${sourceRect.width}px`;
  ghost.style.height = `${sourceRect.height}px`;

  const inner = document.createElement('div');
  inner.classList.add('played-card-ghost-inner');

  const front = document.createElement('div');
  front.classList.add('played-card-ghost-face', 'front');
  front.style.backgroundImage =
    `url('/images/cards/${imageUrl ?? ''}'), url('/images/cards/placeholder.webp')`;

  const back = document.createElement('div');
  back.classList.add('played-card-ghost-face', 'back');

  inner.append(front, back);
  ghost.appendChild(inner);
  document.body.appendChild(ghost);

  onLeaveHand();

  const start = {
    x: sourceRect.left + sourceRect.width / 2,
    y: sourceRect.top + sourceRect.height / 2,
  };
  const end = this.getCenter(targetElement);
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  // The last-spell dock is rotated 90deg, so its on-screen box is sideways.
  const targetHeight = isSpell ? targetRect.width : targetRect.height;
  const endScale = targetHeight / sourceRect.height;
  const endRotation = isSpell ? 90 : 0;

  // Showcase spot: a bit past the hand toward the board, lifted off the
  // table so the card reads clearly before it drops into its slot.
  const showX = dx * 0.35;
  const showY = dy * 0.35;
  const showScale = 1.45;
  const tilt = dx === 0 ? 0 : Math.sign(dx) * 4;

  const flight = ghost.animate(
    [
      {
        transform: 'translate(0px, 0px) scale(1) rotate(0deg)',
        filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))',
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        offset: 0,
      },
      {
        transform: `translate(${showX}px, ${showY}px) scale(${showScale}) rotate(${-tilt}deg)`,
        filter: 'drop-shadow(0 22px 22px rgba(0,0,0,0.45)) brightness(1.1)',
        easing: 'linear',
        offset: 0.3,
      },
      {
        transform: `translate(${showX}px, ${showY - 6}px) scale(${showScale * 1.03}) rotate(0deg)`,
        filter: 'drop-shadow(0 24px 24px rgba(0,0,0,0.45)) brightness(1.1)',
        easing: 'cubic-bezier(0.55, 0, 0.75, 0.2)',
        offset: 0.62,
      },
      {
        transform: `translate(${dx}px, ${dy - 18}px) scale(${endScale * 1.12}) rotate(${endRotation + tilt}deg)`,
        filter: 'drop-shadow(0 14px 14px rgba(0,0,0,0.4))',
        easing: 'ease-in',
        offset: 0.9,
      },
      {
        transform: `translate(${dx}px, ${dy}px) scale(${endScale}) rotate(${endRotation}deg)`,
        filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))',
        offset: 1,
      },
    ],
    {
      duration: this.animationSettingsService.getAdjustedDuration(1100),
      fill: 'forwards',
    },
  );

  const flip = inner.animate(
    faceDown
      ? [
          { transform: 'rotateY(180deg)', offset: 0 },
          { transform: 'rotateY(180deg)', offset: 0.08 },
          { transform: 'rotateY(0deg)', offset: 0.32 },
          { transform: 'rotateY(0deg)', offset: 1 },
        ]
      : [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(0deg)' }],
    {
      duration: this.animationSettingsService.getAdjustedDuration(1100),
      easing: 'ease-in-out',
      fill: 'forwards',
    },
  );

  const cleanup = () => ghost.remove();
  await Promise.all([flight.finished, flip.finished]).catch(() => undefined);

  // Keep the ghost up a couple more frames: the caller places the real card
  // in the dock right after this resolves, and it has to render underneath
  // before the ghost goes away or the slot flickers empty.
  requestAnimationFrame(() => requestAnimationFrame(cleanup));
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

  async createProjectile(source: string, target: string, optionalTarget: string = "", amount: number = 0, sourcePlayerId: string = ""): Promise<void> {
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

  // Last resort: fly from the player's health component (app-health carries the player's id
  // as its data-game-id), e.g. when the source card already left the board.
  if (sourcePlayerId && !sourceElement) {
    sourceElement = document.querySelector(`app-health[data-game-id="${sourcePlayerId}"]`) as HTMLElement | null;
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
