import { Player } from "./player.model";

export interface Game
{
    Me: Player,
    Rivals: Player[],
}