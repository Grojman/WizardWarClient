import { AfterViewInit, Component, ElementRef, Input, ViewChild, ViewEncapsulation } from '@angular/core';
import { Card } from '../../../models/card.model';
import { CardDescriptionService } from '../../../core/services/card-description-service';
import { CardComponent } from '../card/card.component';
import { ChromaticColorName } from '../../../core/config/chromatic-colors';

@Component({
  selector: 'app-cardvisualizer',
  standalone: false,
  templateUrl: './cardvisualizer.component.html',
  styleUrl: './cardvisualizer.component.css',
  encapsulation: ViewEncapsulation.None
})
export class CardvisualizerComponent {
  
  parser: CardDescriptionService;
  constructor(service: CardDescriptionService)
  {
    this.parser = service;
  }

  private _card!: Card;

  @Input()
  set card(value: Card) {
    this._card = value;
    requestAnimationFrame(() => {

      this.cardelement.loadCardimage();
    })
    this.updateScrollFade();
  }
  get card(): Card {
    return this._card;
  }

@ViewChild('cardelement')
cardelement!: CardComponent;

  @Input()
  large: boolean = true;

  // The card owner's currently active chromatic color, if known (see
  // GameComponent.onRightClick) — lets the description parser highlight the
  // matching color word and gray out the others. Left null outside of a
  // live game (e.g. the gallery), where every color renders at full
  // strength instead.
  @Input()
  activeColor: ChromaticColorName | null = null;

  showScrollFade = false;

  cardInfo!: ElementRef<HTMLElement>;
  @ViewChild('cardinfo') set c(c: ElementRef)
  {
    if (c)
    {
      this.cardInfo = c;
    }
  }

  updateParser()
  {
    return this.parser.parseDescription(this.card.description, this.activeColor);
  }


  async updateScrollFade() {
    await requestAnimationFrame(() => {});
      const el = this.cardInfo.nativeElement;

      // Tolerance accounts for fractional-pixel rounding introduced by browser/OS zoom,
      // which otherwise keeps scrollTop a hair short of the bottom forever.
      const hasOverflow = el.scrollHeight - el.clientHeight > 1;
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;

      this.showScrollFade = hasOverflow && distanceFromBottom > 2;
  }
}
