import { Component, OnInit } from '@angular/core';
import { WebsocketService } from '../../core/services/websocket.service';
import { DeckMatchup, DeckStats, GameStats } from '../../models/stats.model';

@Component({
  selector: 'app-stats',
  standalone: false,
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css'],
})
export class StatsComponent implements OnInit {
  stats: GameStats = { TotalGames: 0, Decks: [] };

  selectedDeck: DeckStats | null = null;

  constructor(private ws: WebsocketService) {}

  ngOnInit(): void {
    this.ws.subscribe(this.processMessage);
    this.ws.send({
      "$type": "GetStatsAction"
    });
  }

  processMessage = (msg: any): boolean => {
    switch (msg.Type) {
      case "get_stats":
        this.stats = msg.Content;
        break;
      default:
        console.log("Unknown message!!");
        return true;
    }
    return false;
  }

  selectDeck(deck: DeckStats): void {
    this.selectedDeck = this.selectedDeck === deck ? null : deck;
  }

  barHeight(value: number): number {
    if (!this.selectedDeck) return 0;
    const max = Math.max(this.selectedDeck.Wins, this.selectedDeck.Losses, 1);
    return Math.round((value / max) * 100);
  }

  matchupBarHeight(matchup: DeckMatchup, value: number): number {
    const max = Math.max(matchup.Wins, matchup.Losses, 1);
    return Math.round((value / max) * 100);
  }
}
