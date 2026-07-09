import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
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

chatRef!: ElementRef<HTMLDivElement>;

@ViewChild('chatref') set c(c: ElementRef)
{
  if (c)
  {
    this.chatRef = c;
    this.scrollTop();
  }
}

  isOpen = false;

  messages: Message[] = [];
  addMessage(m: Message)
  {
    this.messages.push(m);

    this.scrollTop();

    
  }
  
  scrollTop()
  {
    requestAnimationFrame(() => {
      this.chatRef.nativeElement.scrollTop = this.chatRef.nativeElement.scrollHeight;
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
