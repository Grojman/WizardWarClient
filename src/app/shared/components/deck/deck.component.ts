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
  deck!: Deck;

  @Input()
  selected = false;


  getImagePath() : string
  {
    return `images/decks/${this.deck.id}.svg`; 
  }
}