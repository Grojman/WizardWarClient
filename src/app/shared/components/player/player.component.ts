import { AfterViewInit, Component, DoCheck, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Player, GlobalEffect } from '../../../models/player.model';
import { Card } from '../../../models/card.model';
import { CHROMATIC_COLOR_HEX } from '../../../core/config/chromatic-colors';

// A global effect currently rendered on screen, plus whether it's on its
// way out. Kept separate from the live Player.GlobalEffects array (see
// syncEffects) so a removed effect can stay in the DOM long enough to play
// its leave animation instead of vanishing the instant the snapshot drops it.
interface DisplayedEffect extends GlobalEffect {
  leaving: boolean;
}

// Must match the CSS leave-animation duration below (.effect.leaving) —
// bound into the template as a CSS custom property so the two can never
// drift apart.
const EFFECT_LEAVE_MS = 400;

// Hand hover wave: how many cards on each side of the hovered one rise, and
// how far the closest neighbour rises (the hovered card itself uses the
// -5vh --y-translate from card.component.css).
const WAVE_RANGE = 4;
const WAVE_MAX_LIFT_VH = 3;

// While at least one unit with this serverId is on a player's board, that
// player's side of the table is covered in ashes.
const ASHES_CARD_ID = '29';

// While at least one unit with this serverId is on a player's board, a crown
// sits on that player's health; it shatters when the last one leaves.
const CROWN_CARD_ID = '13_2';
// Must match the .crown-shard animation duration in the stylesheet.
const CROWN_BREAK_MS = 1100;

// While at least one unit with this serverId is on a player's board, that
// player's board gets a color-displacement (RGB split) filter.
const COLOR_DISPLACEMENT_CARD_ID = '19';
// Each PlayerComponent renders its own SVG filter, so ids must be unique.
let colorDisplacementFilterSeq = 0;

// Rat tails stick out from the sides of the effects panel of a player who
// has this global effect (granted by spell 11), RAT_TAILS_PER_EFFECT more
// for each copy of the effect.
const RAT_TAILS_EFFECT_KEY = 'CARD_11_GLOBAL_EFFECT';
const RAT_TAILS_PER_EFFECT = 3;

interface Crown {
  id: number;
  state: 'on' | 'breaking';
  // Position in the stack, 0 sitting on the health.
  stack: number;
}

interface RatTail {
  id: number;
  side: 'left' | 'right';
  // % of the effects panel's height.
  top: number;
  tilt: number;
  sway: number;
  delay: number;
  flip: boolean;
}

@Component({
  selector: 'app-player',
  standalone: false,
  templateUrl: './player.component.html',
  styleUrl: './player.component.css',
})
export class PlayerComponent implements DoCheck, OnDestroy {

  readonly effectLeaveMs = EFFECT_LEAVE_MS;

  @Input()
  long: boolean = false;

  @Output()
  onDeckSelected: EventEmitter<any> = new EventEmitter();

  @Output()
  onCardRightClick: EventEmitter<{
    card: Card | null,
    event: MouseEvent
  }> = new EventEmitter();

  @Output()
  onCardSelected: EventEmitter<(Card | null)> = new EventEmitter();
  
  @Output()
  onAttackingUnitSelected: EventEmitter<(Card | null)> = new EventEmitter();
  
  @Output()
  onDockSelected: EventEmitter<number> = new EventEmitter();

  @Output()
  onLastSpellClicked: EventEmitter<any> = new EventEmitter();

  @Output()
  onPlayerTargetSelected: EventEmitter<any> = new EventEmitter();

  @Input()
  player!: Player;

  @Input()
  visibleHand!: boolean;

  @Input()
  isAnimating!: boolean;

  @Input()
  reverseOrder!: boolean;

  @Input()
  showHealthAsTarget!: boolean;

  @Input()
  selectedCard: (Card | null) = null;
  
  @Input()
  unitSelected: boolean = false;

  @Input()
  attackingUnit: (Card | null) = null;

  @Input()
  showTarget: boolean = false;

