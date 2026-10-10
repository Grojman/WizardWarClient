import { Card } from '../../models/card.model';
import { Game } from '../../models/game.model';
import { GlobalEffect } from '../../models/player.model';
import { Health } from '../../models/health.model';
import { SPELL, UNIT } from '../../core/config/game-data-config';
import {
  ENDLESS_WINTER_EFFECT,
  TUTORIAL_CARDS,
  TutorialLanguage,
} from './tutorial-cards';

export const TUTORIAL_ME_ID = 'tutorial-me';
export const TUTORIAL_RIVAL_ID = 'tutorial-rival';

// Same limits as the server's GameState.
export const MAX_HAND = 10;
export const BOARD_SIZE = 4;

// A card as the server would serialize it (CardDto): plain data, no methods.
// Events carry copies of these, and GameComponent-style playback turns them
// into Card instances with Card.fromJSON.
export type CardData = Omit<Card, 'changeHealth' | 'changeDamage'> & {
  attack: number;
  health: number;
  effectTimes: number;
};

interface EngineEffect extends GlobalEffect {
  roundsLeft: number;
}

interface EnginePlayer {
  id: string;
  health: number;
  hand: CardData[];
  deck: CardData[];
  board: (CardData | null)[];
  lastSpell: CardData | null;
  effects: EngineEffect[];
  // serverIds of every card this player has played, for play conditions.
  played: string[];
}

/**
 * A tiny, local stand-in for the server's GameState: just enough of the
 * rules (turn order, one action per turn, free abilities, combat, deaths,
 * round-end effects and the every-two-rounds draw) to drive the tutorial
 * without a connection. Every mutation returns the same GameEvent shapes
 * the server broadcasts in "game_events", so the tutorial can replay them
 * through the real animations exactly like a match does.
 */
export class TutorialEngine {
  turn = 1;
  current: string = TUTORIAL_RIVAL_ID;

  readonly me: EnginePlayer;
  readonly rival: EnginePlayer;
  // Seat order: the rival opens every round, so the player always acts
  // last and sees the round end right after their own move.
  private readonly seats: EnginePlayer[];

  private cardSeq = 0;
  private effectSeq = 0;

  constructor(
    private language: TutorialLanguage,
    setup: {
      meHand: string[];
      meDeck: string[];
      rivalHand: string[];
      rivalDeck: string[];
    },
  ) {
    this.me = this.createPlayer(TUTORIAL_ME_ID, setup.meDeck);
    this.rival = this.createPlayer(TUTORIAL_RIVAL_ID, setup.rivalDeck);
    this.seats = [this.rival, this.me];

    // Opening hands sit on top of the deck so deal() draws them first.
    this.me.deck.unshift(...setup.meHand.map((id) => this.createCard(id)));
    this.rival.deck.unshift(...setup.rivalHand.map((id) => this.createCard(id)));

    this.me.effects.push({
      Id: `tutorial-effect-${++this.effectSeq}`,
      Key: `CARD_${ENDLESS_WINTER_EFFECT.serverId}_GLOBAL_EFFECT`,
      Text: ENDLESS_WINTER_EFFECT.text[language],
      Color: null,
      roundsLeft: ENDLESS_WINTER_EFFECT.rounds,
    });
  }

  private createPlayer(id: string, deck: string[]): EnginePlayer {
    return {
      id,
      health: 20,
      hand: [],
      deck: deck.map((serverId) => this.createCard(serverId)),
      board: Array(BOARD_SIZE).fill(null),
      lastSpell: null,
      effects: [],
      played: [],
    };
  }

  createCard(serverId: string): CardData {
    const def = TUTORIAL_CARDS[serverId];
    return {
      id: `tutorial-card-${++this.cardSeq}`,
      serverId,
      name: def.name[this.language],
      description: def.description[this.language],
      families: def.families.map((f) => f[this.language]),
      attack: def.attack,
      health: def.health,
      type: def.type,
      imageUrl: `${serverId}.webp`,
      canPlay: true,
      hasEffect: def.effectTimes > 0,
      effectTimes: def.effectTimes,
      conditionProgress: null,
      conditionTarget: null,
    };
  }

  player(id: string): EnginePlayer {
    return id === TUTORIAL_ME_ID ? this.me : this.rival;
  }

  private opponent(player: EnginePlayer): EnginePlayer {
    return player === this.me ? this.rival : this.me;
  }

  findHandCard(playerId: string, serverId: string): CardData | undefined {
    return this.player(playerId).hand.find((c) => c.serverId === serverId);
  }

  findBoardIndex(playerId: string, serverId: string): number {
    return this.player(playerId).board.findIndex((c) => c?.serverId === serverId);
  }

  firstEmptySlot(playerId: string): number {
    return this.player(playerId).board.findIndex((c) => c === null);
  }

  // ---------- Queries ----------

  canPlay(player: EnginePlayer, card: CardData): boolean {
    const condition = TUTORIAL_CARDS[card.serverId].condition;
    if (!condition) return true;
    return this.conditionProgress(player, card) >= condition.target;
  }

