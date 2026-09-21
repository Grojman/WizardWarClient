import { Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { Deck, RANDOM_DECK_ID } from '../../../models/deck.model';

@Component({
  selector: 'app-deck',
  standalone: false,
  templateUrl: './deck.component.html',
  styleUrls: ['./deck.component.css']
})
export class DeckComponent implements OnDestroy {

  @Input()
  infoUp: boolean = false;

  @Input()
  deck!: Deck;

  @Input()
  selected = false;

  @Input()
  small = false;

  @Input()
  unavailable = false;

  @ViewChild('tooltip')
  tooltip?: ElementRef<HTMLElement>;

  // Minimum gap kept between the tooltip and the edges of the viewport.
  private static readonly VIEWPORT_MARGIN = 12;
  private static readonly HOVER_SETTLE_MS = 250;

  private settleTimer?: ReturnType<typeof setTimeout>;

  // The tooltip is laid out (just invisible) before it is hovered, so on
  // mouseenter it can be measured and nudged back inside the viewport. It is
  // shifted with the `translate` property, which stays correct whatever the
  // containing block or the transforms (hover scale, table tilt...) above it.
  onImageHover(): void {
    this.keepTooltipInViewport();

    // Hovering also scales/lifts the deck (see the CSS transitions), which moves
    // the tooltip: fix it up again once that has settled.
    clearTimeout(this.settleTimer);
    this.settleTimer = setTimeout(() => this.keepTooltipInViewport(), DeckComponent.HOVER_SETTLE_MS);
  }

  ngOnDestroy(): void {
    clearTimeout(this.settleTimer);
  }

  private keepTooltipInViewport(): void {
    const el = this.tooltip?.nativeElement;
    if (!el) return;

    let dx = 0;
    let dy = 0;
    el.style.setProperty('--tooltip-dx', '0px');
    el.style.setProperty('--tooltip-dy', '0px');

    // Ancestors can be scaled, so a shift may not land exactly where
    // asked: measure again and correct the remainder.
    for (let pass = 0; pass < 3; pass++) {
      const rect = el.getBoundingClientRect();
      const stepX = this.overflowCorrection(rect.left, rect.right, window.innerWidth);
      const stepY = this.overflowCorrection(rect.top, rect.bottom, window.innerHeight);
      if (Math.abs(stepX) < 0.5 && Math.abs(stepY) < 0.5) break;

      dx += stepX;
      dy += stepY;
      el.style.setProperty('--tooltip-dx', `${dx}px`);
      el.style.setProperty('--tooltip-dy', `${dy}px`);
    }
  }

  private overflowCorrection(start: number, end: number, viewportSize: number): number {
    const margin = DeckComponent.VIEWPORT_MARGIN;

    if (end - start >= viewportSize - margin * 2) {
      return margin - start;
    }
    if (start < margin) {
      return margin - start;
    }
    if (end > viewportSize - margin) {
      return viewportSize - margin - end;
    }
    return 0;
  }

  getImagePath() : string
  {
    if (this.deck.id === RANDOM_DECK_ID) {
      return 'images/decks/random.svg';
    }
    return `images/decks/${this.deck.id}.webp`;
  }
}