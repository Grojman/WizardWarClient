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

  private hideSuggestionsTimeoutId: ReturnType<typeof setTimeout> | null = null;

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
    if (this.input.nativeElement == document.activeElement) return;
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
    this.cancelHideSuggestions();
    this.message = `:${r.id}:`;
    this.reactionSuggestions = [];
    this.focus();
    this.send();
  }

  hideSuggestionsDelayed()
  {
    this.cancelHideSuggestions();
    this.hideSuggestionsTimeoutId = setTimeout(() => this.reactionSuggestions = [], 150);
  }

  showSuggestions()
  {
    // A blur on the message input (e.g. from clicking this very button) schedules
    // hideSuggestionsDelayed() just before this runs; without cancelling it, that
    // timeout fires ~150ms later and wipes the list we're about to show.
    this.cancelHideSuggestions();
    this.focus();
    this.reactionSuggestions = REACTIONS;
  }

  private cancelHideSuggestions()
  {
    if (this.hideSuggestionsTimeoutId !== null) {
      clearTimeout(this.hideSuggestionsTimeoutId);
      this.hideSuggestionsTimeoutId = null;
    }
  }

}