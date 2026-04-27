import { Component, HostListener, OnInit, signal, ViewChild } from '@angular/core';

import { Card } from '../../models/card.model';

import { WebsocketService } from '../../core/services/websocket.service';
import { Router } from '@angular/router';
import { Game } from '../../models/game.model';
import { Health } from '../../models/health.model';
import { Player } from '../../models/player.model';
import { MessageDialogComponent } from '../../ui/message-dialog/message-dialog.component';


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
      case "text_message":
      this.createFloatingMessage(msg.Content.message, msg.Content.player);
      break;
      case "game_events":
      this.gameEvents = msg.Content;
      this.handleGameEvents(this.gameEvents);
      break;
      case "game_state":
      this.storedGameState = msg.Content;
      this.gameState.IsMyTurn = this.storedGameState.IsMyTurn;
      if(this.gameState.Rival.Id === "" || this.gameState.Me.Id === "")
      {
        this.gameState.Rival.Id = this.storedGameState.Rival.Id;
        this.gameState.Me.Id = this.storedGameState.Me.Id;

        this.gameState.Rival.Name = this.storedGameState.Rival.Name;
        this.gameState.Me.Name = this.storedGameState.Me.Name;
      }
      break;
      case "end_game":
        let message = "";

        if(msg.Content.forced)
        {
          message = `${this.gameState.Rival.Name} ha salido de la aplicación y ha abandonado la partida.`
        } else {
          message = `Partida terminada, victoria para ${this.isRival(msg.Content.winner) ? this.gameState.Rival.Name : this.gameState.Me.Name}.`
        }
        
        alert(message);

        this.router.navigateByUrl("/");
      break;
      default:
      console.error("Unknown message!!!");
      console.error(msg);
      return true;
    }

    return false;
  }

getTargetElement(
  index: number,
  type: "RIVAL" | "PLAYER" | "ENEMY_BOARD" | "OWN_BOARD",
  isRival: boolean
): HTMLElement | null {

  switch (type) {

    case "RIVAL":
      return this.findElement( isRival ? this.gameState.Me.Id : this.gameState.Rival.Id);

    case "PLAYER":
      return this.findElement(isRival ? this.gameState.Rival.Id : this.gameState.Me.Id);

    case "ENEMY_BOARD": {
      const card =
        (isRival ? this.gameState.Me.Board : this.gameState.Rival.Board)[index];

      return card
        ? this.findElement(card.id)
        : null;
    }

    case "OWN_BOARD": {
      const card =
        (isRival ? this.gameState.Rival.Board : this.gameState.Me.Board)[index];

      return card
        ? this.findElement(card.id)
        : null;
    }

    default:
      return null;
  }
}

async animateAttack(
  playerId: string,
  attackerId: string,
  targetIndex: number,
  targetType: "RIVAL" | "PLAYER" | "ENEMY_BOARD" | "OWN_BOARD",
  attackerDamage: number,
  defenderDamage: number
): Promise<void> {
  
  await this.nextFrame();

  var isRival = this.isRival(playerId);

  const attackerEl = this.findElement(attackerId);
  const targetEl = this.getTargetElement(targetIndex, targetType, isRival);

  if (!attackerEl || !targetEl) {
    console.error("No se encontró atacante o objetivo");
    return;
  }

  attackerEl.style.transformOrigin = "50% 100%";
  targetEl.style.transformOrigin = "50% 100%";

  const targetAnim = targetEl.animate(
    [
      { transform: "rotate(0deg) translateY(0px)" },

      { transform: "rotate(-45deg) translateY(-10px)" },

      { transform: "rotate(0deg) translateY(0px)" }
    ],
    {
      duration: 500,
      easing: "ease-out"
    }
  );

  const attackerAnim = attackerEl.animate(
    [
      { transform: "rotate(0deg) translateY(0px)" },

      { transform: "rotate(45deg) translateY(-10px)" },

      { transform: "rotate(0deg) translateY(0px)" }
    ],
    {
      duration: 500,
      easing: "ease-out"
    }
  );

  await new Promise(resolve =>
    setTimeout(resolve, 250)
  );

  switch (targetType)
  {
    case "RIVAL":
      (isRival ? this.userHealth : this.rivalHealth).changeHealth(-attackerDamage, 500);  
      break;
    case "PLAYER":
      (isRival ? this.rivalHealth : this.userHealth).changeHealth(-attackerDamage, 500);  
      break;
    case "ENEMY_BOARD":
      var board = (isRival ? this.gameState.Me.Board :this.gameState.Rival.Board);
      board[targetIndex]?.changeHealth(-attackerDamage, 500);
      var enemyBoard = (isRival ? this.gameState.Rival.Board :this.gameState.Me.Board);
      var attackerIndex = enemyBoard.findIndex(n => n?.id === attackerId);
      if (attackerIndex !== -1)
      {
        enemyBoard[attackerIndex]?.changeHealth(-defenderDamage, 500);
      }
      break;
    case "OWN_BOARD":
      var board = (isRival ? this.gameState.Rival.Board :this.gameState.Me.Board);
      board[targetIndex]?.changeHealth(-attackerDamage, 500);
      var attackerIndex = board.findIndex(n => n?.id === attackerId);
      if (attackerIndex !== -1)
      {
        board[attackerIndex]?.changeHealth(-defenderDamage, 500);
      }
      break;
  }

  await Promise.all([
    attackerAnim.finished,
    targetAnim.finished
  ]);
}

