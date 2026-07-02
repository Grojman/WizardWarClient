import { Card } from "./card.model";

export interface DeckInfo
{
    name: String,
    cards: { Key: Card, Value: number}[]
}
