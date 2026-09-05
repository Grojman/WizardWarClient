import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { createRandomDeckOption, Deck, RANDOM_DECK_ID } from '../../models/deck.model';
import { WebsocketService } from '../../core/services/websocket.service';
import { Router } from '@angular/router';
import { AudioService } from '../../core/services/audio.service';
import { AlertModalComponent } from '../../shared/components/alert-modal/alert-modal.component';
import { SeriesStateService } from '../../core/services/series-state.service';
import { GameSessionStorageService } from '../../core/services/game-session-storage.service';
import { TranslationService } from '../../core/services/translation.service';
import { LanguageSettingsService } from '../../core/services/language.service';
import { LANGUAGE_OPTIONS } from '../../core/config/language-config';
import { Game } from '../../models/game.model';
import { Player } from '../../models/player.model';

interface ActiveMatchInfo {
  me: Player;
  rivals: Player[];
}

type SectionStage = 'root' | 'deck-select' | 'create-private' | 'join-private';

interface HomeSection {
  name: string,
  id: string,
  selected: boolean,
  stage: SectionStage,
}

interface GameOption {
  name: string,
  id: string,
  icon: string,
}

interface ExternalSection {
  name: string,
  url: string,
}

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('errorModal')
  errorModal!: AlertModalComponent;

  sections: HomeSection[] = [
    {
      name: 'HOME_SECTION_QUICK_MATCH',
      id: 'pr',
      selected: true,
      stage: 'root',
    },
    {
      name: 'HOME_SECTION_BEST_OF_3',
      id: 'bo3',
      selected: false,
      stage: 'root',
    },
    {
      name: 'HOME_SECTION_REPORT_BUGS',
      id: 'rb',
      selected: false,
      stage: 'root'
    },
    {
      name: 'HOME_SECTION_ABOUT_US',
      id: 'ab',
      selected: false,
      stage: 'root'
    },
  ]

  externalSections: ExternalSection[] = [
    {
      name: 'HOME_SECTION_GALLERY',
      url: '/gallery'
    },
    {
      name: 'HOME_SECTION_STATS',
      url: '/stats'
    },
  ]

  otherSectionStyles: {
    [klass: string]: any;
  }[]  = []

  selectedSection: HomeSection = this.sections[0];

  sectionSelected(section: HomeSection)
  {
    if (this.sectionsBlocked()) return;
    if (this.selectedSection.id === section.id) return;
    this.selectedSection.selected = false;
    this.selectedSection = section;
    this.selectedSection.selected = true;
    this.selectMatchMode(section.id === 'bo3' ? 'BestOfThree' : 'Single');
  }

  // Menu sections (Partida rápida / Mejor de 3 / ...) shouldn't be switchable
  // mid-matchmaking, since that would strand a pending queue/private-match
  // request behind a section the player navigated away from.
  sectionsBlocked(): boolean
  {
    return this.searching || this.searchingBot || this.creatingPrivate || this.joiningPrivate;
  }

  isGameSection(): boolean
  {
    return this.selectedSection.id === 'pr' || this.selectedSection.id === 'bo3';
  }

  gameOptions: GameOption[] = [
    {
      name: 'HOME_OPTION_PLAY',
      id: 'o',
      icon: 'fa-globe'
    },
    {
      name: 'HOME_OPTION_CREATE',
      id: 'pr',
      icon: 'fa-lock'
    },
    {
      name: 'HOME_OPTION_JOIN',
      id: 'jo',
      icon: 'fa-key'
    },
    {
      name: 'HOME_OPTION_BOT',
      id: 'ma',
      icon: 'fa-robot'
    },
  ]

  selectedGameOption?: GameOption

  playCrack(event: MouseEvent)
  {
    const element = event.target as HTMLElement;
    if(element.classList.contains('selected')) return;
    this.audio.playSfx("audio/wood_creak.mp3", true)
  }

  visibleGameOptions(): GameOption[]
  {
    if (this.selectedSection.id === 'bo3') {
      return this.gameOptions.filter(option => option.id !== 'ma');
    }
    return this.gameOptions;
  }

  // Best-of-3 matches never pick a deck up front (that happens per-game once
  // the series starts), so no game option on bo3 should route through
  // deck-select — online search, creating a private match, and joining one
  // all skip straight to their own flow.
  optionNeedsDeck(option: GameOption): boolean
  {
    if (this.selectedSection.id === 'bo3') {
      return false;
    }
    return true;
  }

  selectGameOption(option: GameOption)
  {
    this.selectedGameOption = option;
    if (this.optionNeedsDeck(option)) {
      this.selectedSection.stage = 'deck-select';
    } else {
      this.performGameAction(option);
    }
  }

  performGameAction(option: GameOption)
  {
    switch(option.id)
    {
      case "o":
        this.startSearch();
        break;
      case "ma":
        this.startBotGame();
        break;
      case "pr":
        this.createPrivateMatch();
        break;
      case "jo":
        this.selectedSection.stage = 'join-private';
        this.joinCode = '';
        break;
      default:
        console.log("Unknown game option!!");
        break;
    }
  }

  leaveGameOption()
  {
    this.selectedGameOption = undefined;
    this.selectedSection.stage = 'root';
  }

  isOnlineSearchButton(option: GameOption): boolean
  {
    return option.id === 'o' && this.searching;
  }

  rootButtonDisabled(option: GameOption): boolean
  {
    if (!this.username) return true;
    if (this.isOnlineSearchButton(option)) return false;
    return this.anyActionPending();
  }

  rootButtonClick(option: GameOption): void
  {
    if (this.isOnlineSearchButton(option)) {
      this.cancelJoining();
    } else {
      this.selectGameOption(option);
    }
  }

  selectDeck(deck: Deck) {
    if (!this.username || this.anyActionPending() || this.creatingPrivate) return;
    this.selectedDeck = deck.id === RANDOM_DECK_ID ? this.pickRandomDeck() : deck;
    if (this.selectedGameOption) {
      this.performGameAction(this.selectedGameOption);
    }
  }

  private pickRandomDeck(): Deck | undefined {
    if (!this.decks.length) return undefined;
    return this.decks[Math.floor(Math.random() * this.decks.length)];
  }

  startSearch()
  {
    this.searching = true;
    this.ws.send({
      "$type": 'JoinQueueAction',
      DeckId: this.selectedDeck?.id ?? -1,
      NumberOfPlayers: this.numberOfPlayers,
      Format: this.matchMode
    });

    this.audio.playSfx("/audio/search_match.mp3");
  }

  startBotGame()
  {
    this.searchingBot = !this.searchingBot;
    this.ws.send({
      "$type" : "StartBotGameAction",
      DeckId : this.selectedDeck?.id,
      NumberOfPlayers: this.numberOfPlayers
    })
  }

  cancelJoining()
  {
    this.searching = false;
    this.selectedDeck = undefined;

    this.ws.send({
      "$type": 'LeaveQueueAction'
    });
  }
  code: string = '';
  current: number = 0;
  total: number = 0;
  isHost: boolean = false;
  copied: boolean = false;

  onPrivateMatchCancelled() {
    this.ws.send({
      "$type": 'LeavePrivateMatchAction'
    });
    this.creatingPrivate = false;
    this.selectedSection.stage = 'root';
  }

  copyCode(): void {
    navigator.clipboard?.writeText(this.code).then(() => {
      this.copied = true;
    });
  }

  username = '';

  searching = false;

  searchingBot = false;

  creatingPrivate = false;

  joiningPrivate = false;

  selectedDeck?: Deck;

  sugestion: string = "";

  decks: Deck[] = [];

  // decks, with the "Aleatorio" option prepended, for the deck-select grid.
  decksForSelection: Deck[] = [];

  decksLoading = true;

  // True once a match/series has actually started and we're navigating away
  // (see ngOnDestroy).
  private enteringMatch = false;

  numberOfPlayers: number = 2;

  readonly playerCountOptions: number[] = [2, 3, 4];

  matchMode: 'Single' | 'BestOfThree' = 'Single';



  joinCode = '';

  sendSugestion() {
    if (this.hasActiveMatch) return;

    this.ws.send({
      "$type": "SendSuggestion",
      "Suggestion": this.sugestion
    })

    this.sugestion = "";
  }

  suggestionKeyPress(key: string)
  {
    if (key === "")
    {
      this.sendSugestion()
    }
  }


  constructor(
    private ws: WebsocketService,
    private router: Router,
    private audio: AudioService,
    private seriesState: SeriesStateService,
    private gameSessionStorage: GameSessionStorageService,
    protected translation: TranslationService,
    protected languageService: LanguageSettingsService
  )
  {

  }

  languages = LANGUAGE_OPTIONS;

  changeLanguage(code: string): void {
    this.languageService.setLanguage(code);
  }
  // Set as soon as we know (from GameSessionStorageService, see ngOnInit)
  // that the server may still be holding us inside an unfinished GameSession
  // from before a reload/navigation back to home — until this is resolved
  // (continue or cancel), the buttons that start a new game stay hidden so
  // we never send a lobby-only action while the server still routes our
  // messages to that GameSession (see GameManager.HandleMessage).
  hasActiveMatch = false;
  activeMatchChecking = false;
  activeMatch: ActiveMatchInfo | null = null;
  cancellingMatch = false;
  private activeMatchWatchdog?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.ws.connect();
    this.ws.subscribe(this.processMessage);

    if (this.gameSessionStorage.isActive()) {
      this.hasActiveMatch = true;
      this.activeMatchChecking = true;
      this.startActiveMatchWatchdog();
    } else {
      this.ws.send({
        "$type" : "GetDecksAction"
      });
    }

    this.audio.startMusic("home")
    let start = false;
    window.addEventListener('keydown', (event) => {
      if(start) return;
      start = true;
      this.audio.startMusic("home")
    })

    this.createRotationStyles();
  }

  playButtonHover(event: MouseEvent)
  {
    const element = event.target as HTMLButtonElement;
    if (element.inert || element.disabled ||  element.classList.contains('disabled')) return;
    this.audio.playSfx("audio/button_hover.mp3", true)
  }

  createRotationStyles()
  {
    const TOTAL_DEGREES = 45;
    console.log(this.externalSections.length)
    const rotationAmount = TOTAL_DEGREES / this.externalSections.length;
    
    const stop = this.externalSections.length / 2;
    const verticalMov = 'translateY(20px)';

    let start = -TOTAL_DEGREES;

    for(let i = 0; i < stop; i++)
    {
      this.otherSectionStyles.push({
        "transform" : `rotateZ(${start + (rotationAmount * (i + 1))}deg) ` + verticalMov
      })
    }

    start = TOTAL_DEGREES;
    let counter = 1;
    for(let i = this.externalSections.length -1; i >= stop; i--)
    {
      this.otherSectionStyles.push({
        "transform" : `rotateZ(${start - (rotationAmount * (counter))}deg) ` + verticalMov
      })
      counter++;

    }
  }

  ngAfterViewInit(): void {



  }

  // Navigating away from home (e.g. to the gallery/stats) destroys this
  // component but keeps the shared WebSocket open, so the server would
  // otherwise keep the player queued/hosting a private match indefinitely.
  // This must NOT fire when the destroy is caused by a match actually
  // starting (startGame()/enterSeries() navigating to /game or /series):
  // by then the server has already moved the player out of the queue and
  // into a GameSession, so a stale LeaveQueueAction/LeavePrivateMatchAction
  // would get routed to the in-game handler, fail to deserialize there, and
  // come back as an error the player never asked for.
  ngOnDestroy(): void {
    this.clearActiveMatchWatchdog();

    if (this.enteringMatch) return;

    if (this.searching) {
      this.ws.send({
        "$type": 'LeaveQueueAction'
      });
    }
    if (this.creatingPrivate || this.selectedSection.stage === 'create-private') {
      this.ws.send({
        "$type": 'LeavePrivateMatchAction'
      });
    }
  }

  selectMatchMode(mode: 'Single' | 'BestOfThree'): void {
    this.matchMode = mode;
    if (mode === 'BestOfThree') {
      this.numberOfPlayers = 2;
    }
  }

  onUsernameChange()
  {
    if (this.hasActiveMatch) return;

    this.ws.send({
      "$type" : "ChangeNameAction",
      "NewName" : this.username
    })
  }
  
  processMessage = (msg : any) : boolean =>
    {
    switch(msg.Type)
    {
      case "get_decks":
        this.decks = [...msg.Content];
        this.decksForSelection = [createRandomDeckOption(), ...this.decks];
        this.decksLoading = false;
        break;
      case "start_game":
        this.enteringMatch = true;
        this.startGame();
        break;
      case "series_state":
        this.enteringMatch = true;
        this.seriesState.applySeriesState(msg.Content);
        this.enterSeries();
        break;
      case "private_match_created":
      case "private_match_update":
        this.creatingPrivate = false;
        this.joiningPrivate = false;
        this.code = msg.Content?.code ?? '';
        this.current = msg.Content?.current ?? 0;
        this.total = msg.Content?.total ?? 0;
        this.isHost = !!msg.Content?.isHost;
        this.selectedSection.stage = 'create-private';
        break;
      case "game_state":
        // Pushed unprompted by the server the moment it resumes us into a
        // GameSession we never properly left (see GameSession.TryReconnect).
        // Reject it (return true below) so it stays queued for GameComponent
        // to consume once the player actually continues into /game.
        this.handleActiveMatchState(msg.Content);
        return true;
      case "no_active_match":
        // Explicit negative ack from GameManager.TryResumeGame: there's
        // nothing to resume, so there's no need to sit out the watchdog
        // timeout below. Ignored if we weren't waiting on a resume in the
        // first place (this is sent unprompted on every connection).
        if (this.activeMatchChecking) {
          this.clearActiveMatch();
        }
        break;
      case "end_game":
        // Either our own cancelMatch() was acked, or the match we were
        // resumed into ended for some other reason (e.g. the rival also
        // cancelled) while we were sitting here on home.
        this.clearActiveMatch();
        break;
      case "series_end":
        // Cancelling a resumed series round (see cancelMatch()) ends the
        // whole series server-side, which pushes this here too (in addition
        // to the "end_game" ack above). Home has nothing to do with it —
        // consume it so it doesn't sit in the WebsocketService replay queue
        // and get wrongly picked up by a later, unrelated SeriesComponent.
        break;
      case "error":
        this.searching = false;
        this.searchingBot = false;
        this.creatingPrivate = false;
        this.joiningPrivate = false;
        this.errorModal.open(msg.Content?.message ?? this.translation.translate('ERR_UNEXPECTED'));
        break;
      case "translations":
        this.translation.setDictionary(msg.Content?.values ?? {});
        break;
      default:
        console.log("Unknown message!!");
        return true;
    }
    return false;

    }

  private startActiveMatchWatchdog(): void {
    this.clearActiveMatchWatchdog();
    // Safety net only: the server now answers explicitly (either a
    // "game_state" push or a "no_active_match" ack, see processMessage), so
    // this should normally never fire. It stays as a fallback in case that
    // message is ever lost (e.g. a dropped/reconnecting socket) so the
    // player isn't stuck behind a permanently-disabled "start new game"
    // screen.
    this.activeMatchWatchdog = setTimeout(() => {
      if (this.activeMatchChecking) {
        this.clearActiveMatch();
      }
    }, 2000);
  }

  private clearActiveMatchWatchdog(): void {
    clearTimeout(this.activeMatchWatchdog);
    this.activeMatchWatchdog = undefined;
  }

  private handleActiveMatchState(content: Game | null): void {
    if (!content) return;

    this.clearActiveMatchWatchdog();
    this.gameSessionStorage.markActive();
    this.hasActiveMatch = true;
    this.activeMatchChecking = false;
    this.activeMatch = { me: content.Me, rivals: content.Rivals };
  }

  private clearActiveMatch(): void {
    this.clearActiveMatchWatchdog();
    this.hasActiveMatch = false;
    this.activeMatchChecking = false;
    this.activeMatch = null;
    this.cancellingMatch = false;
    this.gameSessionStorage.markInactive();

    // Skipped at ngOnInit while we still thought there was a match to
    // resume into — safe to fetch now that there isn't one.
    if (this.decksLoading) {
      this.ws.send({
        "$type" : "GetDecksAction"
      });
    }
  }

  continueMatch(): void {
    if (!this.hasActiveMatch || this.activeMatchChecking) return;

    this.gameSessionStorage.markResumingFromHome();
    this.enteringMatch = true;
    this.router.navigateByUrl('/game');
  }

  cancelMatch(): void {
    if (!this.hasActiveMatch || this.activeMatchChecking || this.cancellingMatch) return;

    this.cancellingMatch = true;
    this.ws.send({
      "$type": 'LeaveGame'
    });
  }

  async startGame()
  {
    this.gameSessionStorage.markActive();

    await document.querySelector('.home-container')?.animate([
      { opacity: 1},
      { opacity: 0}
    ], 
    {
      duration: 500
    }).finished;
    this.router.navigateByUrl("/game");
  }

  async enterSeries()
  {
    await document.querySelector('.home-container')?.animate([
      { opacity: 1},
      { opacity: 0}
    ],
    {
      duration: 500
    }).finished;
    this.router.navigateByUrl("/series");
  }

  anyActionPending(): boolean {
    return this.searching || this.searchingBot;
  }

  createPrivateMatch() {
    this.creatingPrivate = true;
    this.ws.send({
      "$type": 'CreatePrivateMatchAction',
      DeckId: this.selectedDeck?.id ?? -1,
      NumberOfPlayers: this.numberOfPlayers,
      Format: this.matchMode
    });
  }

  // Join-private is only ever reached through deck-select on sections that
  // need a deck (see optionNeedsDeck) — on bo3 it's reached straight from
  // root, so "back" has to land there instead or the deck-select stage
  // would show up empty/unreachable.
  cancelJoinPrivate() {
    this.selectedSection.stage = this.selectedSection.id === 'bo3' ? 'root' : 'deck-select';
    this.joinCode = '';
    this.joiningPrivate = false;
  }

  joinPrivateMatch() {
    if (!this.joinCode || !this.username || this.joiningPrivate) return;

    this.joiningPrivate = true;
    this.ws.send({
      "$type": 'JoinPrivateMatchAction',
      DeckId: this.selectedDeck?.id ?? -1,
      Code: this.joinCode
    });
  }

  

}