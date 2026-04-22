import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Card } from '../../../models/card.model';

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
  
  @Input()
  card: Card | null = null

  @Input()
  enhanced: boolean = false;

  @Input()
  isAttackingCard: boolean = false;

  @Input()
  rival: boolean = false;

}
