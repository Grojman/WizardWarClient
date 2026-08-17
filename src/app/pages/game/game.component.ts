import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { Card } from '../../models/card.model';

import { WebsocketService } from '../../core/services/websocket.service';
import { Router } from '@angular/router';
import { Game } from '../../models/game.model';
import { Player } from '../../models/player.model';
import { MessageDialogComponent } from '../../ui/message-dialog/message-dialog.component';
import { ChatComponent } from '../../shared/components/chat/chat.component';
import { SettingsComponent } from '../../shared/components/settings/settings.component';
import { Message } from '../../models/message.model';
import { GameCardCheckComponent } from '../../shared/components/game-card-check/game-card-check.component';
import { GameAnimationService } from '../../core/services/game-animation.service';
import { GameStateService } from '../../core/services/game-state.service';

import { SPELL, UNIT } from '../../core/config/game-data-config';
import { AudioService } from '../../core/services/audio.service';
import { HelpComponent } from '../../shared/components/help/help.component';
import { AlertModalComponent } from '../../shared/components/alert-modal/alert-modal.component';
import { SeriesStateService } from '../../core/services/series-state.service';
import { GameSessionStorageService } from '../../core/services/game-session-storage.service';

//TODO: HAY QUE CONTROLAR LOS NUEVOS DOS EVENTOS

@Component({
  selector: 'app-game',
  standalone: false,
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
})
export class GameComponent implements OnInit, OnDestroy {
  spell: string = SPELL;
  unit: string = UNIT;

  audio: AudioService;

  cardsWithEffect = ["34", "96", "98", "99", "100", "101", "102"];

  constructor(
    private ws : WebsocketService,
    private router : Router,
    private gameStateService: GameStateService,
    private animationService: GameAnimationService,
    private audioService: AudioService,
    private seriesStateService: SeriesStateService,
    private gameSessionStorage: GameSessionStorageService
  )
  {
    this.gameState = this.createInitialGameState();
    this.storedGameState = this.gameState;
    this.audio = audioService;
    audioService.startMusic("game");
  }

  private createInitialGameState(): Game {
    return this.gameStateService.createInitialGameState();
  }

  isUser(id: string): boolean
  {
    return this.gameState.Me.Id === id;
  }

  private getSafePlayer(id: string | undefined): Player | null {
    if (!id) {
      return null;
    }

    if (this.isUser(id)) {
      return this.gameState.Me;
    }

    return this.gameState.Rivals.find((n) => n.Id === id) ?? null;
  }

  getPlayer(id: string): Player {
    const player = this.getSafePlayer(id);

    if (player) {
      return player;
    }

    console.warn(`Player not found for id "${id}", falling back to local player`);
    return this.gameState.Me;
  }
  
  processMessage = (msg: any): boolean => {
    switch(msg.Type)
    {
      case "text_message":
        this.handleTextMessage(msg.Content);
        break;
      case "game_events":
        this.handleGameEventsMessage(msg.Content);
        break;
      case "game_state":
        this.handleGameStateMessage(msg.Content);
        break;
      case "end_game":
        this.handleEndGameMessage(msg.Content);
        break;
      case "opponent_disconnected":
        this.handleOpponentDisconnected(msg.Content);
        break;
      case "opponent_reconnected":
        this.handleOpponentReconnected();
        break;
      case "series_state":
        this.seriesStateService.applySeriesState(msg.Content);
        break;
      case "series_end":
        this.seriesStateService.applySeriesEnd(msg.Content);
        break;
      case "error":
        this.handleErrorMessage(msg.Content);
        break;
      default:
        console.error("Unknown message!!!");
        console.error(msg);
        return true;
    }

    return false;
  }

  private handleTextMessage(content: any): void {
    if (!this.chat.isOpen)
    {
      this.unreadNotificationCounter++;
    }
    this.createFloatingMessage(content?.message ?? '', content?.player ?? '');
  }

  private handleGameEventsMessage(content: any[]): void {
    this.gameEvents = content;
    this.handleGameEvents(this.gameEvents);
  }

  private handleGameStateMessage(content: Game | null): void {
    this.clearResumeWatchdog();

    this.singleActionEvent = true;
    this.storedGameState = content ?? this.gameState;

    if (this.gameState.Me.Id === "") {
      this.initializeGameState(this.storedGameState);
    }

    this.syncPlayerTargets();
    this.applyTurnAndEffects(this.storedGameState);
  }

  opponentDisconnected: { playerId: string } | null = null;
  secondsRemaining: number = 0;
  private disconnectCountdownTimer?: ReturnType<typeof setInterval>;
  private resumeWatchdogTimer?: ReturnType<typeof setTimeout>;

  private handleOpponentDisconnected(content: any): void {
    this.opponentDisconnected = { playerId: content?.playerId ?? '' };
    this.secondsRemaining = content?.secondsToWait ?? 0;

    clearInterval(this.disconnectCountdownTimer);
    this.disconnectCountdownTimer = setInterval(() => {
      this.secondsRemaining = Math.max(0, this.secondsRemaining - 1);
      if (this.secondsRemaining === 0) {
        clearInterval(this.disconnectCountdownTimer);
      }
    }, 1000);
  }