  private conditionProgress(player: EnginePlayer, card: CardData): number {
    const condition = TUTORIAL_CARDS[card.serverId].condition;
    if (!condition) return 0;
    return player.played.filter((id) => id === condition.countServerId).length;
  }

  // ---------- Actions (each returns the GameEvents it produced) ----------

  deal(cardsEach: number): any[] {
    const events: any[] = [];
    for (let i = 0; i < cardsEach; i++) {
      for (const player of this.seats) {
        events.push(...this.drawFrom(player, player));
      }
    }
    return events;
  }

  draw(playerId: string): any[] {
    const player = this.player(playerId);
    return this.drawFrom(player, player);
  }

  playCard(playerId: string, cardId: string, boardIndex: number): any[] {
    const player = this.player(playerId);
    const index = player.hand.findIndex((c) => c.id === cardId);
    if (index === -1) return [];

    const [card] = player.hand.splice(index, 1);
    player.played.push(card.serverId);

    if (card.type === UNIT) {
      player.board[boardIndex] = card;
      return [
        {
          $type: 'UnitPlayed',
          PlayerSource: player.id,
          Source: player.id,
          BoardPosition: boardIndex,
          Unit: { ...card },
        },
      ];
    }

    player.lastSpell = card;
    const events: any[] = [
      {
        $type: 'SpellPlayed',
        PlayerSource: player.id,
        Source: player.id,
        Spell: { ...card },
      },
    ];

    switch (card.serverId) {
      case '27': // Fireball: -4 to the leftmost rival unit
        events.push(...this.damageLeftmostUnit(card, this.opponent(player), -4));
        break;
      case '13': // Rat Bite: [0/-3] to the leftmost rival unit
        events.push(...this.damageLeftmostUnit(card, this.opponent(player), -3));
        break;
    }

    return events;
  }

  attackUnit(playerId: string, attackerIndex: number, targetIndex: number): any[] {
    const player = this.player(playerId);
    const rival = this.opponent(player);
    const attacker = player.board[attackerIndex];
    const defender = rival.board[targetIndex];
    if (!attacker || !defender) return [];

    const events: any[] = [
      {
        $type: 'CardAttacked',
        PlayerSource: player.id,
        PlayerTarget: rival.id,
        Source: attacker.id,
        Attacker: attacker.id,
        TargetIndex: targetIndex,
        TargetType: 'BOARD',
        AttackerDamage: attacker.attack,
        DefenderDamage: defender.attack,
      },
    ];

    // Both units hit each other at once (the attack animation applies the
    // damage on screen), then whoever dropped to 0 dies.
    defender.health -= attacker.attack;
    attacker.health -= defender.attack;
    events.push(...this.checkDeath(attacker.id, rival, defender));
    events.push(...this.checkDeath(defender.id, player, attacker));

    return events;
  }

  attackPlayer(playerId: string, attackerIndex: number): any[] {
    const player = this.player(playerId);
    const rival = this.opponent(player);
    const attacker = player.board[attackerIndex];
    if (!attacker) return [];

    rival.health -= attacker.attack;
    return [
      {
        $type: 'CardAttacked',
        PlayerSource: player.id,
        PlayerTarget: rival.id,
        Source: attacker.id,
        Attacker: attacker.id,
        TargetIndex: -1,
        TargetType: 'PLAYER',
        AttackerDamage: attacker.attack,
        DefenderDamage: 0,
      },
    ];
  }

  // cardIndex follows the server's CardEffectActivated convention: a board
  // index, or BOARD_SIZE for the last spell played.
  activateEffect(playerId: string, cardIndex: number): any[] {
    const player = this.player(playerId);
    const card = cardIndex === BOARD_SIZE ? player.lastSpell : player.board[cardIndex];
    if (!card || card.effectTimes <= 0) return [];

    card.effectTimes--;
    const events: any[] = [
      { $type: 'CardEventPlayed', PlayerSource: player.id, Source: card.id, Card: card.id },
    ];

    switch (card.serverId) {
      case '65': {
        // Dragon Hatchling: take 1 life from the rival and give it to me.
        const rival = this.opponent(player);
        rival.health -= 1;
        player.health += 1;
        events.push(
          { $type: 'PlayerHealthChanged', PlayerSource: rival.id, Source: card.id, Amount: -1 },
          { $type: 'PlayerHealthChanged', PlayerSource: player.id, Source: card.id, Amount: 1 },
        );
        break;
      }
      case '13': // Rat Bite's skill: draw a card
        events.push(...this.drawFrom(player, card));
        break;
    }

    return events;
  }

  // Passes the turn on, like GameState.NextTurn: when the last seat has
  // played the round ends, round-end effects fire, and every second round
  // everybody draws a card.
  endTurn(): any[] {
    const index = this.seats.findIndex((p) => p.id === this.current);
    const nextIndex = (index + 1) % this.seats.length;
    this.current = this.seats[nextIndex].id;

    if (nextIndex !== 0) return [];

    const events = this.applyRoundEndEffects();
    this.turn++;
    if (this.turn % 2 === 0) {
      for (const player of this.seats) {
        events.push(...this.drawFrom(player, player));
      }
    }
    return events;
  }

