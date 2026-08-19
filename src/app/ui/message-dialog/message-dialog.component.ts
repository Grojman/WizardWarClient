import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Reaction, REACTIONS } from '../../shared/reactions';

@Component({
  selector: 'app-message-dialog',
  templateUrl: './message-dialog.component.html',
  styleUrls: ['./message-dialog.component.css'],
  standalone: false,
})
export class MessageDialogComponent {

  message = "";

  reactionSuggestions: Reaction[] = [];

  @ViewChild('messageinput')
  input!: ElementRef<HTMLInputElement>;

  @Output()
  messageSent =
    new EventEmitter<string>();

  send() {

    if (!this.message.trim()) return;

    this.messageSent.emit(this.message);
    this.message = "";
    this.reactionSuggestions = [];
  }

  focus()
  {
    this.input.nativeElement.focus();
  }

  onMessageChange()
  {
    const match = /^:([a-zA-Z0-9_-]*)$/.exec(this.message);

    if (!match) {
      this.reactionSuggestions = [];
      return;
    }

    const typed = match[1].toLowerCase();
    this.reactionSuggestions = REACTIONS.filter((r) => r.id.toLowerCase().startsWith(typed));
  }

  selectReaction(r: Reaction)
  {
    this.message = `:${r.id}:`;
    this.reactionSuggestions = [];
    this.focus();
    this.send();
  }

  hideSuggestionsDelayed()
  {
    setTimeout(() => this.reactionSuggestions = [], 150);
  }

  showSuggestions()
  {
    this.reactionSuggestions = REACTIONS;
  }

}