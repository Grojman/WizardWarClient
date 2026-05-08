import { Card } from "./card.model";
import { Deck } from "./deck.model";

export interface Player
{
    Id: string,
    Name: string,
    Board: (Card | null)[],
    Health: number,
    HandSize: number,
    HandData: Card[],
    Deck: Deck,
    GlobalEffects: string[]
}