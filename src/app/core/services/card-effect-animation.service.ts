import { Injectable } from '@angular/core';
import { AnimationSettingsService } from './animation-settings.service';
import { AnimationFxService } from './animation-fx.service';

interface CardAnimation {
  play: (cardId: string) => Promise<void>;
  // Lets the remaining events play alongside it instead of waiting for it.
  async?: boolean;
}

// Custom animations for specific cards, keyed by the card's serverId.
@Injectable({
  providedIn: 'root',
})
export class CardEffectAnimationService {
  constructor(
    private animationSettingsService: AnimationSettingsService,
    private fx: AnimationFxService,
  ) {}

  // Played once the card has landed on the board.
  private readonly cardAnimations: Record<string, CardAnimation> = {
    '34': { play: () => this.animateCreatureEyes() },
    '51': { play: (cardId) => this.animateFlexArms(cardId) },
    '62': { play: () => this.animateDragonShadow(), async: true },
    '96': { play: () => this.animateCoinFlip() },
    '98': { play: () => this.animateCoinFlip() },
    '99': { play: () => this.animateCoinFlip() },
    '100': { play: () => this.animateCoinFlip() },
    '101': { play: () => this.animateCoinFlip() },
    '102': { play: () => this.animateCoinFlip() },
    '140': { play: (cardId) => this.animateLightSplit(cardId) },
  };

  // Played *before* the card shows up on screen (i.e. before
  // CardMovementAnimationService.animateCardPlayed).
  private readonly cardIntroAnimations: Record<string, () => Promise<void>> = {
    '129': () => this.animateTableTremble(),
  };

  // Resolves when the animation ends, or right away for `async` ones.
  playCardAnimation(serverId: string, cardId: string): Promise<void> {
    const animation = this.cardAnimations[serverId];
    if (!animation) return Promise.resolve();

    const finished = animation.play(cardId);
    return animation.async ? Promise.resolve() : finished;
  }

  playCardIntroAnimation(serverId: string): Promise<void> {
    return this.cardIntroAnimations[serverId]?.() ?? Promise.resolve();
  }

  // These play right after the card is placed on the board, before Angular
  // has rendered it, so wait a few frames for its element to show up.
  private async waitForCard(cardId: string, maxFrames = 30): Promise<HTMLElement | null> {
    for (let i = 0; i < maxFrames; i++) {
      const card = document.querySelector(`[data-game-id="${cardId}"]`) as HTMLElement | null;
      if (card && card.getBoundingClientRect().width > 0) return card;
      await this.fx.nextFrame();
    }
    return null;
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
        {
          transform: at(toss, 2.5, 1.15),
          opacity: 1,
          easing: 'cubic-bezier(0.32, 0, 0.67, 0)',
          offset: 0.5,
        },
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
      {
        duration: flapDuration,
        iterations: Math.ceil(duration / flapDuration),
        easing: 'ease-in-out',
      },
    );

