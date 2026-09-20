import { Player } from "./player.model";

export interface Game
{
    Id: string,
    Me: Player,
    Rivals: Player[],
    CurrentTurn: number,
    IsReconnect: boolean
}