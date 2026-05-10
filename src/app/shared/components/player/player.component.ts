import { Component, Input } from '@angular/core';
import { Player } from '../../../models/player.model';

@Component({
  selector: 'app-player',
  standalone: false,
  templateUrl: './player.component.html',
  styleUrl: './player.component.css',
})
export class PlayerComponent {
  @Input()
  player!: Player;

  @Input()
  visibleHand!: boolean;
}
