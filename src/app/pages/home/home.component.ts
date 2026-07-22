import { Component, OnInit } from '@angular/core';
import { Deck } from '../../models/deck.model';
import { WebsocketService } from '../../core/services/websocket.service';
import { Router } from '@angular/router';

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
  ) 
  {
    
  }
  ngOnInit(): void {
    this.ws.connect();
    this.ws.subscribe(this.processMessage);
    
    this.ws.send({
      "$type" : "GetDecksAction"
    });
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
        this.router.navigateByUrl("/game");
        break;
      default:
        console.log("Unknown message!!");
        return true;
    }
    return false;

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