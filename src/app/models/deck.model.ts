export interface Deck {

  id: string;

  name: string;

  description: string;

  cardAmount: number;
}

// Synthetic entry shown first wherever the player picks a deck: choosing it
// doesn't select itself, it selects a random real deck instead (see
// pickRandomDeck() in the components that render it).
export const RANDOM_DECK_ID = 'random';

export function createRandomDeckOption(): Deck {
  return {
    id: RANDOM_DECK_ID,
    name: 'Aleatorio',
    description: '',
    cardAmount: 0,
  };
}