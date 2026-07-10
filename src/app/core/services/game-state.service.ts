import { Injectable } from '@angular/core';
import { Card } from '../../models/card.model';
import { Game } from '../../models/game.model';
import { Health } from '../../models/health.model';
import { Player } from '../../models/player.model';

@Injectable({
  providedIn: 'root',
})
export class GameStateService {
  createInitialGameState(): Game {
    return {
      Me: {
        TargetPlayer: '',
        Id: '',
        IsMyTurn: false,
        LastSpellPlayed: null,
        Name: '',
        Board: [null, null, null, null],
        Health: new Health(),
        HandSize: 0,
        HandData: [],
        Deck: {
          id: '1',
          name: '',
          description: '',
          cardAmount: 0,
        },
        GlobalEffects: [],
      },
      Rivals: [
        {
          TargetPlayer: '',
          IsMyTurn: false,
          LastSpellPlayed: null,
          Id: '',
          Name: '',
          Board: [null, null, null, null],
          Health: new Health(),
          HandSize: 0,
          HandData: [],
          Deck: {
            id: '1',
            name: '',
            description: '',
            cardAmount: 0,
          },
          GlobalEffects: [],
        },
      ],
      CurrentTurn: 0
    };
  }

  initializeFromSnapshot(snapshot: Game): Game {
    const state = snapshot;

    state.Me.Deck.cardAmount += state.Me.HandSize;
    state.Me.Health = this.createHealth(state.Me.Health);
    state.Me.HandData = [];
    state.Me.HandSize = 0;

    state.Rivals.forEach((player) => {
      player.Health = this.createHealth(player.Health);
      player.Deck.cardAmount += player.HandSize;
      player.HandSize = 0;
    });

    return state;
  }

  syncPlayerTargets(gameState: Game, firstTime: boolean, getPlayer: (id: string) => Player): boolean {
    if (!firstTime) {
      return firstTime;
    }

    gameState.Me.TargetPlayer = getPlayer(gameState.Me.TargetPlayer).Name;

    gameState.Rivals.forEach((player) => {
      player.TargetPlayer = getPlayer(player.TargetPlayer).Name;
    });

    return false;
  }

  applyTurnAndEffects(gameState: Game, snapshot: Game | null): void {
    const currentSnapshot = snapshot ?? gameState;

    gameState.Me.GlobalEffects = currentSnapshot.Me?.GlobalEffects ?? [];
    gameState.Me.IsMyTurn = currentSnapshot.Me?.IsMyTurn ?? false;
    gameState.CurrentTurn = currentSnapshot.CurrentTurn;

    gameState.Rivals.forEach((player, index) => {
      const rivalSnapshot = currentSnapshot.Rivals?.[index];
      if (!rivalSnapshot) {
        return;
      }

      player.GlobalEffects = rivalSnapshot.GlobalEffects ?? [];
      player.IsMyTurn = rivalSnapshot.IsMyTurn ?? false;
    });
  }

  createHealth(value: Health | number): Health {
    const health = new Health();
    const numericValue = typeof value === 'number' ? value : value.health;
    health.health = health.displayHealth = numericValue;
    return health;
  }

  getPlayer(gameState: Game, id: string): Player {
    if (!id) {
      return gameState.Me;
    }

    if (gameState.Me.Id === id) {
      return gameState.Me;
    }

    return gameState.Rivals.find((player) => player.Id === id) ?? gameState.Me;
  }

  removeCardFromHand(player: Player, cardId: string): boolean {
    const cardIndex = player.HandData.findIndex((card) => card.id === cardId);

    if (cardIndex === -1) {
      return false;
    }

    player.HandData.splice(cardIndex, 1);
    player.HandSize = Math.max(0, player.HandSize - 1);
    return true;
  }

  placeCardOnBoard(player: Player, card: Card, boardPosition: number): void {
    player.Board[boardPosition] = card;
  }

  setLastSpellPlayed(player: Player, spell: Card): void {
    player.LastSpellPlayed = spell;
  }

  addCardToHand(player: Player, card: Card): void {
    player.HandData.push(card);
    player.HandSize += 1;
  }

  updateDeckAmount(player: Player, amount: number): void {
    player.Deck.cardAmount += amount;
  }

  consumeSpellEffect(player: Player): void {
    if (player.LastSpellPlayed) {
      player.LastSpellPlayed.effectTimes = Math.max(0, (player.LastSpellPlayed.effectTimes ?? 0) - 1);
    }
  }

  consumeBoardEffect(player: Player, cardId: string): void {
    const card = player.Board.find((entry) => entry?.id === cardId);
    if (card) {
      card.effectTimes = Math.max(0, (card.effectTimes ?? 0) - 1);
    }
  }
}
