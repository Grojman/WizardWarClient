export interface DeckMatchup {
  OpponentDeckId: number;
  OpponentDeckName: string;
  Wins: number;
  Losses: number;
  TotalGames: number;
  AverageTurn: number;
}

export interface DeckStats {
  DeckId: number;
  DeckName: string;
  Wins: number;
  Losses: number;
  TotalGames: number;
  AverageTurn: number;
  Matchups: DeckMatchup[];
}

export interface GameStats {
  TotalGames: number;
  Decks: DeckStats[];
}
