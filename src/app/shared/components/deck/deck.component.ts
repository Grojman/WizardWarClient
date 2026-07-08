import { Component, Input } from '@angular/core';
import { Deck } from '../../../models/deck.model';

@Component({
  selector: 'app-deck',
  standalone: false,
  templateUrl: './deck.component.html',
  styleUrls: ['./deck.component.css']
})
export class DeckComponent {

  @Input()
  infoUp: boolean = false;

  @Input()
  deck!: Deck;

  @Input()
  selected = false;

  @Input()
  small = false;

  getImagePath() : string
  {
    return `images/decks/${this.deck.id}.svg`; 
  }
}