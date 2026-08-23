import { Component, EventEmitter, HostListener, Output } from "@angular/core";

@Component({
  selector: 'app-private-match-modal',
  standalone: false,
  templateUrl: './private-match-modal.component.html',
  styleUrl: './private-match-modal.component.css',
})
export class PrivateMatchModalComponent
{
  isOpen: boolean = false;
  code: string = '';
  current: number = 0;
  total: number = 0;
  isHost: boolean = false;
  copied: boolean = false;

  @Output()
  cancelled: EventEmitter<void> = new EventEmitter();

  open(code: string, current: number, total: number, isHost: boolean): void {
    this.code = code;
    this.current = current;
    this.total = total;
    this.isHost = isHost;
    this.copied = false;
    this.isOpen = true;
  }

  close(): void {
    this.isOpen = false;
  }

  cancel(): void {
    this.cancelled.emit();
    this.close();
  }

  copyCode(): void {
    navigator.clipboard?.writeText(this.code).then(() => {
      this.copied = true;
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen) {
      this.cancel();
    }
  }
}
