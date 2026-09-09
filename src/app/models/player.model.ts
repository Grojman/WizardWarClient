import { Card } from "./card.model";
import { Deck } from "./deck.model";
import { Health } from "./health.model";
import { ChromaticColorName } from "../core/config/chromatic-colors";

// Mirrors WizardWarServer's GlobalEffectDto. Id is the owning EffectInstance's
// own Guid — usable as a GameEvent.Source and as a [attr.data-game-id]
// animation anchor (see PlayerComponent), since a global effect's own side
// effects are now attributed back to it rather than to whatever card
// originally granted it (see GameState.CurrentGlobalEffectSource).
export interface GlobalEffect
{
    Id: string,
    Text: string,
    Color: ChromaticColorName | null,
}

export interface Player
{
    Id: string,
    Name: string,
    Board: (Card | null)[],
    Health: Health,
    HandSize: number,
    HandData: Card[],
    Deck: Deck,
    GlobalEffects: GlobalEffect[],
    IsMyTurn: boolean,
    LastSpellPlayed: (Card | null),
    TargetPlayer: string,
}