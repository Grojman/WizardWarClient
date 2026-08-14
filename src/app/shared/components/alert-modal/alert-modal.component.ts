import { Component, EventEmitter, HostListener, Output } from "@angular/core";

@Component({
  selector: 'app-alert-modal',
  standalone: false,
  templateUrl: './alert-modal.component.html',
  styleUrl: './alert-modal.component.css',
})
export class AlertModalComponent
{
  isOpen: boolean = false;
  message: string = '';

  @Output()
  closed: EventEmitter<void> = new EventEmitter();

  open(message: string): void {
    this.message = message;
    this.isOpen = true;
  }

  close(): void {
    this.isOpen = false;
    this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen) {
      this.close();
    }
  }
}