  private handleOpponentReconnected(): void {
    this.opponentDisconnected = null;
    clearInterval(this.disconnectCountdownTimer);
  }

  private startResumeWatchdog(): void {
    this.resumeWatchdogTimer = setTimeout(() => {
      if (this.gameState.Me.Id === "") {
        this.gameSessionStorage.markInactive();
        this.router.navigateByUrl('/');
      }
    }, 6000);
  }

  private clearResumeWatchdog(): void {
    clearTimeout(this.resumeWatchdogTimer);
    this.resumeWatchdogTimer = undefined;
  }

  private pendingEndGame: any = null;
  isSeriesRound: boolean = false;

  private handleEndGameMessage(content: any): void {
    this.isSeriesRound = !!content?.isSeriesRound;

    if (this.isAnimating || this.eventQueue.length > 0) {
      this.pendingEndGame = content;
      return;
    }
    this.endGame(content?.winner);
  }

  private handleErrorMessage(content: any): void {
    this.errorModal.open(content?.message ?? 'Ha ocurrido un error inesperado.');
  }

  onErrorClosed(): void {
    this.gameSessionStorage.markInactive();
    this.router.navigateByUrl('/');
  }

  private initializeGameState(snapshot: Game): void {
    this.gameState = this.gameStateService.initializeFromSnapshot(snapshot);
  }

  private syncPlayerTargets(): void {
    this.firstime = this.gameStateService.syncPlayerTargets(this.gameState, this.firstime, (id) => this.getPlayer(id));
  }

  private applyTurnAndEffects(snapshot: Game | null): void {
    this.gameStateService.applyTurnAndEffects(this.gameState, snapshot);
    if (this.gameState.Me.IsMyTurn)
    {
      this.audio.playSfx('audio/ding.mp3', false)
    }
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
  const attackerPlayer = this.getPlayer(playerId);



  if (!attackerEl || !targetEl) {
    console.error("No se encontró atacante o objetivo");
    return;
  }

  await this.animationService.animateAttack(
    attackerEl,
    targetEl,
    targetPlayer,
    targetIndex,
    targetType,
    attackerDamage,
    defenderDamage,
    attackerPlayer,
    attackerId,
  );
}

async animateCardDrawn(cardOrigin: string, deckEnd: string, duration: number = 750)
{
  await this.createAnimationDeckCardsAmount(".icon-hand", cardOrigin, deckEnd, duration)
}

async animateAddCard(cardOrigin: string, deckEnd: string, duration: number = 750)
{
  await this.createAnimationDeckCardsAmount(".icon-hand-card", cardOrigin, deckEnd, duration)
}

async animateModifyDeck(cardOrigin: string, deckEnd: string, duration: number = 750)
{
  await this.createAnimationDeckCardsAmount(".icon-hand-wrench", cardOrigin, deckEnd, duration)
}

async createAnimationDeckCardsAmount(startIcon: string, cardOrigin: string, deckEnd: string, duration: number)
{
  await this.animationService.animateDeckCard(startIcon, cardOrigin, deckEnd, duration);
}


async createProyectile(source: string, target: string, optionalTarget:string = "")
{
  await this.animationService.createProjectile(source, target, optionalTarget);
}

getDeckId(id: string): string {
  return id + '-deck'
} 

  async cardEventPlayed(cardId: string, playerId: string)
{
  const player = this.getPlayer(playerId);
  const i = player.Board.findIndex(n => n?.id === cardId);
  await this.animationService.animateSkillEfect(cardId);
  if(i !== -1)
  {
    this.gameStateService.consumeBoardEffect(player, cardId);
  } else {
    this.gameStateService.consumeSpellEffect(player);
  }
}

firstime = true;
unreadNotificationCounter: number = 0;
changeHealthAnimationDuration: number = 500;


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
          await this.cardEventPlayed(event.Card, event.PlayerSource);  
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
          await this.animateCardDrawn(event.Source, this.getDeckId(player.Id))

          this.gameStateService.addCardToHand(player, Card.fromJSON(event.Card));
          if(event.FromDeck)
          {
            this.gameStateService.updateDeckAmount(player, -1);
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
          if (visualElement) {
            await this.animationService.animateUnitDeath(visualElement);
          }
          arrayToFind[index] = null;
        }
        break;
        
        case "UnitPlayed":
        
        var player = this.getPlayer(event.PlayerSource);
        this.gameStateService.removeCardFromHand(player, event.Unit.id);
        if (event.Unit) {
          this.gameStateService.placeCardOnBoard(player, Card.fromJSON(event.Unit), event.BoardPosition);
        }
        this.checkCard(event.Unit.serverId);
        break;

