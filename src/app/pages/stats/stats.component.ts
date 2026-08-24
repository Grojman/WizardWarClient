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
  getSeconds(s: number): string
  {
    return new Date(s * 1000).toISOString().slice(11, 19);
  }

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

  // Radar chart: one vertex per opponent deck, two overlaid area polygons (wins/losses).
  readonly radarCenter = 150;
  readonly radarRadius = 110;
  readonly radarGridFractions = [0.25, 0.5, 0.75, 1];

  private radarAngle(index: number): number {
    const total = this.selectedDeck?.Matchups.length ?? 1;
    return (Math.PI * 2 * index) / total - Math.PI / 2;
  }

  private radarMax(): number {
    let max = 1;
    for (const m of this.selectedDeck?.Matchups ?? []) {
      max = Math.max(max, m.Wins, m.Losses);
    }
    return max;
  }

  radarAxisPoint(index: number, radius: number = this.radarRadius): { x: number; y: number } {
    const angle = this.radarAngle(index);
    return {
      x: this.radarCenter + radius * Math.cos(angle),
      y: this.radarCenter + radius * Math.sin(angle),
    };
  }

  radarGridPoints(fraction: number): string {
    const total = this.selectedDeck?.Matchups.length ?? 0;
    const points: string[] = [];
    for (let i = 0; i < total; i++) {
      const p = this.radarAxisPoint(i, this.radarRadius * fraction);
      points.push(`${p.x},${p.y}`);
    }
    return points.join(' ');
  }

  private radarValuePoints(select: (m: DeckMatchup) => number): string {
    if (!this.selectedDeck) return '';
    const max = this.radarMax();
    return this.selectedDeck.Matchups
      .map((m, i) => {
        const angle = this.radarAngle(i);
        const radius = (select(m) / max) * this.radarRadius;
        const x = this.radarCenter + radius * Math.cos(angle);
        const y = this.radarCenter + radius * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(' ');
  }

  get radarWinPoints(): string {
    return this.radarValuePoints((m) => m.Wins);
  }

  get radarLossPoints(): string {
    return this.radarValuePoints((m) => m.Losses);
  }
}
