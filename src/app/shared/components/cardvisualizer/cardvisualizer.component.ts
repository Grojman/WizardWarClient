import { AfterViewInit, Component, ElementRef, Input, ViewChild, ViewEncapsulation } from '@angular/core';
import { Card } from '../../../models/card.model';
import { CardDescriptionService } from '../../../core/services/card-description-service';
import { CardComponent } from '../card/card.component';

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
    return this.parser.parseDescription(this.card.description);
  }


  async updateScrollFade() {
    await requestAnimationFrame(() => {});
      const el = this.cardInfo.nativeElement;

      this.showScrollFade =
          el.scrollHeight > el.clientHeight &&
          el.scrollTop + el.clientHeight < el.scrollHeight - 1;
  }
}
