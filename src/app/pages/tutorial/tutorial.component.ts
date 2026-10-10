import {
  Component,
  HostListener,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { Card } from '../../models/card.model';
import { Game } from '../../models/game.model';
import { Player } from '../../models/player.model';
import { Message } from '../../models/message.model';
import { SPELL, UNIT } from '../../core/config/game-data-config';
import { ChromaticColorName } from '../../core/config/chromatic-colors';
import { languageConfig } from '../../core/config/language-config';

import { WebsocketService } from '../../core/services/websocket.service';
import { TranslationService } from '../../core/services/translation.service';
import { LanguageSettingsService } from '../../core/services/language.service';
import { GameStateService } from '../../core/services/game-state.service';
import { GameAnimationService } from '../../core/services/game-animation.service';
import { AnimationFxService } from '../../core/services/animation-fx.service';
import { CardMovementAnimationService } from '../../core/services/card-movement-animation.service';
import { CardEffectAnimationService } from '../../core/services/card-effect-animation.service';
import { AudioService } from '../../core/services/audio.service';

import { ChatComponent } from '../../shared/components/chat/chat.component';
import { SettingsComponent } from '../../shared/components/settings/settings.component';
import { HelpComponent } from '../../shared/components/help/help.component';
import { GameCardCheckComponent } from '../../shared/components/game-card-check/game-card-check.component';
import { BannerTextComponent } from '../../shared/components/banner-text/banner-text.component';

import { TutorialLanguage } from './tutorial-cards';
import {
  BOARD_SIZE,
  TUTORIAL_ME_ID,
  TUTORIAL_RIVAL_ID,
  TutorialEngine,
} from './tutorial-engine';
import { TUTORIAL_TEXT, TutorialTextKey } from './tutorial-text';

// What the current step waits for the player to do. Every board interaction
// is checked against it, so the tutorial can't be derailed by a stray click.
type ExpectedAction =
  | { kind: 'inspect'; serverId: string }
  | { kind: 'close-inspect' }
  | { kind: 'play-spell'; serverId: string }
  | { kind: 'select-hand-unit'; serverId: string }
  | { kind: 'place-unit' }
  | { kind: 'select-attacker'; serverId: string }
  | { kind: 'attack-unit'; serverId: string }
  | { kind: 'attack-player' }
  | { kind: 'activate-unit'; serverId: string }
  | { kind: 'activate-spell' }
  | { kind: 'draw' };

// A CSS selector, or a function building one from the current state (e.g.
// "the Fireball in my hand"). Each target becomes one highlighted hole; a
// selector matching several elements highlights their bounding box.
type SpotlightTarget = string | (() => string | null);

interface Spotlight {
  textKey: string;
  targets: SpotlightTarget[];
  // Explanations block the table and wait for "Next"; action steps leave
  // the table clickable and wait for the expected action instead.
  blocking: boolean;
  dim: boolean;
}

type BoxPlacement = 'bottom' | 'top' | 'left' | 'right' | 'center';

interface Hole {
  x: number;
  y: number;
  width: number;
  height: number;
}

const HOLE_PADDING = 10;
const NUDGE_MS = 1800;

// Thrown (and swallowed) when the page is left mid-tutorial, so the script
// stops instead of carrying on against a destroyed view.
class TutorialAborted extends Error {}

const SEL = {
  myInfo: '.player-slot.me .player-info',
  rivalInfo: '.player-slot.rival .player-info',
  myHealth: `app-health[data-game-id="${TUTORIAL_ME_ID}"]`,
  rivalHealth: `app-health[data-game-id="${TUTORIAL_RIVAL_ID}"]`,
  hand: '.player-slot.me .own-hand',
  rivalHand: '.player-slot.rival .hand',
  myDeck: `[data-game-id="${TUTORIAL_ME_ID}-deck"]`,
  rivalDeck: `[data-game-id="${TUTORIAL_RIVAL_ID}-deck"]`,
  myBoard: '.player-slot.me app-dock:not(.last-spell)',
  rivalBoard: '.player-slot.rival app-dock:not(.last-spell)',
  myLastSpell: '.player-slot.me app-dock.last-spell',
  myEffects: '.player-slot.me .effects-section',
  roundCounter: '.turn-text',
  drawIcon: '.turn-text .draw-icon',
  button: (name: string) => `[data-tutorial="${name}"]`,
};

/**
 * Interactive tutorial. A copy of GameComponent's table and event playback,
 * but driven by a local TutorialEngine instead of the server: every action
 * produces the same GameEvents a real match would, replayed through the same
 * animations. A scripted sequence of steps narrates the game with the
 * banner text component and a spotlight over the relevant part of the table.
 */
@Component({
  selector: 'app-tutorial',
  standalone: false,
  templateUrl: './tutorial.component.html',
  styleUrls: ['../game/game.component.css', './tutorial.component.css'],
})
export class TutorialComponent implements OnInit, OnDestroy {
  spell: string = SPELL;
  unit: string = UNIT;

  lang: TutorialLanguage = 'es';
  engine!: TutorialEngine;
  gameState!: Game;

  isAnimating = false;
  selectedCard: Card | null = null;
  unitSelected = false;
  attackingUnit: Card | null = null;
  unreadNotificationCounter = 0;

  spotlight: Spotlight | null = null;
  holes: Hole[] = [];
  boxPlacement: BoxPlacement = 'bottom';
  nudging = false;
  finished = false;

  private expected: ExpectedAction | null = null;
  private resolveStep?: () => void;
  private destroyed = false;
  private nudgeTimer?: ReturnType<typeof setTimeout>;
  private spotlightFrame?: number;
  private chatReplied = false;
  private turnsRevealed = false;
  private languageSub?: Subscription;

  @ViewChild('banner') banner!: BannerTextComponent;
  @ViewChild('chat') chat!: ChatComponent;
  @ViewChild('settings') settings!: SettingsComponent;
  @ViewChild('helpwindow') help!: HelpComponent;
  @ViewChild('gamecheck') cardCheck!: GameCardCheckComponent;

  constructor(
    private router: Router,
    private zone: NgZone,
    private ws: WebsocketService,
    private translation: TranslationService,
    private languageService: LanguageSettingsService,
    private gameStateService: GameStateService,
    private animationService: GameAnimationService,
    private fx: AnimationFxService,
    private cardMovement: CardMovementAnimationService,
    private cardEffects: CardEffectAnimationService,
    public audio: AudioService,
  ) {
    this.lang = this.resolveLanguage(languageConfig.getLanguage());
    this.setupGame();
    audio.startMusic('game');
  }

  ngOnInit(): void {
    // Only for UI translations (e.g. a language change from the settings
    // panel): the tutorial itself never talks to the server.
    this.ws.subscribe(this.processMessage);
    this.languageSub = this.languageService.language$.subscribe(
      (code) => (this.lang = this.resolveLanguage(code)),
    );

    this.audio.playSfx('/audio/game_start.mp3');
    this.scrollToCenter();
    this.runScript();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.ws.clearSubscription();
    this.languageSub?.unsubscribe();
    this.stopSpotlightLoop();
    clearTimeout(this.nudgeTimer);
  }

  processMessage = (msg: any): boolean => {
    if (msg.Type === 'translations') {
      this.translation.setDictionary(msg.Content?.values ?? {});
      return false;
    }
    return true;
  };

  private resolveLanguage(code: string): TutorialLanguage {
    return code === 'en' ? 'en' : 'es';
  }

  t(key: string): string {
    return TUTORIAL_TEXT[key as TutorialTextKey]?.[this.lang] ?? key;
  }

  private setupGame(): void {
    this.engine = new TutorialEngine(this.lang, {
      meHand: ['27', '65', '13', '29'],
      meDeck: ['7', '30', '28', '14', '27', '30', '7', '28', '14', '27'],
      rivalHand: ['16', '17', '16', '21'],
      rivalDeck: ['24', '26', '18', '23', '17', '24', '26', '18', '23', '17'],
    });
    this.gameState = this.engine.initialView(
      { me: this.t('ME_NAME'), rival: this.t('RIVAL_NAME') },
      { me: '7', rival: '6' },
      (value) => this.gameStateService.createHealth(value),
    );
  }

  // =====================================================================
  // Script
  // =====================================================================

  private async runScript(): Promise<void> {
    try {
      await this.script();
    } catch (error) {
      if (!(error instanceof TutorialAborted)) {
        throw error;
      }
    }
  }

  private async script(): Promise<void> {
    // Let the first frame render before anything animates.
    await this.fx.nextFrame();
    this.checkAlive();

    // --- Intro ---
    await this.say('INTRO_1');
    await this.say('INTRO_2');
    await this.say('INTRO_3');

    await this.play(this.engine.deal(4));
    this.sync();

    // --- The table ---
    await this.explain('HEALTH', [SEL.myHealth]);
    await this.explain('RIVAL_HEALTH', [SEL.rivalHealth]);
    await this.explain('HAND', [SEL.hand]);
    await this.explain('DECK', [SEL.myDeck]);
    await this.explain('BOARD', [SEL.myBoard]);
    await this.explain('LAST_SPELL', [SEL.myLastSpell]);
    await this.explain('EFFECTS', [SEL.myEffects]);
    await this.explain('BUTTON_CHAT', [SEL.button('chat')]);
    await this.explain('BUTTON_SETTINGS', [SEL.button('settings')]);
    await this.explain('BUTTON_HELP', [SEL.button('help')]);
    await this.explain('BUTTON_SURRENDER', [SEL.button('surrender')]);
    await this.explain('DRAG', []);

    // --- Rounds (round 1) ---
    await this.say('ROUNDS');
    await this.explain('ROUND_COUNTER', [SEL.roundCounter]);
    this.turnsRevealed = true;
    this.sync();
    await this.turnBanner();
    await this.explain('WHOSE_TURN', [SEL.rivalInfo]);
    await this.rivalPlaysUnit('16', 0);
    await this.explain('RIVAL_PLAYED_UNIT', [SEL.rivalBoard]);
    await this.passTurn();
    await this.explain('MY_TURN', [SEL.myInfo]);
    await this.explain('ONE_ACTION', []);
    await this.explain('DRAW_INDICATOR', [SEL.drawIcon]);

    await this.expect({ kind: 'inspect', serverId: '29' }, 'INSPECT', [this.handCard('29')]);
    await this.expect({ kind: 'close-inspect' }, 'CLOSE_INSPECT', [], false);
    await this.expect({ kind: 'play-spell', serverId: '27' }, 'PLAY_SPELL', [this.handCard('27')]);
    await this.explain('AFTER_SPELL', [SEL.myLastSpell]);
    await this.passTurn(false);
    await this.explain('ROUND_END_DRAW', [SEL.hand, SEL.rivalHand]);

    // --- Round 2 ---
    await this.turnBanner();
    await this.rivalPlaysUnit('17', 0);
    await this.passTurn();
    await this.explain('NO_DRAW_ROUND', [SEL.roundCounter]);
    await this.expect({ kind: 'select-hand-unit', serverId: '65' }, 'SELECT_UNIT', [
      this.handCard('65'),
    ]);
    await this.expect({ kind: 'place-unit' }, 'PLACE_UNIT', this.freeSlots());
    await this.passTurn(false);
    await this.explain('EFFECT_TRIGGERED', [SEL.rivalBoard, SEL.myEffects]);

    // --- Round 3 ---
    await this.turnBanner();
    await this.rivalPlaysUnit('16', 1);
    await this.passTurn();
    await this.expect({ kind: 'select-attacker', serverId: '65' }, 'SELECT_ATTACKER', [
      this.boardCard(TUTORIAL_ME_ID, '65'),
    ]);
    await this.expect({ kind: 'attack-unit', serverId: '17' }, 'ATTACK_UNIT', [
      this.boardCard(TUTORIAL_RIVAL_ID, '17'),
    ]);
    await this.passTurn(false);
    await this.explain('ROUND_END_DRAW', [SEL.hand, SEL.rivalHand]);

    // --- Round 4 ---
    await this.turnBanner();
    await this.rivalAttacksPlayer('16');
    await this.explain('RIVAL_ATTACKED', [SEL.myHealth]);
    await this.passTurn();
    await this.expect({ kind: 'select-attacker', serverId: '65' }, 'SELECT_ABILITY', [
      this.boardCard(TUTORIAL_ME_ID, '65'),
    ]);
    await this.expect({ kind: 'activate-unit', serverId: '65' }, 'USE_ABILITY', [
      this.boardCard(TUTORIAL_ME_ID, '65'),
    ]);
    await this.explain('AFTER_ABILITY', [SEL.rivalHealth, SEL.myHealth]);
    await this.expect({ kind: 'select-attacker', serverId: '65' }, 'SELECT_ATTACKER_PLAYER', [
      this.boardCard(TUTORIAL_ME_ID, '65'),
    ]);
    await this.expect({ kind: 'attack-player' }, 'ATTACK_PLAYER', [SEL.rivalHealth]);
    await this.passTurn(false);

    // --- Round 5 ---
    await this.turnBanner();
    await this.rivalPlaysUnit('21', 0);
    await this.passTurn();
    await this.expect({ kind: 'play-spell', serverId: '13' }, 'PLAY_SPELL_ABILITY', [
      this.handCard('13'),
    ]);
    await this.explain('AFTER_SPELL_ABILITY', [SEL.myLastSpell]);
    await this.passTurn(false);
    await this.explain('ROUND_END_DRAW', [SEL.hand, SEL.rivalHand]);

    // --- Round 6 ---
    await this.turnBanner();
    await this.play(this.engine.draw(TUTORIAL_RIVAL_ID));
    await this.explain('RIVAL_DREW', [SEL.rivalDeck, SEL.rivalHand]);
    await this.passTurn();
    await this.expect({ kind: 'activate-spell' }, 'USE_SPELL_ABILITY', [SEL.myLastSpell]);
    await this.expect({ kind: 'draw' }, 'DRAW', [SEL.myDeck]);

    // --- Wrap-up ---
    await this.explain('MULTIPLAYER', []);
    await this.say('FINISH');
    this.finished = true;
    this.audio.playSfx('audio/win.mp3');
  }

  // =====================================================================
  // Step helpers
  // =====================================================================

  private checkAlive(): void {
    if (this.destroyed) throw new TutorialAborted();
  }

  // Big narration banner over the table; waits for a click.
  private async say(key: string): Promise<void> {
    this.checkAlive();
    await this.banner.show(this.t(`${key}_TITLE`), {
      subtitle: this.t(`${key}_TEXT`),
      waitForClick: true,
      continueHint: this.t('CONTINUE'),
    });
    this.checkAlive();
  }

  // Spotlight + description; waits for "Next".
  private async explain(key: string, targets: SpotlightTarget[]): Promise<void> {
    this.checkAlive();
    await this.showStep({ textKey: key, targets, blocking: true, dim: true }, null);
  }

  // Spotlight + instruction; waits for the player to do `action` (and for
  // its animations to finish).
  private async expect(
    action: ExpectedAction,
    key: string,
    targets: SpotlightTarget[],
    dim: boolean = true,
  ): Promise<void> {
    this.checkAlive();
    await this.showStep({ textKey: key, targets, blocking: false, dim }, action);
  }

  private showStep(spotlight: Spotlight, action: ExpectedAction | null): Promise<void> {
    this.spotlight = spotlight;
    this.expected = action;
    this.nudging = false;
    this.holes = [];
    this.boxPlacement = 'bottom';
    this.scrollTargetsIntoView(spotlight.targets);
    this.startSpotlightLoop();

    return new Promise<void>((resolve) => {
      this.resolveStep = () => {
        this.resolveStep = undefined;
        this.expected = null;
        this.spotlight = null;
        this.holes = [];
        this.stopSpotlightLoop();
        resolve();
      };
    }).then(() => this.checkAlive());
  }

  next(): void {
    if (this.spotlight?.blocking) {
      this.audio.playSfx('/audio/card_hover.mp3');
      this.resolveStep?.();
    }
  }

  private async turnBanner(): Promise<void> {
    this.checkAlive();
    const mine = this.gameState.Me.IsMyTurn;
    if (mine) {
      this.audio.playSfx('audio/ding.mp3', false);
    }
    await this.banner.show(this.t(mine ? 'YOUR_TURN' : 'RIVAL_TURN'), {
      variant: mine ? 'mine' : 'rival',
      duration: 900,
    });
    this.checkAlive();
  }

  // Ends the current turn (and the round, when it's the last seat) and
  // replays whatever that triggered.
  private async passTurn(showBanner: boolean = true): Promise<void> {
    this.checkAlive();
    this.selectedCard = null;
    this.unitSelected = false;
    this.attackingUnit = null;

    await this.play(this.engine.endTurn());
    this.sync();
    if (showBanner) {
      await this.turnBanner();
    }
  }

  private async rivalPlaysUnit(serverId: string, slot: number): Promise<void> {
    await this.rivalThink();
    const card = this.engine.findHandCard(TUTORIAL_RIVAL_ID, serverId)!;
    await this.play(this.engine.playCard(TUTORIAL_RIVAL_ID, card.id, slot));
  }

  private async rivalAttacksPlayer(serverId: string): Promise<void> {
    await this.rivalThink();
    const index = this.engine.findBoardIndex(TUTORIAL_RIVAL_ID, serverId);
    await this.play(this.engine.attackPlayer(TUTORIAL_RIVAL_ID, index));
  }

  // A short pause so the rival's move doesn't happen instantly.
  private async rivalThink(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    this.checkAlive();
  }

  private handCard(serverId: string): SpotlightTarget {
    return () => {
      const card = this.gameState.Me.HandData.find((c) => c.serverId === serverId);
      return card ? `[data-hand-id="${TUTORIAL_ME_ID}"] [data-game-id="${card.id}"]` : null;
    };
  }

  private boardCard(playerId: string, serverId: string): SpotlightTarget {
    return () => {
      const card = this.getPlayer(playerId).Board.find((c) => c?.serverId === serverId);
      return card ? `[data-game-id="${card.id}"]` : null;
    };
  }

  private freeSlots(): SpotlightTarget[] {
    return Array.from({ length: BOARD_SIZE }, (_, i) => () =>
      this.gameState.Me.Board[i] === null ? `[data-dock-id="${TUTORIAL_ME_ID}-dock-${i}"]` : null,
    );
  }

  // =====================================================================
  // Spotlight rendering
  // =====================================================================

  private scrollTargetsIntoView(targets: SpotlightTarget[]): void {
    const element = targets
      .map((t) => this.resolveTarget(t))
      .map((selector) => (selector ? document.querySelector(selector) : null))
      .find((el): el is HTMLElement => !!el);

    element?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  }

  private resolveTarget(target: SpotlightTarget): string | null {
    return typeof target === 'function' ? target() : target;
  }

  // Tracks the targets every frame (outside Angular, re-entering only when
  // something moved) so the holes follow scrolling, dragging and animations.
  private startSpotlightLoop(): void {
    this.stopSpotlightLoop();
    this.zone.runOutsideAngular(() => {
      const tick = () => {
        this.updateHoles();
        this.spotlightFrame = requestAnimationFrame(tick);
      };
      tick();
    });
  }

  private stopSpotlightLoop(): void {
    if (this.spotlightFrame !== undefined) {
      cancelAnimationFrame(this.spotlightFrame);
      this.spotlightFrame = undefined;
    }
  }

  private updateHoles(): void {
    if (!this.spotlight) return;

    const holes: Hole[] = [];
    for (const target of this.spotlight.targets) {
      const selector = this.resolveTarget(target);
      if (!selector) continue;

      const rects = Array.from(document.querySelectorAll(selector))
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width > 0 && r.height > 0);
      if (rects.length === 0) continue;

      const left = Math.min(...rects.map((r) => r.left));
      const top = Math.min(...rects.map((r) => r.top));
      const right = Math.max(...rects.map((r) => r.right));
      const bottom = Math.max(...rects.map((r) => r.bottom));
      holes.push({
        x: left - HOLE_PADDING,
        y: top - HOLE_PADDING,
        width: right - left + HOLE_PADDING * 2,
        height: bottom - top + HOLE_PADDING * 2,
      });
    }

    const boxPlacement = this.pickBoxPlacement(holes);

    const changed =
      boxPlacement !== this.boxPlacement ||
      holes.length !== this.holes.length ||
      holes.some((h, i) => {
        const old = this.holes[i];
        return (
          Math.abs(h.x - old.x) > 0.5 ||
          Math.abs(h.y - old.y) > 0.5 ||
          Math.abs(h.width - old.width) > 0.5 ||
          Math.abs(h.height - old.height) > 0.5
        );
      });

    if (changed) {
      this.zone.run(() => {
        this.holes = holes;
        this.boxPlacement = boxPlacement;
      });
    }
  }

  // Puts the description box wherever it hides the least of the highlighted
  // holes: below or above them first, then to either side. Geometry mirrors
  // the .tutorial-box placement classes in the stylesheet.
  private pickBoxPlacement(holes: Hole[]): BoxPlacement {
    if (!this.spotlight?.dim) return 'left';
    if (holes.length === 0) return 'center';

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    // Only measured while the box is wide: its height changes with its
    // placement, and feeding that back in would make it flip-flop.
    const box = document.querySelector('.tutorial-box') as HTMLElement | null;
    const isWide = ['top', 'bottom', 'center'].includes(this.boxPlacement);
    if (box && isWide && box.offsetHeight > 0) {
      this.wideBoxHeight = box.offsetHeight;
    }
    const height = this.wideBoxHeight;

    const wide = Math.min(44 * rem, vw - 2 * rem);
    const narrow = Math.min(26 * rem, vw / 2 - 14 * rem);
    // A narrow box wraps its text into more lines, so it gets taller.
    const sideHeight = height * (wide / Math.max(narrow, 1));

    const candidates: [BoxPlacement, Hole][] = [
      ['bottom', { x: (vw - wide) / 2, y: vh - 2 * rem - height, width: wide, height }],
      ['top', { x: (vw - wide) / 2, y: 6.5 * rem, width: wide, height }],
    ];
    if (narrow >= 14 * rem) {
      const y = (vh - sideHeight) / 2;
      candidates.push(
        ['left', { x: 1.5 * rem, y, width: narrow, height: sideHeight }],
        ['right', { x: vw - 1.5 * rem - narrow, y, width: narrow, height: sideHeight }],
      );
    }

    const overlap = (a: Hole, b: Hole) =>
      Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) *
      Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
    const scores = candidates.map(
      ([placement, rect]) =>
        [placement, holes.reduce((sum, hole) => sum + overlap(rect, hole), 0)] as const,
    );

    // First best wins ties, so a free top/bottom spot beats an equally free
    // side; and the current spot is kept unless another is clearly better,
    // so the box doesn't hop around while holes animate.
    const best = scores.reduce((a, b) => (b[1] < a[1] ? b : a));
    const current = scores.find(([placement]) => placement === this.boxPlacement);
    if (current && current[1] <= best[1] + 2000) {
      return current[0];
    }
    return best[0];
  }

  private wideBoxHeight = 220;

  // =====================================================================
  // Action gating
  // =====================================================================

  private isExpected(check: (action: ExpectedAction) => boolean): boolean {
    return !!this.expected && check(this.expected);
  }

  // Called for any interaction the current step doesn't allow.
  private nudge(): void {
    if (this.isAnimating || !this.spotlight) return;
    clearTimeout(this.nudgeTimer);
    this.nudging = false;
    // Restart the shake animation even if a nudge is already showing.
    requestAnimationFrame(() => {
      this.nudging = true;
      this.nudgeTimer = setTimeout(() => (this.nudging = false), NUDGE_MS);
    });
  }

  // Marks the step as being carried out (so a double click can't fire it
  // twice) and resolves it once `work` (usually the action's animations)
  // is done.
  private async fulfil(work: () => Promise<void> | void = () => {}): Promise<void> {
    const resolve = this.resolveStep;
    this.expected = null;
    // Clear the stage so the action's animations play on an undimmed table.
    this.spotlight = null;
    this.holes = [];
    this.stopSpotlightLoop();
    await work();
    resolve?.();
  }

  // =====================================================================
  // Player interactions (same entry points as GameComponent)
  // =====================================================================

  onRightClick(event: MouseEvent, card: Card | null, owner: Player): void {
    event.preventDefault();
    if (!card) return;

    this.cardCheck.open(card, this.activeColorsOf(owner));

    if (this.isExpected((a) => a.kind === 'inspect' && a.serverId === card.serverId)) {
      this.fulfil();
    }
  }

  onCardCheckClosed(): void {
    if (this.isExpected((a) => a.kind === 'close-inspect')) {
      this.fulfil();
    }
  }

  private activeColorsOf(player: Player): ChromaticColorName[] {
    return player.GlobalEffects
      .filter((e) => e.Color !== null)
      .map((e) => e.Color as ChromaticColorName);
  }

  cardSelected(card: Card | null): void {
    if (!card || this.isAnimating) return;

    if (card.type === this.unit) {
      if (this.isExpected((a) => a.kind === 'select-hand-unit' && a.serverId === card.serverId)) {
        this.selectedCard = card;
        this.unitSelected = true;
        this.attackingUnit = null;
        this.fulfil();
        return;
      }
    } else if (
      card.canPlay &&
      this.isExpected((a) => a.kind === 'play-spell' && a.serverId === card.serverId)
    ) {
      this.selectedCard = null;
      this.fulfil(() => this.play(this.engine.playCard(TUTORIAL_ME_ID, card.id, -1)));
      return;
    }

    this.nudge();
  }

  dockSelected(position: number): void {
    // Clicking a unit already on the board also lands here (the click
    // bubbles up to its dock); attackingUnitSelected handles that one.
    if (this.gameState.Me.Board[position] !== null) return;
    if (this.isAnimating) return;

    if (this.isExpected((a) => a.kind === 'place-unit') && this.selectedCard && this.unitSelected) {
      const card = this.selectedCard;
      this.selectedCard = null;
      this.unitSelected = false;
      this.fulfil(() => this.play(this.engine.playCard(TUTORIAL_ME_ID, card.id, position)));
      return;
    }

    this.nudge();
  }

  attackingUnitSelected(card: Card | null): void {
    if (!card || this.isAnimating) return;

    const activating =
      this.attackingUnit?.id === card.id && !!card.hasEffect && (card.effectTimes ?? 0) > 0;

    if (activating) {
      if (this.isExpected((a) => a.kind === 'activate-unit' && a.serverId === card.serverId)) {
        const index = this.gameState.Me.Board.findIndex((c) => c?.id === card.id);
        this.attackingUnit = null;
        this.fulfil(() => this.play(this.engine.activateEffect(TUTORIAL_ME_ID, index)));
        return;
      }
    } else if (
      this.isExpected((a) => a.kind === 'select-attacker' && a.serverId === card.serverId)
    ) {
      this.selectedCard = null;
      this.unitSelected = false;
      this.attackingUnit = card;
      this.fulfil();
      return;
    }

    this.nudge();
  }

  rivalTargetSelected(): void {
    if (this.isAnimating) return;

    if (this.isExpected((a) => a.kind === 'attack-player') && this.attackingUnit) {
      const index = this.gameState.Me.Board.findIndex((c) => c?.id === this.attackingUnit?.id);
      this.attackingUnit = null;
      this.fulfil(() => this.play(this.engine.attackPlayer(TUTORIAL_ME_ID, index)));
      return;
    }

    this.nudge();
  }

  rivalBoardCardSelected(rival: Player, card: Card | null): void {
    if (!card || this.isAnimating) return;

    if (
      this.attackingUnit &&
      this.isExpected((a) => a.kind === 'attack-unit' && a.serverId === card.serverId)
    ) {
      const attacker = this.gameState.Me.Board.findIndex((c) => c?.id === this.attackingUnit?.id);
      const target = rival.Board.findIndex((c) => c?.id === card.id);
      this.attackingUnit = null;
      this.fulfil(() => this.play(this.engine.attackUnit(TUTORIAL_ME_ID, attacker, target)));
      return;
    }

    this.nudge();
  }

  lastSpellClicked(): void {
    if (this.isAnimating) return;

    if (this.isExpected((a) => a.kind === 'activate-spell')) {
      this.fulfil(() => this.play(this.engine.activateEffect(TUTORIAL_ME_ID, BOARD_SIZE)));
      return;
    }

    this.nudge();
  }

  deckSelected(): void {
    if (this.isAnimating) return;

    if (this.isExpected((a) => a.kind === 'draw')) {
      this.fulfil(() => this.play(this.engine.draw(TUTORIAL_ME_ID)));
      return;
    }

    this.nudge();
  }

  // =====================================================================
  // Event playback (copied from GameComponent.playEvent)
  // =====================================================================

  private async play(events: any[]): Promise<void> {
    this.isAnimating = true;
    try {
      for (const event of events) {
        if (this.destroyed) return;
        await this.playEvent(event);
      }
    } finally {
      this.isAnimating = false;
    }
    this.sync();
  }

  private sync(): void {
    this.engine.syncView(this.gameState);

    // Nobody's swarm lights up until the rounds part explains what it means.
    if (!this.turnsRevealed) {
      this.gameState.Me.IsMyTurn = false;
      this.gameState.Rivals[0].IsMyTurn = false;
    }
  }

  isUser(id: string): boolean {
    return this.gameState.Me.Id === id;
  }

  getPlayer(id: string): Player {
    return this.isUser(id) ? this.gameState.Me : this.gameState.Rivals[0];
  }

  private isGlobalEffectSource(source: string | undefined): boolean {
    if (!source) return false;
    return [this.gameState.Me, ...this.gameState.Rivals].some((p) =>
      p.GlobalEffects.some((e) => e.Id === source),
    );
  }

  private shakeIfGlobalEffectSource(source: string | undefined): void {
    if (this.isGlobalEffectSource(source)) {
      this.fx.shakeElement(source!);
    }
  }

  private findElement(id: string): HTMLElement {
    return document.querySelector(`[data-game-id="${id}"]`) as HTMLElement;
  }

  private getDeckId(id: string): string {
    return id + '-deck';
  }

  private async animateAttack(event: any): Promise<void> {
    await this.fx.nextFrame();
    const attackerEl = this.findElement(event.Attacker);
    const targetPlayer = this.getPlayer(event.PlayerTarget);
    const targetEl =
      event.TargetType === 'PLAYER'
        ? this.findElement(targetPlayer.Id)
        : targetPlayer.Board[event.TargetIndex]
          ? this.findElement(targetPlayer.Board[event.TargetIndex]!.id)
          : null;

    if (!attackerEl || !targetEl) return;

    await this.animationService.animateAttack(
      attackerEl,
      targetEl,
      targetPlayer,
      event.TargetIndex,
      event.TargetType,
      event.AttackerDamage,
      event.DefenderDamage,
      this.getPlayer(event.PlayerSource),
      event.Attacker,
    );
  }

  private playEvent(event: any): Promise<void> {
    return new Promise(async (resolve) => {
      switch (event.$type) {
        case 'CardEventPlayed': {
          const player = this.getPlayer(event.PlayerSource);
          const onBoard = player.Board.some((c) => c?.id === event.Card);
          await this.animationService.animateSkillEfect(event.Card);
          if (onBoard) {
            this.gameStateService.consumeBoardEffect(player, event.Card);
          } else {
            this.gameStateService.consumeSpellEffect(player);
          }
          break;
        }
        case 'CardAttacked':
          await this.animateAttack(event);
          break;
        case 'CardDrawnEvent': {
          const player = this.getPlayer(event.PlayerSource);
          const drawn = Card.fromJSON(event.Card);
          this.audio.playSfx('/audio/card_drawn.mp3', true);
          await this.cardMovement.animateCardDrawnToHand(
            this.getDeckId(player.Id),
            player.Id,
            drawn.id,
            drawn.imageUrl,
            1100,
            () => this.gameStateService.addCardToHand(player, drawn),
            !this.isUser(player.Id),
          );
          if (event.FromDeck) {
            this.gameStateService.updateDeckAmount(player, -1);
          }
          break;
        }
        case 'PlayerHealthChanged': {
          this.shakeIfGlobalEffectSource(event.Source);
          await this.animationService.createProjectile(event.Source, event.PlayerSource, '', event.Amount);
          this.getPlayer(event.PlayerSource).Health.changeHealth(event.Amount, 500);
          break;
        }
        case 'UnitHealthChanged': {
          this.shakeIfGlobalEffectSource(event.Source);
          await this.animationService.createProjectile(event.Source, event.Card, '', event.Amount);
          this.audio.playSfx('/audio/unit_health_changed.mp3', true);
          const card = this.getPlayer(event.PlayerSource).Board.find((c) => c?.id === event.Card);
          if (card) {
            card.changeHealth(event.Amount);
            this.fx.spawnFloatingNumber(card.id, event.Amount, 'health');
          }
          break;
        }
        case 'UnitDamageChanged': {
          this.shakeIfGlobalEffectSource(event.Source);
          await this.animationService.createProjectile(event.Source, event.Card, '', event.Amount);
          const card = this.getPlayer(event.PlayerSource).Board.find((c) => c?.id === event.Card);
          if (card) {
            card.changeDamage(event.Amount);
            this.fx.spawnFloatingNumber(card.id, event.Amount, 'attack');
          }
          break;
        }
        case 'UnitDeath': {
          const board = this.getPlayer(event.PlayerSource).Board;
          const element = this.findElement(event.Unit);
          const index = board.findIndex((c) => c?.id === event.Unit);
          if (index !== -1) {
            if (element) {
              this.audio.playSfx('/audio/unit_death.mp3', true);
              await this.animationService.animateUnitDeath(element);
            }
            board[index] = null;
          }
          break;
        }
        case 'UnitPlayed': {
          const player = this.getPlayer(event.PlayerSource);
          const unit = Card.fromJSON(event.Unit);
          await this.cardEffects.playCardIntroAnimation(unit.serverId);
          await this.cardMovement.animateCardPlayed(
            player.Id,
            unit.id,
            unit.imageUrl,
            `${player.Id}-dock-${event.BoardPosition}`,
            false,
            () => this.gameStateService.removeCardFromHand(player, unit.id),
          );
          this.audio.playSfx('/audio/unit_played.mp3', true);
          this.gameStateService.placeCardOnBoard(player, unit, event.BoardPosition);
          await this.cardEffects.playCardAnimation(unit.serverId, unit.id);
          break;
        }
        case 'SpellPlayed': {
          const player = this.getPlayer(event.PlayerSource);
          const spell = Card.fromJSON(event.Spell);
          await this.cardEffects.playCardIntroAnimation(spell.serverId);
          await this.cardMovement.animateCardPlayed(
            player.Id,
            spell.id,
            spell.imageUrl,
            `${player.Id}-spell`,
            true,
            () => this.gameStateService.removeCardFromHand(player, spell.id),
          );
          this.audio.playSfx('/audio/unit_played.mp3', true);
          this.gameStateService.setLastSpellPlayed(player, spell);
          await this.animationService.animateSpellCast(spell.id);
          await this.cardEffects.playCardAnimation(spell.serverId, spell.id);
          break;
        }
        default:
          resolve();
      }

      setTimeout(() => resolve(), 500);
    });
  }

  // =====================================================================
  // Top buttons, chat and leaving
  // =====================================================================

  openChat(): void {
    if (this.chat.isOpen) {
      this.chat.close();
    } else {
      this.unreadNotificationCounter = 0;
      this.chat.open();
    }
  }

  openSettings(): void {
    if (this.settings.isOpen) {
      this.settings.close();
    } else {
      this.settings.open();
    }
  }

  openHelp(): void {
    this.help.open();
  }

  // Chat stays local: your messages show up, and the rival answers once.
  onMessageSent(text: string): void {
    this.addChatMessage(text, true);

    if (!this.chatReplied) {
      this.chatReplied = true;
      setTimeout(() => {
        if (this.destroyed) return;
        if (!this.chat.isOpen) this.unreadNotificationCounter++;
        this.addChatMessage(this.t('CHAT_REPLY'), false);
      }, 1200);
    }
  }

  private addChatMessage(text: string, mine: boolean): void {
    const message = new Message();
    message.text = text;
    message.isMine = mine;
    message.playerName = mine ? this.gameState.Me.Name : this.gameState.Rivals[0].Name;
    this.chat.addMessage(message);
  }

  leaveTutorial(): void {
    this.router.navigateByUrl('/');
  }

  replayTutorial(): void {
    // Re-entering the route builds a fresh component (and engine).
    this.router
      .navigateByUrl('/', { skipLocationChange: true })
      .then(() => this.router.navigateByUrl('/tutorial'));
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      event.preventDefault();
      this.openChat();
    }
  }

  // ---------- Drag to scroll (same as GameComponent) ----------

  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private startScrollX = 0;
  private startScrollY = 0;

  private scrollToCenter(): void {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const doc = document.documentElement;
        window.scrollTo({
          left: (doc.scrollWidth - window.innerWidth) / 2,
          top: (doc.scrollHeight - window.innerHeight) / 2,
          behavior: 'auto',
        });
      }),
    );
  }

  onMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return;

    this.isDragging = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startScrollX = window.scrollX;
    this.startScrollY = window.scrollY;
    document.body.style.cursor = 'grabbing';
    event.preventDefault();
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;

    window.scrollTo({
      left: this.startScrollX - (event.clientX - this.startX),
      top: this.startScrollY - (event.clientY - this.startY),
      behavior: 'auto',
    });
  }

  @HostListener('window:mouseup')
  onMouseUp(): void {
    this.isDragging = false;
    document.body.style.cursor = '';
  }
}