        case "SpellPlayed":
        var player = this.getPlayer(event.PlayerSource);
        this.gameStateService.removeCardFromHand(player, event.Spell.id);
        this.gameStateService.setLastSpellPlayed(player, Card.fromJSON(event.Spell));
        this.checkCard(event.Spell.serverId);
        break;

        case "AddedCardToDeck":
          await this.animateAddCard(event.Source, this.getDeckId(event.TargetedPlayer))
          this.gameStateService.updateDeckAmount(this.getPlayer(event.TargetedPlayer), 1);
            break;
        case "DeckModifiedStats":
          await this.animateModifyDeck(event.Source, this.getDeckId(event.TargetedPlayer))
          break;
        default:
        resolve();
      }
      
      setTimeout(() => {
        resolve()
      }, 500)
    });
  }

checkCard(serverId: string)
{
  if (this.cardsWithEffect.includes(serverId))
  {
    this.audio.playCardSound(serverId);
  }
}
  
nextFrame(): Promise<void>
{
  return this.animationService.nextFrame();
}

getCenter(el: HTMLElement) {
  return this.animationService.getCenter(el);
}

findElement(id: string): HTMLElement{
  return document.querySelector(`[data-game-id="${id}"]`) as HTMLElement;
}

ngOnInit(): void {
  this.animationLayer = document.querySelector(".animation-layer") as HTMLElement;
  this.ws.connect();
  this.ws.subscribe(this.processMessage)
  this.audio.playSfx('/audio/game_start.mp3')
  this.startResumeWatchdog();
}

ngOnDestroy(): void {
  this.ws.clearSubscription();
  this.clearResumeWatchdog();
  clearInterval(this.disconnectCountdownTimer);
}

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
  message.isMine = this.storedGameState.Me.Id === playerId;
  message.playerName = playerName;

  this.chat.addMessage(message);
}

async handleGameEvents(events: any[]) {
  
  this.eventQueue.push(...events);
  
  if (this.isAnimating) return;
  
  this.isAnimating = true;
  
  while (this.eventQueue.length > 0) {
    const event = this.eventQueue.shift();
    const promise =  this.playEvent(event);

    if (!this.checkForConCurrency(event.$type, event.Source)) {
      await promise;
    }
  }

  this.storedGameState.Me.HandData.forEach((n, i) => {
    this.gameState.Me.HandData[i].canPlay = n.canPlay;
    this.gameState.Me.HandData[i].conditionProgress = n.conditionProgress;
    this.gameState.Me.HandData[i].conditionTarget = n.conditionTarget;
  })

  this.isAnimating = false;

  if (this.pendingEndGame) {
    const content = this.pendingEndGame;
    this.pendingEndGame = null;
    this.endGame(content?.winner);
  }
}

checkForConCurrency(type: string, source: string): boolean {
  if (this.eventQueue.length === 0) return false;
  const type2 = this.eventQueue[0].$type;
  const source2 = this.eventQueue[0].Source;
  return (type === "UnitDamageChanged" || type === "UnitHealthChanged") &&
  (type2 === "UnitDamageChanged" || type2 === "UnitHealthChanged") &&
  source2 === source;
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
  this.unitSelected = this.selectedCard?.type === this.unit;
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
  if (!this.gameState.Me.IsMyTurn) return;
  if(this.gameState.Me.LastSpellPlayed && this.gameState.Me.LastSpellPlayed!.effectTimes || 0 > 0)
  {
    this.safeSend({
      "$type" : "CardEffectActivated",
      "CardIndex" : 4
    })
  }
}

@ViewChild('dialog')
dialog!: MessageDialogComponent;

@ViewChild('chat')
chat!: ChatComponent;

@ViewChild('settings')
settings!: SettingsComponent;

@ViewChild('helpwindow')
help!: HelpComponent;

@ViewChild('gamecheck')
cardCheck!: GameCardCheckComponent;

@ViewChild('errorModal')
errorModal!: AlertModalComponent;


openHelp()
{
  this.help.open();
}

@ViewChild('winnerboard')
winnerboard!: ElementRef<HTMLElement>;

leaveGame()
{
  this.gameSessionStorage.markInactive();
  this.router.navigateByUrl(this.isSeriesRound ? "/series" : "/");
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

  this.audioService.stopMusic();
  this.audioService.playSfx(this.storedGameState.Me.Id === player.Id ? "audio/win.mp3" : "audio/lose.mp3");

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
      this.unreadNotificationCounter = 0;
      this.chat.open();
    }
}

openSettings()
{
  if(this.settings.isOpen)
  {
    this.settings.close();
  } else {
    this.settings.open();
  }
}

@HostListener('window:keydown', ['$event'])
handleKeyboardEvent(event: KeyboardEvent) {

  if (event.key === 'Tab') {
    event.preventDefault();
    this.openChat();
    return;
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


@ViewChild('viewport')
viewportRef!: ElementRef<HTMLDivElement>;

@ViewChild('playerboard')
playerRef!: ElementRef<HTMLDivElement>;



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