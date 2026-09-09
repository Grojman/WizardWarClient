import { Component, HostListener } from '@angular/core';
import { Card } from '../../../models/card.model';
import { ChromaticColorName } from '../../../core/config/chromatic-colors';

@Component({
  selector: 'app-game-card-check',
  standalone: false,
  templateUrl: './game-card-check.component.html',
  styleUrl: './game-card-check.component.css',
})
export class GameCardCheckComponent {
  isOpen: boolean = false;
  card!: Card;
  activeColor: ChromaticColorName | null = null;

  open(card: Card, activeColor: ChromaticColorName | null = null)
  {
    this.card = card;
    this.activeColor = activeColor;
    this.isOpen = true;
  }

  close()
  {
    this.isOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscape()
  {
    if (this.isOpen)
    {
      this.close();
    }
  }

}
