import { Component, OnInit } from "@angular/core";

@Component({
  selector: 'app-help',
  standalone: false,
  templateUrl: './help.component.html',
  styleUrl: './help.component.css',
})
export class HelpComponent
 {
    isOpen: boolean = false;
      open(): void {
    this.isOpen = true;
  }

  /**
   * Close the settings panel
   */
  close(): void {
    this.isOpen = false;
  }
 }