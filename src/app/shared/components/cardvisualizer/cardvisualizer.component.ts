import { Component, Input, ViewEncapsulation } from '@angular/core';
import { Card } from '../../../models/card.model';
import { CardDescriptionService } from '../../../core/services/card-description-service';

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

  @Input()
  card!: Card;

  @Input()
  large: boolean = true;
}
