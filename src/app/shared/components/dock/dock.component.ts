import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Card } from '../../../models/card.model';
import { CardComponent } from '../card/card.component';

@Component({
  selector: 'app-dock',
  standalone: false,
  templateUrl: './dock.component.html',
  styleUrl: './dock.component.css',
})
export class DockComponent {
  @Output() onCardClick: EventEmitter<any> = new EventEmitter();

  cardClicked()
  {
    this.onCardClick.emit();
  }

  @ViewChild('cardelement')
  cardelement!: CardComponent;

  @Input()
  spell: boolean = false;
  
  private _card!: Card | null;

  @Input()
  set card(value: Card | null) {
    this._card = value;

    if (value)
    {
      requestAnimationFrame(() => {
        this.cardelement.loadCardimage();
      })
    }
  }

  get card(): Card | null {
    return this._card;
  }

  @Input()
  enhanced: boolean = false;

  @Input()
  isAttackingCard: boolean = false;

  @Input()
  rival: boolean = false;

  @Input()
  isTarget: boolean = false;

}