async createProyectile(source: string, target: string)
{
  if (source === target) return;
  await this.nextFrame();
  const proyectile = document.querySelector(".proyectile") as HTMLElement;

  const vsource = this.findElement(source);
  const vtarget = this.findElement(target);

  if(!vsource || !vtarget)
  {
    console.error("No puedo crear proyectil");
    return;
  }

  const start = this.getCenter(vsource);
  const end = this.getCenter(vtarget);

  proyectile.style.position = "fixed";
  proyectile.style.left = `${start.x}px`;
  proyectile.style.top = `${start.y}px`;
  proyectile.style.display = "block";

  const dx = end.x - start.x;
  const dy = end.y - start.y;

  const animation = proyectile.animate(
  [
    { transform: "translate(0px, 0px)" },
    { transform: `translate(${dx}px, ${dy}px)` },
    { trasnform: "rotate(1080deg)" }
  ],
  {
    duration: 800,
    easing: "ease-out",
    fill: "forwards"
  });

  await animation.finished;

  proyectile.style.display = "none";
}
  getDeckId(id: string): string {
    return id === this.gameState.Me.Id ?
            "player-deck" :
            "rival-deck"
  } 
  
  playEvent(event: any): Promise<void> {
    return new Promise(async resolve => {
      switch (event.$type) {
        case "CardEventPlayed":
          var player = this.getPlayer(event.PlayerSource);

          let i = player.Board.findIndex(n => n?.id === event.Card);
          if(i !== -1)
          {
            player.Board[i]!.effectTimes! -= 1;
          } else {
            (this.isRival(event.PlayerSource) ? this.rivalLastSpellPlayed : this.playerLastSpellPlayed)!.effectTimes! -= 1;
          }
          break;
        case "CardAttacked":
          await this.animateAttack(
            event.PlayerSource,
            event.Attacker,
            event.TargetIndex,
            event.TargetType,
            event.AttackerDamage,
            event.DefenderDamage
          );

        break;
        case "CardDrawnEvent":
          var player = this.getPlayer(event.PlayerSource);
          await this.createProyectile(event.Source, 
            this.getDeckId(player.Id)
          );
        player.HandData.push(
          Card.fromJSON(event.Card));
        player.HandSize++;
        break;
        case "PlayerHealthChanged":
        await this.createProyectile(event.Source, event.PlayerSource);
        var health = this.getPlayerHealth(event.PlayerSource)
        health.changeHealth(event.Amount, this.changeHealthAnimationDuration);
        break;
        case "UnitHealthChanged":
        var arrayToFind = this.getPlayer(event.PlayerSource).Board;
        await this.createProyectile(event.Source, event.Card);
        
        arrayToFind.forEach(n => {
          if (n && n.id === event.Card)
            {
              
            n.changeHealth(event.Amount, this.changeHealthAnimationDuration);
            return;
          }
        })
        break;
        case "UnitDamageChanged":
        await this.createProyectile(event.Source, event.Card);

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

        case "AddedCardToDeck":
          await this.createProyectile(event.Source, this.getDeckId(event.TargetedPlayer));
            break;
        case "DeckModifiedStats":
          await this.createProyectile(event.Source, this.getDeckId(event.TargetedPlayer));
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
  console.log("Buscando elemento: ", id);
  console.log(document.querySelector(`[data-game-id="${id}"]`))
  return document.querySelector(`[data-game-id="${id}"]`) as HTMLElement;
}

ngOnInit(): void {
  this.animationLayer = document.querySelector(".animation-layer") as HTMLElement;
  this.ws.subscribe(this.processMessage)
}
showSidePanel = false;

changeHealthAnimationDuration: number = 500;


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
animationLayer: HTMLElement | null = null;
unitSelected: boolean = false;
attackingUnit: Card | null = null;

floatingMessages: FloatingMessage[] = [];

createFloatingMessage(
  text: string,
  playerId: string
)
{
  let userHealht = this.findElement(this.isRival(playerId) ? this.gameState.Me.Id : this.gameState.Rival.Id).getBoundingClientRect();
  const randomHeight =
    80 + Math.random() * 120;

  const duration = 3000;

  const message: FloatingMessage = {

    text,

    x: userHealht.x + userHealht.width / 2,
    bottom: userHealht.bottom + userHealht.height,

    height: randomHeight,
    duration

  };

  this.floatingMessages.push(message);


  setTimeout(() => {

    this.floatingMessages =
      this.floatingMessages
        .filter(m => m != message);

  }, duration);

}

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
  
  if (!card) return;
  
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

  if(!this.unitSelected && this.selectedCard && card && card.canPlay)
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
  if (!this.gameState.IsMyTurn || !this.selectedCard || !this.selectedCard.canPlay || !this.unitSelected) return;

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

  this.selectedCard = null;
  if(this.attackingUnit?.id === card?.id && this.attackingUnit?.hasEffect && this.attackingUnit.effectTimes || 0 > 0)
  {
    let index = this.gameState.Me.Board.findIndex(n => n?.id === card?.id);
    this.ws.send({
      "$type" : "CardEffectActivated",
      "CardIndex" : index
    })
    this.attackingUnit = null;
    return;
  }

  this.attackingUnit = this.attackingUnit?.id === card?.id ? null : card;
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

@ViewChild('dialog')
dialog!: MessageDialogComponent;

// Detecta teclas globalmente

@HostListener('window:keydown', ['$event'])
handleKeyboardEvent(event: KeyboardEvent) {

  if (event.key === 'Tab') {

    event.preventDefault(); 

    this.dialog.open();

  }
}

onMessageSent(text: string) {
  this.ws.send({
    "$type" : "TextMessage",
    "Message" : text
  });
}
}