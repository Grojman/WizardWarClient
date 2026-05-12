import { Component } from '@angular/core';
import { Message } from '../../../models/message.model';

@Component({
  selector: 'app-chat',
  standalone: false,
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent {
  isOpen = false;

  messages: Message[] = [];

  addMessage(m: Message)
  {
    this.messages.push(m);
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
}
