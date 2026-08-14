import { Component, HostListener, OnInit } from "@angular/core";
import { HelpVideo } from "../../../models/help.video.model"
@Component({
  selector: 'app-help',
  standalone: false,
  templateUrl: './help.component.html',
  styleUrl: './help.component.css',
})
export class HelpComponent
 {
    videos: HelpVideo[] = [
      { source: "/video/play_unit.webm", title: "Jugar una unidad"},
      { source: "/video/use_ability.webm", title: "Usar habilidad"},
      { source: "/video/play_spell.webm", title: "Jugar hechizo"},
      { source: "/video/attack_unit.webm", title: "Atacar"},
      { source: "/video/draw_card.webm", title: "Robar carta"},
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