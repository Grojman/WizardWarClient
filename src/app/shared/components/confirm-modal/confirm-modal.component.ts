import { Component, EventEmitter, HostListener, Input, Output } from "@angular/core";

// Yes/no counterpart of AlertModalComponent: texts are translation keys, and
// `confirmed` only fires when the user explicitly accepts.
@Component({
  selector: 'app-confirm-modal',
  standalone: false,
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.css',
})
export class ConfirmModalComponent
{
  isOpen: boolean = false;

  @Input()
  titleKey: string = '';

  @Input()
  messageKey: string = '';

  @Input()
  confirmKey: string = 'CONFIRM_SECTION_ACCEPT';

  @Input()
  cancelKey: string = 'CONFIRM_SECTION_CANCEL';

  @Output()
  confirmed: EventEmitter<void> = new EventEmitter();

  open(): void {
    this.isOpen = true;
  }

  close(): void {
    this.isOpen = false;
  }

  confirm(): void {
    this.isOpen = false;
    this.confirmed.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen) {
      this.close();
    }
  }
}