    await flight.finished.catch(() => undefined);
    flap.cancel();
    shadow.remove();
  }

  // Card 140: a white light blooms over the card, then splits into two
  // white spheres that flee left and right until they leave the screen.
  async animateLightSplit(cardId: string): Promise<void> {
    const card = await this.waitForCard(cardId);
    if (card == null) return;

    const rect = card.getBoundingClientRect();
    const { x, y } = this.fx.getCenter(card);
    const size = Math.max(rect.width, rect.height) * 1.6;

    const glow = document.createElement('div');
    glow.classList.add('white-light-glow');
    glow.style.left = `${x}px`;
    glow.style.top = `${y}px`;
    glow.style.width = `${size}px`;
    glow.style.height = `${size}px`;
    document.body.appendChild(glow);

    const bloom = glow.animate(
      [
        { transform: 'translate(-50%, -50%) scale(0.2)', opacity: 0 },
        { transform: 'translate(-50%, -50%) scale(1.1)', opacity: 1, offset: 0.6 },
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
      ],
      {
        duration: this.animationSettingsService.getAdjustedDuration(650),
        easing: 'ease-out',
        fill: 'forwards',
      },
    );
    await bloom.finished.catch(() => undefined);

    // The glow collapses into the spheres as they take off.
    const splitDuration = this.animationSettingsService.getAdjustedDuration(1100);
    const fade = glow.animate(
      [
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        { transform: 'translate(-50%, -50%) scale(0.3)', opacity: 0 },
      ],
      { duration: splitDuration * 0.5, easing: 'ease-in', fill: 'forwards' },
    );

    const sphereSize = Math.max(28, rect.width * 0.35);
    const flights = [-1, 1].map((direction) => {
      const sphere = document.createElement('div');
      sphere.classList.add('white-light-sphere');
      sphere.style.left = `${x}px`;
      sphere.style.top = `${y}px`;
      sphere.style.width = `${sphereSize}px`;
      sphere.style.height = `${sphereSize}px`;
      document.body.appendChild(sphere);

      // Far enough to fully clear the screen edge on that side.
      const distance = (direction < 0 ? x : window.innerWidth - x) + sphereSize * 2;
      const flight = sphere.animate(
        [
          { transform: 'translate(-50%, -50%) translateX(0px) scale(0.4)', opacity: 0 },
          {
            transform: `translate(-50%, -50%) translateX(${direction * 30}px) scale(1.1)`,
            opacity: 1,
            offset: 0.15,
          },
          {
            transform: `translate(-50%, -50%) translateX(${direction * distance}px) scale(0.8)`,
            opacity: 1,
          },
        ],
        { duration: splitDuration, easing: 'cubic-bezier(0.5, 0, 0.75, 0.4)', fill: 'forwards' },
      );
      return flight.finished.catch(() => undefined).then(() => sphere.remove());
    });

    await Promise.all([fade.finished.catch(() => undefined), ...flights]);
    glow.remove();
  }

  // Card 51: two muscular arms pop out of the card's sides, hanging low,
  // then swing up into a double-biceps flex and pump a couple of times.
  // Each arm rotates around its shoulder, which sits on the card's edge.
  async animateFlexArms(cardId: string): Promise<void> {
    const card = await this.waitForCard(cardId);
    if (card == null) return;

    const rect = card.getBoundingClientRect();
    const size = rect.height * 0.6;
    // Where the shoulder sits inside flex_arm.svg (fraction of its box).
    const shoulderX = 0.02;
    const shoulderY = 0.7;
    // How much of the arm tucks over the card edge.
    const overlap = size * 0.06;
    const top = rect.top + rect.height * 0.45 - size * shoulderY;
    const duration = this.animationSettingsService.getAdjustedDuration(1900);

    const arms = [1, -1].map((side) => {
      const arm = document.createElement('div');
      arm.classList.add('flex-arm');
      const inner = document.createElement('div');
      inner.classList.add('flex-arm-image');
      arm.appendChild(inner);

      arm.style.width = `${size}px`;
      arm.style.height = `${size}px`;
      arm.style.top = `${top}px`;
      if (side > 0) {
        arm.style.left = `${rect.right - overlap - size * shoulderX}px`;
        arm.style.transformOrigin = `${shoulderX * 100}% ${shoulderY * 100}%`;
      } else {
        // Mirrored: the shoulder ends up on the image's right edge.
        inner.style.transform = 'scaleX(-1)';
        arm.style.left = `${rect.left + overlap - size * (1 - shoulderX)}px`;
        arm.style.transformOrigin = `${(1 - shoulderX) * 100}% ${shoulderY * 100}%`;
      }
      document.body.appendChild(arm);

      // Positive angles hang the right arm down; the left arm mirrors them.
      const pose = (deg: number, scale: number = 1) => `rotate(${deg * side}deg) scale(${scale})`;

      return arm
        .animate(
          [
            { transform: pose(70, 0.5), opacity: 0 },
            { transform: pose(65, 1), opacity: 1, offset: 0.12 },
            { transform: pose(-10, 1.08), opacity: 1, offset: 0.32, easing: 'ease-in-out' },
            { transform: pose(0, 1), opacity: 1, offset: 0.4, easing: 'ease-in-out' },
            { transform: pose(18, 0.98), opacity: 1, offset: 0.5, easing: 'ease-in-out' },
            { transform: pose(-8, 1.1), opacity: 1, offset: 0.6, easing: 'ease-in-out' },
            { transform: pose(14, 0.98), opacity: 1, offset: 0.7, easing: 'ease-in-out' },
            { transform: pose(-6, 1.12), opacity: 1, offset: 0.8 },
            { transform: pose(-6, 1.12), opacity: 1, offset: 0.9 },
            { transform: pose(-6, 1.05), opacity: 0 },
          ],
          { duration, easing: 'ease-out', fill: 'forwards' },
        )
        .finished.catch(() => undefined)
        .then(() => arm.remove());
    });

    await Promise.all(arms);
  }

  // Trembles the whole table. Animates `translate` rather than `transform`
  // so it stacks on top of the table's rotateX tilt instead of replacing it.
  async animateTableTremble(): Promise<void> {
    const table = document.querySelector('.table-container') as HTMLElement | null;
    if (table == null) return;

    const offsets = [
      [0, 0],
      [-14, 6],
      [12, -8],
      [-16, -3],
      [15, 8],
      [-12, 5],
      [13, -6],
      [-11, 4],
      [10, -5],
      [-8, 3],
      [6, -3],
      [-4, 2],
      [2, -1],
      [0, 0],
    ];
    const animation = table.animate(
      offsets.map(([x, y]) => ({ translate: `${x}px ${y}px` })),
      {
        duration: this.animationSettingsService.getAdjustedDuration(900),
        easing: 'linear',
      },
    );

    await animation.finished;
  }
}
