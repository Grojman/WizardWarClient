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
    name: "HELP_CARD_EXAMPLE_ABILITY_NAME",
    hasEffect: true,
    canPlay: true,
    imageUrl: "example",
    effectTimes: 1,
    description: "",
    changeHealth: function (amount: number): void {
      throw new Error("Function not implemented.");
    },
    changeDamage: function (amount: number): void {
      throw new Error("Function not implemented.");
    }
  }

  cardSpellExample: Card = {
    id: "",
    serverId: "",
    name: "HELP_CARD_EXAMPLE_SPELL_NAME",
    type: "Spell",
    canPlay: true,
    imageUrl: "example",
    description: "HELP_CARD_EXAMPLE_SPELL_DESC",
    changeHealth: function (amount: number): void {
      throw new Error("Function not implemented.");
    },
    changeDamage: function (amount: number): void {
      throw new Error("Function not implemented.");
    }
  }

  cardUnitExample: Card = {
    id: "",
    serverId: "31",
    name: "HELP_CARD_EXAMPLE_UNIT_NAME",
    canPlay: true,
    type: "Unit",
    imageUrl: "example",
    description: "HELP_CARD_EXAMPLE_UNIT_DESC",
    attack: 3,
    health: 3,
    changeHealth: function (amount: number): void {
      throw new Error("Function not implemented.");
    },
    changeDamage: function (amount: number): void {
      throw new Error("Function not implemented.");
    }
  }

    videos: HelpVideo[] = [
      { source: "/video/play_unit.webm", title: "HELP_VIDEO_PLAY_UNIT"},
      { source: "/video/use_ability.webm", title: "HELP_VIDEO_USE_ABILITY"},
      { source: "/video/play_spell.webm", title: "HELP_VIDEO_PLAY_SPELL"},
      { source: "/video/attack_unit.webm", title: "HELP_VIDEO_ATTACK"},
      { source: "/video/draw_card.webm", title: "HELP_VIDEO_DRAW_CARD"},
      { source: "/video/attack_rival_health.webm", title: "HELP_VIDEO_ATTACK_RIVAL_HEALTH"},
      { source: "/video/inspect_card.webm", title: "HELP_VIDEO_INSPECT_CARD"},
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