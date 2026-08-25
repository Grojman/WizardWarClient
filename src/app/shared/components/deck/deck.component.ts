import { Component, Input } from '@angular/core';
import { Deck, RANDOM_DECK_ID } from '../../../models/deck.model';

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

  @Input()
  unavailable = false;

  getImagePath() : string
  {
    if (this.deck.id === RANDOM_DECK_ID) {
      return 'images/decks/random.svg';
    }
    return `images/decks/${this.deck.id}.webp`;
  }
}