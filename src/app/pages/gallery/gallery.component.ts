import { Component, OnInit } from '@angular/core';
import { WebsocketService } from '../../core/services/websocket.service';
import { Card } from '../../models/card.model';
import { DeckInfo } from '../../models/deckinfo.model';

@Component({
  selector: 'app-gallery.component',
  standalone: false,
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.css',
})
export class GalleryComponent implements OnInit {

  cards: DeckInfo[] = [];

  constructor(private ws: WebsocketService)
  {
    this.cards = [];
  }
  ngOnInit(): void {
    this.ws.subscribe(this.processMessage);
    this.ws.send({
      "$type" : "GetAllCardsAction"
    })
  }

  processMessage = (msg: any) : boolean =>
  {

    switch(msg.Type)
    {
      case "get_cards":
        this.cards = [...msg.Content];
        console.log(this.cards)

//         this.cards = msg.Content.map(
//   data => new Card(data)
// );
        console.log("aqui, ", this.cards)
        break;
      default:
        console.log("Unknown message!!");
        return true;
    }

    return false;
  }

  hoverCard: Card | null = null;

}
