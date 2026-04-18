import { Component, OnInit, signal } from '@angular/core';

import { Card } from '../../models/card.model';

import { WebsocketService } from '../../core/services/websocket.service';
import { Router } from '@angular/router';
import { Game } from '../../models/game.model';
import { Health } from '../../models/health.model';
import { Player } from '../../models/player.model';


@Component({
  selector: 'app-game',
  standalone: false,
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
})
export class GameComponent implements OnInit {
  constructor(
    private ws : WebsocketService,
    private router : Router
  )
  {
    this.visualDrawnCard = document.querySelector("#drawn-card") as HTMLElement;
    this.animationLayer = document.querySelector(".animation-layer") as HTMLElement;
    this.gameState = {
      IsMyTurn: false,
      Me: {
        Id: "",
        Name: "",
        Board: [
          null,
          null,
          null,
          null,
        ],
        Health: 0,
        HandSize: 0,
        HandData: [],
        Deck: {
          id: "1",
          name: "",
          description: "",
          cardAmount: 0          
        }
      },
      Rival: {
        Id: "",
        Name: "",
        Board: [
          null,
          null,
          null,
          null,
        ],
        Health: 0,
        HandSize: 0,
        HandData: [
          
        ],
        Deck: {
          id: "1",
          name: "",
          description: "",
          cardAmount: 0          
        }
      }
    }
    
    this.storedGameState = this.gameState;
  }
  
  processMessage = (msg: any): boolean => {
    switch(msg.Type)
    {
      case "game_events":
      this.gameEvents = msg.Content;
      this.handleGameEvents(this.gameEvents);
      break;
      case "game_state":
      this.storedGameState = msg.Content;
      this.gameState.IsMyTurn = this.storedGameState.IsMyTurn;
      if(this.gameState.Rival.Id === "" || this.gameState.Me.Id === "")
      {
        this.gameState.Rival.Id = this.gameState.Rival.Id;
        this.gameState.Me.Id = this.gameState.Me.Id;
        this.gameState.Rival.Name = this.storedGameState.Rival.Name;
        this.gameState.Me.Name = this.storedGameState.Me.Name;
      }
      break;
      case "end_game":
        alert("Partida terminada");
        if (msg.Content.forced)
          {
            alert("El juego ha terminado antes de tiempo porque el otro jugador ha abandonado la partida, o se ha producido un fallo con el servidor");
          }
          this.router.navigateByUrl("/");
      break;
      default:
      console.error("Unknown message!!!");
      console.error(msg);
      return true;
    }

    return false;
  }
  
  playEvent(event: any): Promise<void> {
    return new Promise(async resolve => {
      switch (event.$type) {
        case "CardDrawnEvent":
        var player = this.getPlayer(event.PlayerSource);
        player.HandData.push(
          Card.fromJSON(event.Card));
        player.HandSize++;
        break;
        case "PlayerHealthChanged":
        var health = this.getPlayerHealth(event.PlayerSource)
        health.changeHealth(event.Amount, 1000);
        break;
        case "UnitHealthChanged":
        var arrayToFind = this.getPlayer(event.PlayerSource).Board;
        
        arrayToFind.forEach(n => {
          if (n && n.id === event.Card)
            {
            n.changeHealth(event.Amount, 1000);
            return;
          }
        })
        break;
        case "UnitDamageChanged":
        var arrayToFind = this.getPlayer(event.PlayerSource).Board;
        
        arrayToFind.forEach(n => {
          if (n && n.id === event.Card)
            {
            n.changeDamage(event.Amount, 1000);
            return;
          }
        })
        break;
        case "UnitDeath":
        var arrayToFind = this.getPlayer(event.PlayerSource).Board;
        
        var index = arrayToFind.findIndex(n => n && n.id === event.Unit);
        if (index !== -1) {
          console.log("Setting to null")
          arrayToFind[index] = null;
        }
        break;
        
        case "UnitPlayed":
        
        var player = this.getPlayer(event.PlayerSource);
        var cardIndex = player.HandData.findIndex(c => c.id === event.Unit.id);
        if (cardIndex !== -1) {
          player.HandData.splice(cardIndex, 1);
          player.HandSize--;
          console.log("Se ha cortado la carta: ", player.HandData);
        }
        if (event.Unit) {
          player.Board[event.BoardPosition] = Card.fromJSON(event.Unit);
          console.log("Se ha colocado la carta: ", player.Board);
        }
        break;
        
        case "SpellPlayed":
        var player = this.getPlayer(event.PlayerSource);
        var cardIndex = player.HandData.findIndex(c => c.id === event.Spell.id);
        if (cardIndex !== -1) {
          player.HandData.splice(cardIndex, 1);
          player.HandSize--;
          console.log("Se ha cortado la carta: ", player.HandData)
        }
        if (this.isRival(event.PlayerSource)) {
          this.rivalLastSpellPlayed = Card.fromJSON(event.Spell);
        } else {
          this.playerLastSpellPlayed = Card.fromJSON(event.Spell);
        }
        break;
        
        default:
        resolve();
      }
      
      setTimeout(() => {
        resolve()
      }, 500)
    });
  }
  
