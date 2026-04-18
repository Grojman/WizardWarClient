import { Player } from "./player.model";

export interface Game
{
    Me: Player,
    Rival: Player,
    IsMyTurn: boolean
}