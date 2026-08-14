import { Deck } from './deck.model';

export interface SeriesScoreEntry {
  playerId: string;
  name: string;
  score: number;
}

export interface SeriesStatus
{
  playerId: string,
  name: string,
  status: SeriesPlayerStatus,
  deckId: number | null
}


export type SeriesPlayerStatus = 'selecting' | 'waiting' | 'hidden' | 'waiting_you';

export interface SeriesSnapshot {
  seriesId: string;
  round: number;
  roundsToWin: number;
  scores: SeriesScoreEntry[];
  you: SeriesStatus;
  rival: SeriesStatus;
  availableDecks: Deck[];
}

export interface SeriesEndResult {
  seriesId: string;
  winnerId: string;
  forfeited: boolean;
  scores: SeriesScoreEntry[];
}
