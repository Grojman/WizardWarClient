import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-message-dialog',
  templateUrl: './message-dialog.component.html',
  styleUrls: ['./message-dialog.component.css'],
  standalone: false,
})
export class MessageDialogComponent {

  visible = false;

  message = "";

  @Output()
  messageSent =
    new EventEmitter<string>();

  open() {

    this.visible = true;

    setTimeout(() => {

      const input =
        document.querySelector(
          ".dialog-panel input"
        ) as HTMLInputElement;

      input?.focus();

    });

  }

  close() {

    this.visible = false;

    this.message = "";

  }

  send() {

    if (!this.message.trim()) return;

    this.messageSent.emit(this.message);

    this.close();

  }

}