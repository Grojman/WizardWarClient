import { Component, Input } from '@angular/core';
import { Card } from '../../../models/card.model';

@Component({
  selector: 'app-cardvisualizer',
  standalone: false,
  templateUrl: './cardvisualizer.component.html',
  styleUrl: './cardvisualizer.component.css',
})
export class CardvisualizerComponent {
  @Input()
  card!: Card;

  @Input()
  large: boolean = true;
}
