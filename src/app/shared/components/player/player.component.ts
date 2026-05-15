import { AfterViewInit, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Player } from '../../../models/player.model';
import { Card } from '../../../models/card.model';

@Component({
  selector: 'app-player',
  standalone: false,
  templateUrl: './player.component.html',
  styleUrl: './player.component.css',
})
export class PlayerComponent {
  
  @Output()
  onDeckSelected: EventEmitter<any> = new EventEmitter();

  @Output()
  onCardRightClick: EventEmitter<{
    card: Card | null,
    event: MouseEvent
  }> = new EventEmitter();

  @Output()
  onCardSelected: EventEmitter<(Card | null)> = new EventEmitter();
  
  @Output()
  onAttackingUnitSelected: EventEmitter<(Card | null)> = new EventEmitter();
  
  @Output()
  onDockSelected: EventEmitter<number> = new EventEmitter();

  @Output()
  onLastSpellClicked: EventEmitter<any> = new EventEmitter();

  @Output()
  onPlayerTargetSelected: EventEmitter<any> = new EventEmitter();

  @Input()
  player!: Player;

  @Input()
  visibleHand!: boolean;

  @Input()
  isAnimating!: boolean;

  @Input()
  reverseOrder!: boolean;

  @Input()
  showHealthAsTarget!: boolean;

  @Input()
  selectedCard: (Card | null) = null;
  
  @Input()
  unitSelected: boolean = false;

  @Input()
  attackingUnit: (Card | null) = null;



  deckSelected()
  {
    console.error("Emiting deck...")
    this.onDeckSelected.emit();
  }

  onRightClick(event: MouseEvent, card: (Card | null))
  {
    event.stopPropagation();
    this.onCardRightClick.emit(
      {
        card,
        event
      }
    );
  }



  dockSelected(position: number)
  {
    this.onDockSelected.emit(position);
  }

  lastSpellClicked()
  {
    this.onLastSpellClicked.emit();
  }

  attackingUnitSelected(card: (Card | null))
  {
    this.onAttackingUnitSelected.emit(card);
  }

  playerTargetSelected()
  {
    this.onPlayerTargetSelected.emit();
  }

  cardSelected(card: (Card | null))
  {
    this.onCardSelected.emit(card);
  }

  getTransform(index: number, total: number): string {
    const middle = (total - 1) / 2;

    const rotationStep = 6; // grados

    const rotation = (index - middle) * rotationStep;

    const offsetY = Math.abs(index - middle) * -5;

    return `rotate(${rotation}deg) translateY(${offsetY}px)`;
  }
}
