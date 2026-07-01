import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { Message } from '../../../models/message.model';
import { MessageDialogComponent } from '../../../ui/message-dialog/message-dialog.component';

@Component({
  selector: 'app-chat',
  standalone: false,
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent {

  @Output()
  onMessageSent: EventEmitter<string> = new EventEmitter();

  @ViewChild(MessageDialogComponent)
  set dialog(value: MessageDialogComponent | undefined) {

    if (value) {
      value.focus();
    }
  }

  isOpen = false;

  messages: Message[] = [];
  chat: HTMLElement | null = null;
  addMessage(m: Message)
  {
    this.messages.push(m);

    if(!this.chat)
    {
      this.chat = document.querySelector('.chat-messages');
    }


    requestAnimationFrame(() => {
      this.chat!!.scrollTop = this.chat!!.scrollHeight;
    });

  }

  open()
  {
    this.isOpen = true;
  }

  close()
  {
    this.isOpen = false;
  }

  isReaction(text: string): boolean {

  return /^:[a-zA-Z0-9_-]+:$/.test(text);

}

getReactionName(text: string): string {

  return text.replace(/:/g, '');

}

getReactionPath(text: string): string {

  const name = this.getReactionName(text);

  return `/images/reactions/${name}.${(name.startsWith('0') ? 'gif' : 'jpg')}`;

}

messageSent(m: string)
{
  this.onMessageSent.emit(m);
}
}
