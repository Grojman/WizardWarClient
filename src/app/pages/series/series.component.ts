import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { WebsocketService } from '../../core/services/websocket.service';
import { SeriesStateService } from '../../core/services/series-state.service';
import { AudioService } from '../../core/services/audio.service';
import { AlertModalComponent } from '../../shared/components/alert-modal/alert-modal.component';
import { createRandomDeckOption, Deck, RANDOM_DECK_ID } from '../../models/deck.model';
import { SeriesSnapshot } from '../../models/series.model';
import { GameSessionStorageService } from '../../core/services/game-session-storage.service';
import { TranslationService } from '../../core/services/translation.service';

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

  // decks, with the "Aleatorio" option prepended, for the deck-select grid.
  decksForSelection: Deck[] = [];

  decksLoading = true;

  constructor(
    private ws: WebsocketService,
    private router: Router,
    public seriesState: SeriesStateService,
    private audio: AudioService,
    private gameSessionStorage: GameSessionStorageService,
    private translation: TranslationService,
  ) {}

  ngOnInit(): void {
    this.ws.connect();
    this.ws.subscribe(this.processMessage);
    this.ws.send({ '$type': 'GetDecksAction' });
    this.ws.send({ '$type': 'RequestSeriesStateAction' });
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
        this.decksForSelection = [createRandomDeckOption(), ...this.decks];
        this.decksLoading = false;
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
        this.errorModal.open(msg.Content?.message ?? this.translation.translate('ERR_UNEXPECTED'));
        break;
      case 'translations':
        this.translation.setDictionary(msg.Content?.values ?? {});
        break;
      default:
        return true;
    }
    return false;
  };

  async startRound(): Promise<void> {
    this.gameSessionStorage.markActive();

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
    this.gameSessionStorage.markInactive();

    await document.querySelector('.series-container')?.animate([
      { opacity: 1 },
      { opacity: 0 },
    ], {
      duration: 500,
    }).finished;

    this.router.navigateByUrl('/');
  }

  getSelectedDeck(id: number | null): Deck | undefined {
    if (!id) return undefined;
    return this.decks.find((d) => Number(d.id) === id);
  }

  isYourPick(deck: Deck): boolean {
    const snapshot = this.seriesState.snapshot;
    return !!snapshot && snapshot.you.deckId === Number(deck.id);
  }

  isRivalPick(deck: Deck): boolean {
    const snapshot = this.seriesState.snapshot;
    return !!snapshot && snapshot.rival.deckId !== null && snapshot.rival.deckId === Number(deck.id);
  }

  private isRealDeckUnavailable(deck: Deck): boolean {
    const snapshot = this.seriesState.snapshot;
    if (!snapshot) return true;
    if (this.isYourPick(deck)) return false;
    return !snapshot.availableDecks.some((d) => Number(d.id) === Number(deck.id));
  }

  // The "Aleatorio" option is unavailable only when every real deck is
  // (already used elsewhere in the series), since picking it just resolves
  // to picking one of the currently-available real decks.
  isUnavailable(deck: Deck): boolean {
    if (deck.id === RANDOM_DECK_ID) {
      return !this.decks.some((d) => !this.isRealDeckUnavailable(d));
    }
    return this.isRealDeckUnavailable(deck);
  }

  canSelect(deck: Deck): boolean {
    const snapshot = this.seriesState.snapshot;
    return !!snapshot && (snapshot.you.status !== "selecting" || snapshot.round === 3) && !this.isUnavailable(deck);
  }

  private pickRandomAvailableDeck(): Deck | undefined {
    const available = this.decks.filter((d) => !this.isRealDeckUnavailable(d));
    if (!available.length) return undefined;
    return available[Math.floor(Math.random() * available.length)];
  }

  selectDeck(deck: Deck): void {
    if (!this.canSelect(deck)) return;

    const target = deck.id === RANDOM_DECK_ID ? this.pickRandomAvailableDeck() : deck;
    if (!target) return;

    this.ws.send({
      '$type': 'SelectSeriesDeckAction',
      DeckId: Number(target.id),
    });
  }

  scoreFor(snapshot: SeriesSnapshot | null, playerId: string): number {
    return snapshot?.scores.find((s) => s.playerId === playerId)?.score ?? 0;
  }

  rivalStatusText(): string {
    const status = this.seriesState.snapshot?.rival.status;
    switch (status) {
      case 'selecting':
        return this.translation.translate('SERIES_SECTION_RIVAL_SELECTING');
      case 'waiting':
        return this.translation.translate('SERIES_SECTION_RIVAL_WAITING');
        case 'waiting_you':
          return this.translation.translate('SERIES_SECTION_RIVAL_WAITING_YOU');
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

  trackById(index: number, deck: Deck): string {
    return deck.id;
  }
}
