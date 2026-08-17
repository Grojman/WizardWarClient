import { Component, HostListener, OnInit } from "@angular/core";
import { HelpVideo } from "../../../models/help.video.model"
import { Card } from "../../../models/card.model";
@Component({
  selector: 'app-help',
  standalone: false,
  templateUrl: './help.component.html',
  styleUrl: './help.component.css',
})
export class HelpComponent
 {
  cardWithAbilityExample: Card = {
    id: "",
    serverId: "",
    name: "Carta con habilidad",
    hasEffect: true,
    canPlay: true,
    imageUrl: "example",
    effectTimes: 1,
    description: "",
    changeHealth: function (amount: number, durationAnimation: number): void {
      throw new Error("Function not implemented.");
    },
    changeDamage: function (amount: number, durationAnimation: number): void {
      throw new Error("Function not implemented.");
    }
  }

  cardSpellExample: Card = {
    id: "",
    serverId: "",
    name: "Hechizo",
    type: "Spell",
    canPlay: true,
    imageUrl: "example",
    description: "Este es un ejemplo de carta de hechizo.",
    changeHealth: function (amount: number, durationAnimation: number): void {
      throw new Error("Function not implemented.");
    },
    changeDamage: function (amount: number, durationAnimation: number): void {
      throw new Error("Function not implemented.");
    }
  }

  cardUnitExample: Card = {
    id: "",
    serverId: "31",
    name: "Unidad",
    canPlay: true,
    type: "Unit",
    imageUrl: "example",
    description: "Este es un ejemplo de carta de unidad.",
    attack: 3,
    health: 3,
    changeHealth: function (amount: number, durationAnimation: number): void {
      throw new Error("Function not implemented.");
    },
    changeDamage: function (amount: number, durationAnimation: number): void {
      throw new Error("Function not implemented.");
    }
  }

    videos: HelpVideo[] = [
      { source: "/video/play_unit.webm", title: "Jugar una unidad"},
      { source: "/video/use_ability.webm", title: "Usar habilidad"},
      { source: "/video/play_spell.webm", title: "Jugar hechizo"},
      { source: "/video/attack_unit.webm", title: "Atacar"},
      { source: "/video/draw_card.webm", title: "Robar carta"},
      { source: "/video/attack_rival_health.webm", title: "Atacar vida del rival"},
      { source: "/video/inspect_card.webm", title: "Inspeccionar carta"},
    ]
    isOpen: boolean = false;
      open(): void {
    this.isOpen = true;
  }

  playVideo(event: MouseEvent)
  {
    const video = (event.target as HTMLVideoElement); 
    video.play();
    video.classList.remove('gray');
  }

  stopVideo(event: MouseEvent)
  {
    const video = (event.target as HTMLVideoElement); 
    video.pause();
    video.classList.add('gray');
  }

  /**
   * Close the settings panel
   */
  close(): void {
    this.isOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen) {
      this.close();
    }
  }
 }