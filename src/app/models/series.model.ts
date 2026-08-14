import { Deck } from './deck.model';

export interface SeriesScoreEntry {
  playerId: string;
  name: string;
  score: number;
}

export interface SeriesYou {
  playerId: string;
  name: string;
  hasSelected: boolean;
  deckId: number | null;
}

export type SeriesRivalStatus = 'selecting' | 'waiting' | 'hidden';

export interface SeriesRival {
  playerId: string;
  name: string;
  status: SeriesRivalStatus;
  deckId: number | null;
}

export interface SeriesSnapshot {
  seriesId: string;
  round: number;
  roundsToWin: number;
  scores: SeriesScoreEntry[];
  you: SeriesYou;
  rival: SeriesRival;
  availableDecks: Deck[];
}

export interface SeriesEndResult {
  seriesId: string;
  winnerId: string;
  forfeited: boolean;
  scores: SeriesScoreEntry[];
}
