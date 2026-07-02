import { Component, ElementRef, HostListener, OnInit, signal, ViewChild } from '@angular/core';

import { Card } from '../../models/card.model';

import { WebsocketService } from '../../core/services/websocket.service';
import { Router } from '@angular/router';
import { Game } from '../../models/game.model';
import { Health } from '../../models/health.model';
import { Player } from '../../models/player.model';
import { MessageDialogComponent } from '../../ui/message-dialog/message-dialog.component';
import { ChatComponent } from '../../shared/components/chat/chat.component';
import { Message } from '../../models/message.model';
import { GameCardCheckComponent } from '../../shared/components/game-card-check/game-card-check.component';

//TODO: HAY QUE CONTROLAR LOS NUEVOS DOS EVENTOS

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
      Me: {
        TargetPlayer: "",
        Id: "",
        IsMyTurn: false,
        LastSpellPlayed: null,
        Name: "",
        Board: [
          null,
          null,
          null,
          null,
        ],
        Health: new Health(),
        HandSize: 0,
        HandData: [],
        Deck: {
          id: "1",
          name: "",
          description: "",
          cardAmount: 0          
        },
        GlobalEffects: [
        ],
      },
      Rivals: [{
        TargetPlayer: "",
        IsMyTurn: false,
        LastSpellPlayed: null,
        Id: "",
        Name: "",
        Board: [
          null,
          null,
          null,
          null,
        ],
        Health: new Health(),
        HandSize: 0,
        HandData: [
          
        ],
        Deck: {
          id: "1",
          name: "",
          description: "",
          cardAmount: 0          
        },
        GlobalEffects: [
        ],
      }]
    }
    
    this.storedGameState = this.gameState;
  }

  //PONER AQUÍ LAS FUNCIONES QUE SE SALVAN

  isUser(id: string): boolean
  {
    return this.gameState.Me.Id === id;
  }

  getPlayer(id: string) : Player
  {
    return this.isUser(id) ? this.gameState.Me : this.gameState.Rivals.find(n => n.Id === id)!!;
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
      this.singleActionEvent = true;
      this.storedGameState = msg.Content;
      
      //TODO: PROBAR Y CAMBIAR
      if(this.gameState.Me.Id === "")
      {
        var health = new Health();
        health.health = health.displayHealth = msg.Content.Me.Health;
        this.gameState = this.storedGameState;
        this.gameState.Me.Health = health;
        this.gameState.Me.HandData = [];
        this.gameState.Me.HandSize = 0;
        this.gameState.Rivals.forEach((n,i) => {
          var health = new Health();
          health.health = health.displayHealth = msg.Content.Rivals[i].Health;
          n.Health = health;
          n.HandSize = 0;
        })
          this.playerBoardX = this.playerRef.nativeElement.getBoundingClientRect().width;
          this.playerBoardY = this.playerRef.nativeElement.getBoundingClientRect().height;
        this.prepareTableGame();
      }

      if(this.firstime)
      {
        this.firstime = false;
        this.gameState.Me.TargetPlayer = this.getPlayer(this.gameState.Me.TargetPlayer).Name;

        this.gameState.Rivals.forEach(n => {
          n.TargetPlayer = this.getPlayer(n.TargetPlayer).Name;
        })
      }

      this.gameState.Me.GlobalEffects = this.storedGameState.Me.GlobalEffects;
      this.gameState.Me.IsMyTurn = this.storedGameState.Me.IsMyTurn;

      this.gameState.Rivals.forEach((n, i) => {
        n.GlobalEffects = this.storedGameState.Rivals[i].GlobalEffects;
        n.IsMyTurn = this.storedGameState.Rivals[i].IsMyTurn;
      })


      break;
      case "end_game":
        this.endGame(msg.Content.winner);
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
  type: "BOARD" | "PLAYER",
  targetPlayerId: string,
): HTMLElement | null {

  var targetPlayer = this.getPlayer(targetPlayerId)
  switch (type) {
    case "PLAYER":
      return this.findElement(targetPlayer.Id);

    case "BOARD": {
      const card = targetPlayer.Board[index];
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
  targetPlayerId: string,
  attackerId: string,
  targetIndex: number,
  targetType: "BOARD" | "PLAYER",
  attackerDamage: number,
  defenderDamage: number
): Promise<void> {
  
  await this.nextFrame();
  const attackerEl = this.findElement(attackerId);
  const targetEl = this.getTargetElement(targetIndex, targetType, targetPlayerId);
  const targetPlayer = this.getPlayer(targetPlayerId);



  if (!attackerEl || !targetEl) {
    console.error("No se encontró atacante o objetivo");
    return;
  }

  attackerEl.style.transformOrigin = "50% 100%";
  targetEl.style.transformOrigin = "50% 100%";

  const attackerRect = attackerEl.getBoundingClientRect();
  const targetRect = targetEl.getBoundingClientRect();
  const dx = targetRect.left + targetRect.width / 2 - (attackerRect.left + attackerRect.width / 2);
  const dy = targetRect.top + targetRect.height / 2 - (attackerRect.top + attackerRect.height / 2);

  // Use only horizontal displacement to compute a small tilt angle
  // and scale down the overall movement to make the animation less intense.
  const angle = Math.atan(dx / attackerRect.width) * (180 / Math.PI);
  const movementScaleX = 0.3;
  const movementScaleY = 0.15;
  const scaledDx = angle * movementScaleX;
  const scaledDy = dy * movementScaleY;
  const verticalMovement = scaledDy > 0 ? 6 : -6;

  const targetAnim = attackerEl.animate(
    [
      { transform: "rotate(0deg) translateY(0px)" },
      { transform: `rotate(${scaledDx}deg) translateY(${verticalMovement}px)` },
    ],
    {
      duration: 500,
      easing: "ease-out"
    }
  );

  await targetAnim.finished;

  const attackerAnim = attackerEl.animate(
    [
      { transform: "translateY(0px)" },
      { transform: `translate(${dx}px, ${dy}px) rotate(${scaledDx}deg)` },
      { transform: "translate(0px, 0px) rotate(0deg)" }
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
    case "PLAYER":
      targetPlayer.Health.changeHealth(-attackerDamage, 500);  
      break;
    case "BOARD":
      targetPlayer.Board[targetIndex]?.changeHealth(-attackerDamage, 500);
      var attackerPlayer = this.getPlayer(playerId);
      var attackerIndex = attackerPlayer.Board.findIndex(n => n?.id === attackerId);
      if (attackerIndex !== -1)
      {
        attackerPlayer.Board[attackerIndex]?.changeHealth(-defenderDamage, 500);
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
    {
      transform: "translate(0px, 0px) rotate(0deg)"
    },
    {
      transform: `translate(${dx}px, ${dy}px) rotate(1080deg)`
    }
  ],
  {
    duration: 250,
    easing: "ease-out",
    fill: "forwards"
  });

  await animation.finished;

  proyectile.style.display = "none";
}

getDeckId(id: string): string {
  return id + '-deck'
} 

cardEventPlayed(cardId: string, playerId: string)
{
  const player = this.getPlayer(playerId);
  const i = player.Board.findIndex(n => n?.id === cardId);

  if(i !== -1)
  {
    player.Board[i]!.effectTimes! -= 1;
  } else {
    player.LastSpellPlayed!.effectTimes! -= 1;
  }
}

firstime = true;


  playEvent(event: any): Promise<void> {
    return new Promise(async resolve => {
      switch (event.$type) {
        case "TargetPlayerChanged":
          var player = this.getPlayer(event.PlayerSource);
          var newTarget = this.getPlayer(event.NewTarget);
          player.TargetPlayer = newTarget.Name;
        break;
        case "PlayerDeath":
          var player = this.getPlayer(event.PlayerSource)
          player.Health.changeHealth(-player.Health.displayHealth, 500)
          break;
        case "CardEventPlayed":
          this.cardEventPlayed(event.Card, event.PlayerSource);  
          break;
        case "CardAttacked":
          await this.animateAttack(
            event.PlayerSource,
            event.PlayerTarget,
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
          if(event.FromDeck)
          {
            player.Deck.cardAmount--;
          }
        break;
        case "PlayerHealthChanged":
        await this.createProyectile(event.Source, event.PlayerSource);
        var health = this.getPlayer(event.PlayerSource).Health;
        health.changeHealth(event.Amount, this.changeHealthAnimationDuration);
        break;
        case "UnitHealthChanged":
        var arrayToFind = this.getPlayer(event.PlayerSource).Board;
        await this.createProyectile(event.Source, event.Card);
        
        const card = arrayToFind.find(n => n && n.id === event.Card);

        if (card) {
          card.changeHealth(event.Amount, this.changeHealthAnimationDuration);
        }
        break;
        case "UnitDamageChanged":
        await this.createProyectile(event.Source, event.Card);

        var arrayToFind = this.getPlayer(event.PlayerSource).Board;
        
        const ard = arrayToFind.find(n => n && n.id === event.Card);

        if (ard) {
          ard.changeDamage(event.Amount, this.changeHealthAnimationDuration);
        }
        break;
        case "UnitDeath":
        var arrayToFind = this.getPlayer(event.PlayerSource).Board;
        var visualElement = this.findElement(event.Unit);
        var index = arrayToFind.findIndex(n => n && n.id === event.Unit);
        if (index !== -1) {
          const animation = visualElement.animate(
            [
              { opacity: 1, transform: 'scale(1)' },
              { opacity: 0, transform: 'scale(0.8)' }
            ],
            {
              duration: 300,
              easing: 'ease-in',
              fill: 'forwards'
            }
          );
          await animation.finished;
          arrayToFind[index] = null;
        }
        break;
        
        case "UnitPlayed":
        
        var player = this.getPlayer(event.PlayerSource);
        var cardIndex = player.HandData.findIndex(c => c.id === event.Unit.id);
        if (cardIndex !== -1) {
          player.HandData.splice(cardIndex, 1);
          player.HandSize--;
        }
        if (event.Unit) {
          player.Board[event.BoardPosition] = Card.fromJSON(event.Unit);
        }
        break;
        
        case "SpellPlayed":
        var player = this.getPlayer(event.PlayerSource);
        var cardIndex = player.HandData.findIndex(c => c.id === event.Spell.id);
        if (cardIndex !== -1) {
          player.HandData.splice(cardIndex, 1);
          player.HandSize--;
        }
        player.LastSpellPlayed = Card.fromJSON(event.Spell);
        break;

        case "AddedCardToDeck":
          await this.createProyectile(event.Source, this.getDeckId(event.TargetedPlayer));
          this.getPlayer(event.TargetedPlayer).Deck.cardAmount++;
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

changeHealthAnimationDuration: number = 500;

selectedCard: Card | null = null;
gameState: Game;
storedGameState: Game;
gameEvents: any[] = [];
eventQueue: any[] = [];
isAnimating: boolean = false;
animationLayer: HTMLElement | null = null;
unitSelected: boolean = false;
attackingUnit: Card | null = null;
singleActionEvent: boolean = false;
targetSelected = false;

floatingMessages: FloatingMessage[] = [];

createFloatingMessage(
  text: string,
  playerId: string
)
{
  let playerName = this.getPlayer(playerId).Name;
  let message = new Message();
  message.text = text;
  message.playerName = playerName;

  this.chat.addMessage(message);
}

async handleGameEvents(events: any[]) {
  
  this.eventQueue.push(...events);
  
  if (this.isAnimating) return;
  
  this.isAnimating = true;
  
  while (this.eventQueue.length > 0) {
    const event = this.eventQueue.shift();
    await this.playEvent(event);
  }

  this.storedGameState.Me.HandData.forEach((n, i) => {
    this.gameState.Me.HandData[i].canPlay = n.canPlay;
  })
  
  this.isAnimating = false;
}

onRightClick(
  event: MouseEvent,
  card: Card | null
) {
  
  event.preventDefault();
  
  if (!card) return;
  
  this.cardCheck.open(card);
}

cardSelected(card: Card | null)
{
  if (!this.gameState.Me.IsMyTurn && card && card.canPlay) return;
  
  this.selectedCard = this.selectedCard?.id === card?.id ? null : card;
  this.unitSelected = this.selectedCard?.type === "Unit";
  this.attackingUnit = null;

  if(!this.unitSelected && this.selectedCard && card && card.canPlay)
  {
    this.selectedCard = null;
    this.safeSend({
      "$type": "PlayCardAction",
      "CardIndex": this.gameState.Me.HandData.findIndex((n: Card) => n.id == card.id),
      "BoardIndex": -1
    })
  }
}

dockSelected(position: number)
{
  if (!this.gameState.Me.IsMyTurn || !this.selectedCard || !this.selectedCard.canPlay || !this.unitSelected) return;

    this.safeSend({
      "$type": "PlayCardAction",
      "CardIndex": this.gameState.Me.HandData.findIndex((n: Card) => n.id == this.selectedCard?.id),
      "BoardIndex": position
    })
  this.selectedCard = null;
  this.unitSelected = false;
}

deckSelected() 
{
  if (!this.gameState.Me.IsMyTurn) return;

  this.safeSend({
    "$type" : "DrawCardAction"
  })
}

attackingUnitSelected(card: Card | null)
{
  if(!this.gameState.Me.IsMyTurn) return;

  this.selectedCard = null;
  if(this.attackingUnit?.id === card?.id && this.attackingUnit?.hasEffect && this.attackingUnit.effectTimes || 0 > 0)
  {
    let index = this.gameState.Me.Board.findIndex(n => n?.id === card?.id);
    this.safeSend({
      "$type" : "CardEffectActivated",
      "CardIndex" : index
    })
    this.attackingUnit = null;
    return;
  }

  this.attackingUnit = this.attackingUnit?.id === card?.id ? null : card;
  this.targetSelected = false;
}

targetSel() {
  console.log('se ha hecho click')
  this.targetSelected = true;
}

rivalTargetSelected(rival: Player)
{
  if(!this.gameState.Me.IsMyTurn) return;
  
  if(this.attackingUnit)
  {
    this.safeSend({
    "$type" : "AttackAction",
    "AttackerIndex" : this.gameState.Me.Board.findIndex(n => n?.id === this.attackingUnit?.id),
    "TargetIndex" : -1,
    "TargetType": "PLAYER",
    "PlayerTarget" : rival.Id
  })
  } else if (this.targetSelected)
  {
    this.safeSend({
      "$type" : "ChangeTarget",
      "NewTarget" : rival.Id
    })
    this.targetSelected = false;
  }
  

  this.attackingUnit = null;
}

rivalBoardCardSelected(rival: Player, card: Card | null)
{
  if(!this.gameState.Me.IsMyTurn || !card || !this.attackingUnit) return;
  this.safeSend({
    "$type" : "AttackAction",
    "AttackerIndex" : this.gameState.Me.Board.findIndex(n => n?.id === this.attackingUnit?.id),
    "TargetIndex" : rival.Board.findIndex(n => n?.id === card?.id),
    "TargetType": "BOARD",
    "PlayerTarget": rival.Id
  })

  this.attackingUnit = null;
}

lastSpellClicked()
{
  if(this.gameState.Me.LastSpellPlayed && this.gameState.Me.LastSpellPlayed!.effectTimes || 0 > 0)
  {
    this.safeSend({
      "$type" : "CardEffectActivated",
      "CardIndex" : 4
    })
  }
}

currentTargetPos : string = ""

@ViewChild('dialog')
dialog!: MessageDialogComponent;

@ViewChild('chat')
chat!: ChatComponent;

@ViewChild('gamecheck')
cardCheck!: GameCardCheckComponent;



@ViewChild('winnerboard')
winnerboard!: ElementRef<HTMLElement>;

leaveGame()
{
  this.ws.send({
    "$type" : "LeaveGame"
  })
  this.router.navigateByUrl("/");
}

endGame(winner: string)
{
  const player = this.getPlayer(winner);

  this.winnerboard.nativeElement
    .querySelector('.winner-name')!
    .textContent = player.Name;

  const overlay =
    this.winnerboard.nativeElement.parentElement as HTMLElement;

  // Mostrar overlay antes de animar
  overlay.style.display = 'flex';

  const animation = this.winnerboard.nativeElement.animate(
    [
      {
        opacity: 0,
        transform: 'translateY(-10vh)'
      },
      {
        opacity: 1,
        transform: 'translateY(0)'
      }
    ],
    {
      duration: 500,
      easing: 'ease-out',
    }
  );

  animation.onfinish = () => {
    animation.commitStyles();
    animation.cancel();
  };
}

// Detecta teclas globalmente

openChat() 
{
  if(this.chat.isOpen) {
      this.chat.close();
    } else {
      this.chat.open();
    }
}

@HostListener('window:keydown', ['$event'])
handleKeyboardEvent(event: KeyboardEvent) {

  if (event.key === 'Tab') {

    event.preventDefault(); 

    this.openChat()
  }
}

onMessageSent(text: string) {
  this.ws.send({
    "$type" : "TextMessage",
    "Message" : text
  });
}



safeSend(payload: any): void {

  if (!this.singleActionEvent || this.isAnimating) {
    return;
  }


  this.ws.send(payload);

  this.singleActionEvent = false;

}



ngAfterViewInit() {
  const viewport = this.viewportRef.nativeElement;

  viewport.scrollLeft =
    (viewport.scrollWidth - viewport.clientWidth) / 2;

  viewport.scrollTop =
    (viewport.scrollHeight - viewport.clientHeight) / 2;
}

calculateApotema(): number
{
  const playerX = this.playerBoardX;
  const numPlayers = this.gameState.Rivals.length + 1;

  // Ángulo en radianes
  const angle = Math.PI / numPlayers;

  return playerX / (2 * Math.tan(angle));
}

calculateRotationDegrees() : number
{
  const numPlayers = this.gameState.Rivals.length +1;
  
  return 360 / numPlayers;
}


@ViewChild('viewport')
viewportRef!: ElementRef<HTMLDivElement>;

@ViewChild('playerboard')
playerRef!: ElementRef<HTMLDivElement>;

distance: number = 0;
rotation: number = 0;

viewPortCenterY: number = 0;
viewPortCenterX: number = 0;

boardSizeY: number = 0;
boardSizeX: number = 0;


playerBoardX: number = 0;  //TODO: SUSTITUIRLO POR EL VALOR REAL
playerBoardY: number = 0;  //TODO: SUSTITUIRLO POR EL VALOR REAL

extraMargin: number = 200;

extraOffSetY: number = 0;
extraOffSetX: number = 0;

shoudlRotatePlayers = false;

getCircumradius(): number
{
  const side = this.playerBoardX;
  const numPlayers = this.gameState.Rivals.length + 1;

  return side / (2 * Math.sin(Math.PI / numPlayers));
}

prepareTableGame()
{

  this.rotation = this.calculateRotationDegrees();
  if(this.gameState.Rivals.length === 1)
  {
    this.extraMargin = 0;
    this.shoudlRotatePlayers = true;
    this.rotation = 0;
  }

  this.distance = this.calculateApotema() + this.extraMargin;

  // boardSize está en px
  this.boardSizeX = (this.getCircumradius() + this.extraMargin) * 2;
  this.boardSizeY = (this.getCircumradius() + this.extraMargin) * 2;

  if(this.shoudlRotatePlayers)
  {
    this.boardSizeY = this.playerBoardY * 2;
  }

  this.viewPortCenterY = this.boardSizeY / 2;
  this.viewPortCenterX = this.boardSizeX / 2;


  for (let index = 0; index < this.gameState.Rivals.length + 1; index++) {
    this.getRivalStyle(index);
  }
}

styles: any[] = []

getRivalStyle(index: number)
{
  // Rotación total del rival
  const rotationDeg = this.rotation * index;

  // Conversión a radianes
  const rotationRad = rotationDeg * (Math.PI / 180);

  /**
   * Centro del viewport
   */
  const centerX = this.viewPortCenterX;
  const centerY = this.viewPortCenterY + this.extraOffSetY;
  /**
   * Descomposición del apotema
   */
  let offsetX = Math.sin(rotationRad) * this.distance;
  let offsetY = Math.cos(rotationRad) * this.distance;

  if(this.gameState.Rivals.length === 1)
  {
    offsetY += this.playerBoardY / 2 * (index === 1 ? -1 : 1);
  }

  console.log("Para ", index)
  console.log("offsetX: ", offsetX);
  console.log("offsetY: ", offsetY);

  /**
   * Posición final del centro del tablero rival
   */
  const rivalCenterX = centerX + (-1* offsetX);
  const rivalCenterY = centerY + (1 * offsetY);

  /**
   * Convertimos de centro a top-left
   */
  const x = rivalCenterX - (this.playerBoardX / 2);
  const y = rivalCenterY - (this.playerBoardY / 2);

  this.styles[index] = {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    transform: `rotate(${rotationDeg}deg)`
  };
}

boardRotation = 0;

resetTransform()
{
  this.boardRotation = 0;
}

rotateBoardLeft()
{
  this.boardRotation -= this.rotation;
}

rotateBoardRight()
{
  this.boardRotation += this.rotation;
}
private isDragging = false;
private startX = 0;
private startY = 0;
private startScrollX = 0;
private startScrollY = 0;

onMouseDown(event: MouseEvent): void {
  if (event.button !== 0) {
    return;
  }

  this.isDragging = true;
  this.startX = event.clientX;
  this.startY = event.clientY;

  this.startScrollX = window.scrollX;
  this.startScrollY = window.scrollY;

  document.body.style.cursor = 'grabbing';

  event.preventDefault();
}

@HostListener('window:mousemove', ['$event'])
onMouseMove(event: MouseEvent): void {
  if (!this.isDragging) {
    return;
  }

  const dx = event.clientX - this.startX;
  const dy = event.clientY - this.startY;

  window.scrollTo({
    left: this.startScrollX - dx,
    top: this.startScrollY - dy,
    behavior: 'auto'
  });
}

@HostListener('window:mouseup')
onMouseUp(): void {
  this.isDragging = false;
  document.body.style.cursor = '';
}

}