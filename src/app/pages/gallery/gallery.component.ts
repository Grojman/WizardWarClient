import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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

  loading = true;

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
        this.loading = false;
        requestAnimationFrame(() => this.updateScrollFade());
        break;
      default:
        console.log("Unknown message!!");
        return true;
    }

    return false;
  }

  hoverCard: Card | null = null;

  showScrollFade = false;

  deckContent!: ElementRef<HTMLElement>;
  @ViewChild('deckContent') set dc(dc: ElementRef)
  {
    if (dc)
    {
      this.deckContent = dc;
      this.updateScrollFade();
    }
  }

  async updateScrollFade() {
    await requestAnimationFrame(() => {});
    const el = this.deckContent?.nativeElement;
    if (!el) return;

    // Tolerance accounts for fractional-pixel rounding introduced by browser/OS zoom,
    // which otherwise keeps scrollTop a hair short of the bottom forever.
    const hasOverflow = el.scrollHeight - el.clientHeight > 1;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;

    this.showScrollFade = hasOverflow && distanceFromBottom > 2;
  }

}
