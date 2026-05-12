import { Component } from '@angular/core';
import { Card } from '../../../models/card.model';

@Component({
  selector: 'app-game-card-check',
  standalone: false,
  templateUrl: './game-card-check.component.html',
  styleUrl: './game-card-check.component.css',
})
export class GameCardCheckComponent {
  isOpen: boolean = false;
  card!: Card;

  open(card: Card)
  {
    this.card = card;
    this.isOpen = true;
  }

  close()
  {
    this.isOpen = false;
  }

}