  displayedEffects: DisplayedEffect[] = [];
  private leavingTimers = new Map<string, ReturnType<typeof setTimeout>>();
  // Tracks the last-seen GlobalEffects array *reference*. GameStateService
  // mutates `player.GlobalEffects` in place on the same Player object
  // (see applyTurnAndEffects) rather than swapping in a new Player, so the
  // `player` @Input() binding itself never changes reference and
  // ngOnChanges would never re-fire — ngDoCheck polls every CD cycle
  // instead, which zone.js already runs after every websocket message.
  private lastEffectsRef?: GlobalEffect[];

  // Derived from the board itself (not from play/death events) so several
  // copies, deaths, and reconnect snapshots all resolve correctly: the ashes
  // only go away once no copy of the card is left on the board.
  get hasAshes(): boolean {
    return this.hasOnBoard(ASHES_CARD_ID);
  }

  get hasColorDisplacement(): boolean {
    return this.hasOnBoard(COLOR_DISPLACEMENT_CARD_ID);
  }

  readonly colorDisplacementFilterId = `color-displacement-${++colorDisplacementFilterSeq}`;

  // One set of tails per active spell-11 effect; kept as a stable array
  // (see syncRatTails) so existing tails don't replay their entrance when
  // another set is added.
  ratTails: RatTail[] = [];

  // One crown per copy of card 13_2 on the board, stacked on top of each
  // other. A 'breaking' crown keeps its shards on screen while they fall
  // apart after its unit has left the board.
  crowns: Crown[] = [];
  private crownSeq = 0;
  private crownBreakTimers = new Set<ReturnType<typeof setTimeout>>();

  private hasOnBoard(serverId: string): boolean {
    return this.player?.Board?.some((card) => card?.serverId === serverId) ?? false;
  }

  private countOnBoard(serverId: string): number {
    return this.player?.Board?.filter((card) => card?.serverId === serverId).length ?? 0;
  }

  // Adds a crown on top of the stack for each new copy, and shatters the top
  // ones when copies leave.
  private syncCrowns(): void {
    const wanted = this.countOnBoard(CROWN_CARD_ID);
    const standing = this.crowns.filter((c) => c.state === 'on');

    for (let i = standing.length; i < wanted; i++) {
      this.crowns = [...this.crowns, { id: ++this.crownSeq, state: 'on', stack: i }];
    }

    for (const crown of standing.slice(wanted)) {
      crown.state = 'breaking';
      const timer = setTimeout(() => {
        this.crowns = this.crowns.filter((c) => c !== crown);
        this.crownBreakTimers.delete(timer);
      }, CROWN_BREAK_MS);
      this.crownBreakTimers.add(timer);
    }
  }

  private syncRatTails(): void {
    const wanted =
      (this.player?.GlobalEffects?.filter((e) => e.Key === RAT_TAILS_EFFECT_KEY).length ?? 0) *
      RAT_TAILS_PER_EFFECT;
    if (wanted === this.ratTails.length) return;

    if (wanted < this.ratTails.length) {
      this.ratTails = this.ratTails.slice(0, wanted);
      return;
    }

    const added: RatTail[] = [];
    for (let i = this.ratTails.length; i < wanted; i++) {
      const batchIndex = i % RAT_TAILS_PER_EFFECT;
      const round = Math.floor(i / 2);
      added.push({
        id: i,
        // Alternate sides, spread down the panel, each new pair a bit lower.
        side: i % 2 === 0 ? 'left' : 'right',
        top: 18 + ((round * 23) % 64),
        tilt: ((i * 37) % 21) - 10,
        sway: 2.3 + ((i * 13) % 9) / 10,
        delay: batchIndex * 150,
        flip: i % 3 === 2,
      });
    }
    this.ratTails = [...this.ratTails, ...added];
  }

  trackById(_index: number, item: { id: number }): number {
    return item.id;
  }

