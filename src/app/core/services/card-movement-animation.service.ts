import { Injectable } from '@angular/core';
import { AnimationSettingsService } from './animation-settings.service';
import { AnimationFxService } from './animation-fx.service';

// Cards travelling between hand, deck and board: playing a card, drawing,
// adding a card to a deck, and enchanting a deck.
@Injectable({
  providedIn: 'root',
})
export class CardMovementAnimationService {
  constructor(
    private animationSettingsService: AnimationSettingsService,
    private fx: AnimationFxService,
  ) {}

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
    await this.fx.nextFrame();

    const hand = document.querySelector(`[data-hand-id="${playerId}"]`) as HTMLElement | null;
    const handCards = hand ? (Array.from(hand.querySelectorAll('.card')) as HTMLElement[]) : [];
    const sourceElement =
      (hand?.querySelector(`[data-game-id="${cardId}"]`) as HTMLElement | null) ??
      handCards[handCards.length - 1] ??
      null;
    const targetElement = document.querySelector(
      `[data-dock-id="${targetDockId}"] .dock`,
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
    front.style.backgroundImage = `url('/images/cards/${imageUrl ?? ''}'), url('/images/cards/placeholder.webp')`;

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
    const end = this.fx.getCenter(targetElement);
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

  // Mirror of animateAddedCard's ending: a face-down card the size of the
  // deck rises out from behind it (clip-path hides whatever is still below
  // the deck's top edge), then swings off toward its owner's hand.
  async animateCardDrawn(deck: string, duration: number, up: boolean): Promise<void> {
    await this.fx.nextFrame();

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
    const peakY = (up ? 1 : -1) * height * 1.15;
    const finalY = up ? -1000 : 1000;
    const shown = 'inset(0px 0px 0px 0px)';

    const animation = card.animate(
      [
        // Hidden behind the deck
        {
          transform: `translate(0px, ${height}px) rotate(0)`,
          clipPath: `inset(0px 0px ${height}px 0px)`,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          offset: 0,
        },

        // Fully out, sitting on top of the deck
        {
          transform: 'translate(0px, 0px) rotate(0)',
          clipPath: shown,
          easing: 'linear',
          offset: emerge,
        },

        // Card leaves the deck, settling upright
        {
          transform: `translate(0px, ${peakY * 0.5}px) rotate(0)`,
          clipPath: shown,
          offset: at(0.14),
        },
        {
          transform: `translate(${midX * 0.2}px, ${peakY * 0.95}px) rotate(25deg)`,
          clipPath: shown,
          offset: at(0.28),
        },

        // Drifting sideways, upright
        {
          transform: `translate(${midX * 0.45}px, ${peakY}px) rotate(35deg)`,
          clipPath: shown,
          offset: at(0.42),
        },
        {
          transform: `translate(${midX * 0.7}px, ${peakY * 0.85}px) rotate(45deg)`,
          clipPath: shown,
          offset: at(0.56),
        },
        {
          transform: `translate(${midX * 0.9}px, ${peakY * 0.55}px) rotate(65deg)`,
          clipPath: shown,
          offset: at(0.7),
        },

        // Settling into the exit line
        {
          transform: `translate(${midX}px, ${peakY * 0.15}px) rotate(35deg)`,
          clipPath: shown,
          opacity: 1,
          offset: at(0.82),
        },
        {
          transform: `translate(${midX}px, ${finalY * 0.35}px) rotate(0deg)`,
          clipPath: shown,
          opacity: 1,
          offset: at(0.92),
        },

        // Fly away
        {
          transform: `translate(${midX}px, ${finalY}px) rotate(90deg)`,
          clipPath: shown,
          opacity: 0,
          offset: 1,
        },
      ],
      {
        duration: this.animationSettingsService.getAdjustedDuration(duration),
        fill: 'forwards',
      },
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
    await this.fx.nextFrame();

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
    card.style.backgroundImage = `url('/images/cards/${imageUrl ?? ''}'), url('/images/cards/placeholder.webp')`;
    document.body.appendChild(card);

    // Add the card now and let Angular render it, so the rest of the hand
    // has already shifted over and the new slot's position is final.
    onEnterHand();
    await this.fx.nextFrame();
    await this.fx.nextFrame();

    const slot = document.querySelector(
      `[data-hand-id="${playerId}"] [data-game-id="${cardId}"]`,
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

  // Shows the added card over its origin, then flies it right above the
  // target deck at the deck's own size and slides it down *behind* the deck:
  // a clip-path keeps only the part above the deck's top edge visible, moving
  // in lockstep with the card, so it reads as the card being tucked in.
  async animateAddedCard(cardId: string, deckEnd: string, cardOrigin: string, duration: number) {
    await this.fx.nextFrame();

    const destination = document.querySelector(`[data-game-id="${deckEnd}"]`) as HTMLElement | null;

    if (!destination) return;

    const origin =
      (document.querySelector(`[data-game-id="${cardOrigin}"]`) as HTMLElement | null) ??
      destination;

    const deckRect = destination.getBoundingClientRect();
    const originCenter = this.fx.getCenter(origin);
    // The card ends smaller than the deck so it tucks in neatly.
    const sizeRatio = 0.68;
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
    card.style.backgroundImage = `url('/images/cards/${cardId}.webp'), url('/images/cards/placeholder.webp')`;
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
      },
    );

    await animation.finished.catch(() => undefined);
    card.remove();

    // The deck settles a little as the card lands inside it.
    await destination
      .animate(
        [
          { transform: 'translateY(0px) scale(1)' },
          { transform: 'translateY(3px) scale(1.03, 0.97)', offset: 0.4 },
          { transform: 'translateY(0px) scale(1)' },
        ],
        {
          duration: this.animationSettingsService.getAdjustedDuration(220),
          easing: 'ease-out',
        },
      )
      .finished.catch(() => undefined);
  }

  async animateDeckCard(
    startIcon: string,
    cardOrigin: string,
    deckEnd: string,
    duration: number,
  ): Promise<void> {
    await this.fx.nextFrame();

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
    const start = this.fx.getCenter(origin);
    const end = destination.getBoundingClientRect();
    const endCenter = {
      x: end.left + end.width / 2,
      y: end.top,
    };

    const dx = endCenter.x - start.x - iconRect.width / 4;
    const dy = endCenter.y - start.y - iconRect.height;

    icon.style.position = 'fixed';
    icon.style.left = `${start.x - iconRect.width / 2}px`;
    icon.style.top = `${start.y - iconRect.height / 2}px`;
    icon.style.willChange = 'transform';

    const animation = icon.animate(
      [
        { transform: 'translate(0px, 0px) rotate(0deg) scale(0.9)', offset: 0.1 },
        {
          transform: `translate(${dx * 0.45}px, ${dy * 0.3}px) rotate(14deg) scale(1.05)`,
          offset: 0.55,
        },
        { transform: `translate(${dx}px, ${dy}px) rotate(0deg) scale(1)`, offset: 0.8 },
        { transform: `translate(${dx}px, ${dy}px) rotate(0deg) scale(1)`, opacity: 1, offset: 0.9 },
        {
          transform: `translate(${dx}px, ${dy + iconRect.height * 2}px) rotate(180deg) scale(0.8)`,
          opacity: 0,
          offset: 1,
        },
      ],
      {
        duration: this.animationSettingsService.getAdjustedDuration(duration),
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    );

    await animation.finished;

    icon.style.display = 'none';
  }

  // A wand held by its handle comes in from the left of the deck, taps it
  // twice with its tip (pivoting on the handle, like a wrist flick) and
  // leaves, then the deck sparkles to show it was enchanted.
  async animateModifyDeck(deck: string, duration: number): Promise<void> {
    await this.fx.nextFrame();

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
        {
          transform: `${away} rotate(${restAngle - 12}deg)`,
          opacity: 0,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          offset: 0,
        },
        {
          transform: `translate(0px, 0px) rotate(${restAngle}deg)`,
          opacity: 1,
          easing: 'ease-in',
          offset: 0.28,
        },
        {
          transform: `translate(0px, 0px) rotate(${tapAngle}deg)`,
          opacity: 1,
          easing: 'ease-out',
          offset: tapOffsets[0],
        },
        {
          transform: `translate(0px, 0px) rotate(${restAngle * 0.6}deg)`,
          opacity: 1,
          easing: 'ease-in',
          offset: 0.53,
        },
        {
          transform: `translate(0px, 0px) rotate(${tapAngle}deg)`,
          opacity: 1,
          easing: 'ease-out',
          offset: tapOffsets[1],
        },
        {
          transform: `translate(0px, 0px) rotate(${restAngle}deg)`,
          opacity: 1,
          easing: 'ease-in',
          offset: 0.78,
        },
        { transform: `${away} rotate(${restAngle - 12}deg)`, opacity: 0, offset: 1 },
      ],
      { duration: adjustedDuration, fill: 'forwards' },
    );

    // Each tap sends a small flash through the deck.
    const tapTimers = tapOffsets.map((offset) =>
      setTimeout(() => {
        this.fx.spawnSparks(tip.x, tip.y, 4);
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

    await this.fx.spawnSparkles(deckElement, 14);
  }
}
