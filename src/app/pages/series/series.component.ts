import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { WebsocketService } from '../../core/services/websocket.service';
import { SeriesStateService } from '../../core/services/series-state.service';
import { AudioService } from '../../core/services/audio.service';
import { AlertModalComponent } from '../../shared/components/alert-modal/alert-modal.component';
import { Deck } from '../../models/deck.model';
import { SeriesSnapshot } from '../../models/series.model';

@Component({
  selector: 'app-series',
  standalone: false,
  templateUrl: './series.component.html',
  styleUrls: ['./series.component.css'],
})
export class SeriesComponent implements OnInit, OnDestroy {
  @ViewChild('errorModal')
  errorModal!: AlertModalComponent;

  decks: Deck[] = [];

  constructor(
    private ws: WebsocketService,
    private router: Router,
    public seriesState: SeriesStateService,
    private audio: AudioService,
  ) {}

  ngOnInit(): void {
    this.ws.connect();
    this.ws.subscribe(this.processMessage);
    this.ws.send({ '$type': 'GetDecksAction' });
    this.ws.send({ '$type': 'RequestSeriesStateAction' });
    this.audio.startMusic();
  }

  ngOnDestroy(): void {
    // Intentionally does not call ws.clearSubscription(): the next page
    // (GameComponent for a round, or HomeComponent after series end)
    // takes over the single subscriber slot itself.
  }

  processMessage = (msg: any): boolean => {
    console.log(msg)
    switch (msg.Type) {
      case 'get_decks':
        this.decks = [...msg.Content];
        break;
      case 'series_state':
        this.seriesState.applySeriesState(msg.Content);
        break;
      case 'series_end':
        this.seriesState.applySeriesEnd(msg.Content);
        break;
      case 'start_game':
        this.startRound();
        break;
      case 'error':
        this.errorModal.open(msg.Content?.message ?? 'Ha ocurrido un error inesperado.');
        break;
      default:
        return true;
    }
    return false;
  };

  async startRound(): Promise<void> {
    await document.querySelector('.series-container')?.animate([
      { opacity: 1 },
      { opacity: 0 },
    ], {
      duration: 500,
    }).finished;

    this.router.navigateByUrl('/game');
  }

  async returnHome(): Promise<void> {
    this.seriesState.clear();

    await document.querySelector('.series-container')?.animate([
      { opacity: 1 },
      { opacity: 0 },
    ], {
      duration: 500,
    }).finished;

    this.router.navigateByUrl('/');
  }

  isYourPick(deck: Deck): boolean {
    const snapshot = this.seriesState.snapshot;
    return !!snapshot && snapshot.you.deckId === Number(deck.id);
  }

  isRivalPick(deck: Deck): boolean {
    const snapshot = this.seriesState.snapshot;
    return !!snapshot && snapshot.rival.deckId !== null && snapshot.rival.deckId === Number(deck.id);
  }

  isUnavailable(deck: Deck): boolean {
    const snapshot = this.seriesState.snapshot;
    if (!snapshot) return true;
    if (this.isYourPick(deck)) return false;
    return !snapshot.availableDecks.some((d) => Number(d.id) === Number(deck.id));
  }

  canSelect(deck: Deck): boolean {
    const snapshot = this.seriesState.snapshot;
    return !!snapshot && snapshot.you.status !== "selecting" && !this.isUnavailable(deck);
  }

  selectDeck(deck: Deck): void {
    if (!this.canSelect(deck)) return;

    this.ws.send({
      '$type': 'SelectSeriesDeckAction',
      DeckId: Number(deck.id),
    });
  }

  scoreFor(snapshot: SeriesSnapshot, playerId: string): number {
    return snapshot.scores.find((s) => s.playerId === playerId)?.score ?? 0;
  }

  rivalStatusText(): string {
    const status = this.seriesState.snapshot?.rival.status;
    switch (status) {
      case 'selecting':
        return 'Seleccionando mazo...';
      case 'waiting':
        return 'Esperando a que elijas';
        case 'waiting_you':
          return 'Esperando a que elijas';
      default:
        return '';
    }
  }

  winnerName(): string {
    const end = this.seriesState.endResult;
    if (!end) return '';
    return end.scores.find((s) => s.playerId === end.winnerId)?.name ?? '';
  }

  isYouWinner(): boolean {
    const end = this.seriesState.endResult;
    return !!end && end.winnerId === this.seriesState.snapshot?.you.playerId;
  }
}