  ngDoCheck(): void {
    this.syncCrowns();
    this.syncRatTails();
    const effects = this.player?.GlobalEffects;
    if (effects !== this.lastEffectsRef) {
      this.lastEffectsRef = effects;
      this.syncEffects(effects ?? []);
    }
  }

  ngOnDestroy(): void {
    this.leavingTimers.forEach((timer) => clearTimeout(timer));
    this.crownBreakTimers.forEach((timer) => clearTimeout(timer));
  }

  trackEffect(_index: number, effect: DisplayedEffect): string {
    return effect.Id;
  }

  effectColor(effect: DisplayedEffect): string | null {
    return effect.Color ? CHROMATIC_COLOR_HEX[effect.Color] : null;
  }

  // Diffs the live snapshot against what's currently on screen: effects no
  // longer present are flagged `leaving` and kept around just long enough
  // to play their leave animation (see .effect.leaving in the stylesheet)
  // before actually dropping them, while genuinely new ones are appended
  // as-is so *ngFor mounts a fresh DOM node for them and their CSS "enter"
  // animation plays automatically.
  private syncEffects(next: GlobalEffect[]): void {
    const nextIds = new Set(next.map((e) => e.Id));

    for (const existing of this.displayedEffects) {
      if (existing.leaving || nextIds.has(existing.Id)) continue;

      existing.leaving = true;
      const timer = setTimeout(() => {
        this.displayedEffects = this.displayedEffects.filter((e) => e.Id !== existing.Id);
        this.leavingTimers.delete(existing.Id);
      }, EFFECT_LEAVE_MS);
      this.leavingTimers.set(existing.Id, timer);
    }

    const displayedIds = new Set(this.displayedEffects.map((e) => e.Id));
    const added = next.filter((e) => !displayedIds.has(e.Id)).map((e) => ({ ...e, leaving: false }));

    this.displayedEffects = [...this.displayedEffects, ...added];
  }

  deckSelected()
  {
    console.error("Emiting deck...")
    this.onDeckSelected.emit();
  }

  onRightClick(event: MouseEvent, card: (Card | null))
  {
    event.stopPropagation();
    this.onCardRightClick.emit(
      {
        card,
        event
      }
    );
  }



  dockSelected(position: number)
  {
    this.onDockSelected.emit(position);
  }

  lastSpellClicked()
  {
    this.onLastSpellClicked.emit();
  }

  attackingUnitSelected(card: (Card | null))
  {
    this.onAttackingUnitSelected.emit(card);
  }

  playerTargetSelected()
  {
    this.onPlayerTargetSelected.emit();
  }

  cardSelected(card: (Card | null))
  {
    // A selected card stops lifting on hover, so drop the wave with it.
    this.hoveredHandIndex = null;
    this.onCardSelected.emit(card);
  }

  // Index of the hand card under the cursor, or null. Drives the wave so the
  // cards next to it lift a little less the further away they are.
  hoveredHandIndex: number | null = null;

  // Index of the last hand card the cursor entered. Unlike hoveredHandIndex it
  // is never cleared, so the stacking order stays put after the mouse leaves.
  stackedHandIndex: number | null = null;

  onHandCardHover(index: number, card: Card)
  {
    this.stackedHandIndex = index;
    // Only playable, unselected cards lift on hover (.card.can-hover), so
    // the wave follows the same rule to avoid neighbours rising alone.
    this.hoveredHandIndex = card.canPlay && card.id !== this.selectedCard?.id ? index : null;
  }

  getWaveTransform(index: number): string | null {
    if (this.hoveredHandIndex === null || index === this.hoveredHandIndex) return null;

    const distance = Math.abs(index - this.hoveredHandIndex);
    if (distance > WAVE_RANGE) return null;

    const lift = WAVE_MAX_LIFT_VH * (1 - distance / (WAVE_RANGE));
    return `translateY(-${lift}vh)`;
  }

  getZIndex (index:number): string {
    if (this.stackedHandIndex === null) return '0';
    const distance = Math.abs(index - this.stackedHandIndex);

    return `${10 - distance}`;
  }
}
