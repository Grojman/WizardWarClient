import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-message-dialog',
  templateUrl: './message-dialog.component.html',
  styleUrls: ['./message-dialog.component.css'],
  standalone: false,
})
export class MessageDialogComponent {

  message = "";

  @ViewChild('messageinput')
  input!: ElementRef<HTMLInputElement>;

  @Output()
  messageSent =
    new EventEmitter<string>();

  send() {

    if (!this.message.trim()) return;

    this.messageSent.emit(this.message);
    this.message = "";
  }

  focus()
  {
    this.input.nativeElement.focus();
  }

}