import { Component, OnInit } from '@angular/core';
import { Deck } from '../../models/deck.model';
import { WebsocketService } from '../../core/services/websocket.service';
import { Router } from '@angular/router';
import { AudioService } from '../../core/services/audio.service';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  username = '';

  searching = false;

  searchingBot = false;

  selectedDeck?: Deck;

  sugestion: string = "";

  decks: Deck[] = [];

  numberOfPlayers: number = 2;

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
    private audio: AudioService
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

  selectDeck(deck: Deck) {
    this.selectedDeck = deck;
  }

  canSearch(): boolean {
    return !!this.username && !!this.selectedDeck;
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
        DeckId: this.selectedDeck?.id,
        NumberOfPlayers: this.numberOfPlayers
      });

    } else {

      this.searching = false;

      this.ws.send({
        "$type": 'LeaveQueueAction'
      });

    }
  }

}