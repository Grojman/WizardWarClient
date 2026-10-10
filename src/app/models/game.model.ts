import { Player } from "./player.model";

export interface Game
{
    Id: string,
    Me: Player,
    Rivals: Player[],
    CurrentTurn: number,
    IsReconnect: boolean,
    // Id of the player everyone targets this round in a 3+ player game, null in a 1v1.
    HuntedPlayer: string | null,
}