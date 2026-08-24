import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Deck } from '../../models/deck.model';
import { WebsocketService } from '../../core/services/websocket.service';
import { Router } from '@angular/router';
import { AudioService } from '../../core/services/audio.service';
import { AlertModalComponent } from '../../shared/components/alert-modal/alert-modal.component';
import { SeriesStateService } from '../../core/services/series-state.service';
import { GameSessionStorageService } from '../../core/services/game-session-storage.service';

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
      name: 'Partida rápida',
      id: 'pr',
      selected: true,
      stage: 'root',
    },
    {
      name: 'Mejor de 3',
      id: 'bo3',
      selected: false,
      stage: 'root',
    },
    {
      name: 'Reportar bugs',
      id: 'rb',
      selected: false,
      stage: 'root'
    },
    {
      name: 'Sobre nosotros',
      id: 'ab',
      selected: false,
      stage: 'root'
    },
  ]

  externalSections: ExternalSection[] = [
    {
      name: 'Galería',
      url: '/gallery'
    },
    {
      name: 'Estadísticas',
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
      name: 'Jugar',
      id: 'o',
      icon: 'fa-globe'
    },
    {
      name: 'Crear',
      id: 'pr',
      icon: 'fa-lock'
    },
    {
      name: 'Unirse',
      id: 'jo',
      icon: 'fa-key'
    },
    {
      name: 'Máquina',
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
    this.selectedDeck = deck;
    if (this.selectedGameOption) {
      this.performGameAction(this.selectedGameOption);
    }
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

  numberOfPlayers: number = 2;

  readonly playerCountOptions: number[] = [2, 3, 4];

  matchMode: 'Single' | 'BestOfThree' = 'Single';



  joinCode = '';

  sendSugestion() {

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
    private gameSessionStorage: GameSessionStorageService
  )
  {

  }
  ngOnInit(): void {
    this.ws.connect();
    this.ws.subscribe(this.processMessage);
    this.ws.send({
      "$type" : "GetDecksAction"
    });

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
  ngOnDestroy(): void {
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
        break;
      case "start_game":
        this.startGame();
        break;
      case "series_state":
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
      case "error":
        this.searching = false;
        this.searchingBot = false;
        this.creatingPrivate = false;
        this.joiningPrivate = false;
        this.errorModal.open(msg.Content?.message ?? 'Ha ocurrido un error inesperado.');
        break;
      default:
        console.log("Unknown message!!");
        return true;
    }
    return false;

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