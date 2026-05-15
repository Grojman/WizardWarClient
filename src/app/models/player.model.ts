import { Card } from "./card.model";
import { Deck } from "./deck.model";
import { Health } from "./health.model";

export interface Player
{
    Id: string,
    Name: string,
    Board: (Card | null)[],
    Health: Health,
    HandSize: number,
    HandData: Card[],
    Deck: Deck,
    GlobalEffects: string[],
    IsMyTurn: boolean,
    LastSpellPlayed: (Card | null),
    TargetPlayer: string,
}