  // ---------- Internals ----------

  private drawFrom(player: EnginePlayer, source: { id: string }): any[] {
    if (player.hand.length >= MAX_HAND) return [];

    const card = player.deck.shift();
    if (!card) return [];

    player.hand.push(card);
    return [
      {
        $type: 'CardDrawnEvent',
        PlayerSource: player.id,
        Source: source.id,
        PlayerId: player.id,
        Card: { ...card },
        FromDeck: true,
      },
    ];
  }

  private damageLeftmostUnit(source: CardData, owner: EnginePlayer, amount: number): any[] {
    const target = owner.board.find((c) => c !== null);
    if (!target) return [];

    target.health += amount;
    return [
      {
        $type: 'UnitHealthChanged',
        PlayerSource: owner.id,
        Source: source.id,
        Card: target.id,
        Amount: amount,
      },
      ...this.checkDeath(source.id, owner, target),
    ];
  }

  private checkDeath(sourceId: string, owner: EnginePlayer, unit: CardData): any[] {
    if (unit.health > 0) return [];

    const index = owner.board.findIndex((c) => c?.id === unit.id);
    if (index === -1) return [];

    owner.board[index] = null;
    return [{ $type: 'UnitDeath', PlayerSource: owner.id, Source: sourceId, Unit: unit.id }];
  }

  private applyRoundEndEffects(): any[] {
    const events: any[] = [];

    for (const player of this.seats) {
      for (const effect of player.effects) {
        if (effect.Key === `CARD_${ENDLESS_WINTER_EFFECT.serverId}_GLOBAL_EFFECT`) {
          // -1/0 to the enemy board. Like AlterUnitDamage, attack never
          // drops below 0 and units already at 0 are skipped.
          const rival = this.opponent(player);
          for (const unit of rival.board) {
            if (!unit || unit.attack <= 0) continue;
            unit.attack -= 1;
            events.push({
              $type: 'UnitDamageChanged',
              PlayerSource: rival.id,
              Source: effect.Id,
              Card: unit.id,
              Amount: -1,
            });
          }
        }
        effect.roundsLeft--;
      }
      player.effects = player.effects.filter((e) => e.roundsLeft > 0);
    }

    return events;
  }

  // ---------- Snapshot (what "game_state" would carry) ----------

  // Applies the turn, round counter, effects and hand playability to the
  // on-screen state, the way GameComponent reconciles a game_state push.
  // Health, boards, hands and deck counts are left alone: those only ever
  // change through replayed events, exactly like in a real match.
  syncView(view: Game): void {
    view.CurrentTurn = this.turn;

    for (const [viewPlayer, player] of [
      [view.Me, this.me],
      [view.Rivals[0], this.rival],
    ] as const) {
      viewPlayer.IsMyTurn = this.current === player.id;

      const effects = player.effects.map(({ roundsLeft, ...e }) => e);
      const sameEffects =
        effects.length === viewPlayer.GlobalEffects.length &&
        effects.every((e, i) => e.Id === viewPlayer.GlobalEffects[i]?.Id);
      if (!sameEffects) {
        viewPlayer.GlobalEffects = effects;
      }

      for (const card of viewPlayer.HandData) {
        const source = player.hand.find((c) => c.id === card.id);
        if (!source) continue;
        const condition = TUTORIAL_CARDS[source.serverId].condition;
        card.canPlay = this.canPlay(player, source);
        card.conditionProgress = condition ? this.conditionProgress(player, source) : null;
        card.conditionTarget = condition?.target ?? null;
      }
    }
  }

  // Initial on-screen state: empty hands (the opening hand is dealt with
  // CardDrawnEvents, like a fresh match) and full decks.
  initialView(
    names: { me: string; rival: string },
    deckIds: { me: string; rival: string },
    createHealth: (value: number) => Health,
  ): Game {
    const viewPlayer = (player: EnginePlayer, name: string, deckId: string, targetId: string) => ({
      Id: player.id,
      Name: name,
      Board: Array(BOARD_SIZE).fill(null),
      Health: createHealth(player.health),
      HandSize: 0,
      HandData: [] as Card[],
      Deck: { id: deckId, name: '', description: '', cardAmount: player.deck.length },
      GlobalEffects: [] as GlobalEffect[],
      IsMyTurn: false,
      LastSpellPlayed: null,
      TargetPlayer: targetId,
      TargetPlayers: [targetId],
    });

    return {
      Id: 'tutorial',
      Me: viewPlayer(this.me, names.me, deckIds.me, this.rival.id),
      Rivals: [viewPlayer(this.rival, names.rival, deckIds.rival, this.me.id)],
      CurrentTurn: this.turn,
      IsReconnect: false,
      HuntedPlayer: null,
    };
  }

  isSpell(card: { type?: string }): boolean {
    return card.type === SPELL;
  }
}