  nextFrame(): Promise<void>
  {
    return new Promise(resolve =>
      requestAnimationFrame(() =>
        resolve()
    )
  );
}

getPlayerHealth(id: string)
{
  return this.isRival(id) ? this.rivalHealth : this.userHealth;
}

getPlayer(id: string) : Player
{
  return this.isRival(id) ? this.gameState.Rival : this.gameState.Me;
}

getCenter(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

findElement(id: string): HTMLElement{
  return document.querySelector(`[data-game-id=${id}]`) as HTMLElement;
}

ngOnInit(): void {
  this.ws.subscribe(this.processMessage)
}
leaveClass = signal('leave-animation');
enterClass = signal('enter-animation');
showSidePanel = false;

rivalHealth: Health = new Health();
userHealth: Health = new Health();
rivalLastSpellPlayed: Card | null = null;
playerLastSpellPlayed: Card | null = null;

selectedCard: Card | null = null;
selectedCardInfo: Card | null = null;
gameState: Game;
storedGameState: Game;
gameEvents: any[] = [];
eventQueue: any[] = [];
isAnimating: boolean = false;
animationLayer: HTMLElement;
drawnCard?: Card;
visualDrawnCard: HTMLElement;
unitSelected: boolean = false;

attackingUnit: Card | null = null;

async handleGameEvents(events: any[]) {
  
  this.eventQueue.push(...events);
  
  if (this.isAnimating) return;
  
  this.isAnimating = true;
  
  while (this.eventQueue.length > 0) {
    const event = this.eventQueue.shift();
    await this.playEvent(event);
  }
  
  this.isAnimating = false;
}

togglePanel() {
  
  this.showSidePanel =
  !this.showSidePanel;
  
}

onRightClick(
  event: MouseEvent,
  card: Card | null
) {
  
  event.preventDefault();
  
  this.selectedCardInfo = card;
  
  this.showSidePanel = true;
}

isRival(id: string): boolean {
  return this.storedGameState.Me.Id !== id;
}

cardSelected(card: Card | null)
{
  if (!this.gameState.IsMyTurn) return;
  
  this.selectedCard = this.selectedCard?.id === card?.id ? null : card;
  this.unitSelected = this.selectedCard?.type === "Unit";
  this.attackingUnit = null;

  if(!this.unitSelected && this.selectedCard && card)
  {
    this.selectedCard = null;
    this.ws.send({
      "$type": "PlayCardAction",
      "CardIndex": this.gameState.Me.HandData.findIndex((n: Card) => n.id == card.id),
      "BoardIndex": -1
    })
  }
}

dockSelected(position: number)
{
  if (!this.gameState.IsMyTurn || !this.selectedCard || !this.unitSelected) return;

    this.ws.send({
      "$type": "PlayCardAction",
      "CardIndex": this.gameState.Me.HandData.findIndex((n: Card) => n.id == this.selectedCard?.id),
      "BoardIndex": position
    })
  this.selectedCard = null;
  this.unitSelected = false;
}

deckSelected() 
{
  if (!this.gameState.IsMyTurn) return;
  this.ws.send({
    "$type" : "DrawCardAction"
  })
}

attackingUnitSelected(card: Card | null)
{
  if(!this.gameState.IsMyTurn) return;

  this.attackingUnit = this.attackingUnit?.id === card?.id ? null : card;
  this.selectedCard = null;
}

rivalTargetSelected()
{
  if(!this.gameState.IsMyTurn || !this.attackingUnit) return;
  this.ws.send({
    "$type" : "AttackAction",
    "AttackerIndex" : this.gameState.Me.Board.findIndex(n => n?.id === this.attackingUnit?.id),
    "TargetIndex" : -1,
    "TargetType": "RIVAL"
  })

  this.attackingUnit = null;
}

playerTargetSelected()
{
  if(!this.gameState.IsMyTurn || !this.attackingUnit) return;
  this.ws.send({
    "$type" : "AttackAction",
    "AttackerIndex" : this.gameState.Me.Board.findIndex(n => n?.id === this.attackingUnit?.id),
    "TargetIndex" : -1,
    "TargetType": "PLAYER"
  })

  this.attackingUnit = null;

}


rivalBoardCardSelected(card: Card | null)
{
  if(!this.gameState.IsMyTurn || !card || !this.attackingUnit) return;
  this.ws.send({
    "$type" : "AttackAction",
    "AttackerIndex" : this.gameState.Me.Board.findIndex(n => n?.id === this.attackingUnit?.id),
    "TargetIndex" : this.gameState.Rival.Board.findIndex(n => n?.id === card?.id),
    "TargetType": "ENEMY_BOARD"
  })

  this.attackingUnit = null;

}

// getTransform(index: number, total: number): string {
//   const middle = (total - 1) / 2;

//   const rotationStep = 6; // grados

//   const rotation = (index - middle) * rotationStep;

//   const offsetY = Math.abs(index - middle) * -5;

//   return `rotate(${rotation}deg) translateY(${offsetY}px)`;
// }
}