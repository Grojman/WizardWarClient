import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Deck } from '../../models/deck.model';
import { WebsocketService } from '../../core/services/websocket.service';
import { Router } from '@angular/router';
import { AudioService } from '../../core/services/audio.service';
import { AlertModalComponent } from '../../shared/components/alert-modal/alert-modal.component';
import { PrivateMatchModalComponent } from '../../shared/components/private-match-modal/private-match-modal.component';
import { SeriesStateService } from '../../core/services/series-state.service';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {

  @ViewChild('errorModal')
  errorModal!: AlertModalComponent;

  @ViewChild('privateMatchModal')
  privateMatchModal!: PrivateMatchModalComponent;

  @ViewChild('playersCarousel')
  playersCarouselRef!: ElementRef<HTMLUListElement>;

  username = '';

  searching = false;

  searchingBot = false;

  selectedDeck?: Deck;

  sugestion: string = "";

  decks: Deck[] = [];

  numberOfPlayers: number = 2;

  readonly playerCountOptions: number[] = [2, 3, 4];

  matchMode: 'Single' | 'BestOfThree' = 'Single';

  private carouselScrollRaf?: number;

  privateMatchPending = false;

  showJoinInput = false;

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
    private seriesState: SeriesStateService
  )
  {

  }
  ngOnInit(): void {
    this.ws.connect();
    this.ws.subscribe(this.processMessage);
    this.ws.send({
      "$type" : "GetDecksAction"
    });

    let isready = false;
    window.addEventListener('scroll', () => {
      if (isready) return;
      isready = true;
      this.audio.playSong("audio/music/home_music.mp3")
    })
  }

  ngAfterViewInit(): void {
    this.scrollToPlayerCount(this.numberOfPlayers, 'auto');
  }

  selectMatchMode(mode: 'Single' | 'BestOfThree'): void {
    this.matchMode = mode;
    if (mode === 'BestOfThree') {
      this.numberOfPlayers = 2;
    }
  }

  selectPlayerCount(count: number): void {
    this.numberOfPlayers = count;
    this.scrollToPlayerCount(count);
  }

  shiftPlayerCount(direction: 1 | -1): void {
    const currentIndex = this.playerCountOptions.indexOf(this.numberOfPlayers);
    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = 0;
    if (nextIndex >= this.playerCountOptions.length) nextIndex = this.playerCountOptions.length - 1;
    this.selectPlayerCount(this.playerCountOptions[nextIndex]);
  }

  private scrollToPlayerCount(count: number, behavior: ScrollBehavior = 'smooth'): void {
    const container = this.playersCarouselRef?.nativeElement;
    if (!container) return;

    const index = this.playerCountOptions.indexOf(count);
    const target = container.children[index] as HTMLElement | undefined;

    target?.scrollIntoView({ behavior, inline: 'center', block: 'nearest' });
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
        this.privateMatchPending = false;
        this.privateMatchModal.close();
        this.startGame();
        break;
      case "series_state":
        this.privateMatchPending = false;
        this.privateMatchModal.close();
        this.seriesState.applySeriesState(msg.Content);
        this.enterSeries();
        break;
      case "private_match_created":
      case "private_match_update":
        this.privateMatchPending = true;
        this.privateMatchModal.open(
          msg.Content?.code ?? '',
          msg.Content?.current ?? 0,
          msg.Content?.total ?? 0,
          !!msg.Content?.isHost
        );
        break;
      case "error":
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

  selectDeck(deck: Deck) {
    this.selectedDeck = deck;
  }

  canSearch(): boolean {
    return !!this.username && (!!this.selectedDeck || this.matchMode === "BestOfThree");
  }

  searchDisabledReason(): string | null {
    if (!this.username) {
      return 'Introduce tu nombre para poder buscar partida';
    }
    if (this.matchMode === 'Single' && !this.selectedDeck) {
      return 'Selecciona un mazo para poder buscar partida';
    }
    return null;
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


  toggleSearch() {
    if (!this.searching) {

      this.searching = true;

      this.ws.send({
        "$type": 'JoinQueueAction',
        DeckId: this.selectedDeck?.id ?? -1,
        NumberOfPlayers: this.numberOfPlayers,
        Format: this.matchMode
      });

      this.audio.playSfx("/audio/search_match.mpeg");

    } else {

      this.searching = false;

      this.ws.send({
        "$type": 'LeaveQueueAction'
      });

    }
  }

  anyActionPending(): boolean {
    return this.searching || this.searchingBot || this.privateMatchPending;
  }

  createPrivateMatch() {
    this.ws.send({
      "$type": 'CreatePrivateMatchAction',
      DeckId: this.selectedDeck?.id,
      NumberOfPlayers: this.numberOfPlayers,
      Format: this.matchMode
    });
  }

  toggleJoinInput() {
    this.showJoinInput = !this.showJoinInput;
    this.joinCode = '';
  }

  joinPrivateMatch() {
    if (!this.joinCode) return;

    this.ws.send({
      "$type": 'JoinPrivateMatchAction',
      DeckId: this.selectedDeck?.id,
      Code: this.joinCode
    });

    this.showJoinInput = false;
  }

  onPrivateMatchCancelled() {
    this.privateMatchPending = false;
    this.ws.send({
      "$type": 'LeavePrivateMatchAction'
    });
  }

}