import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ConsentChoice = 'accepted' | 'rejected';

const STORAGE_KEY = 'wizardwar_cookie_consent';
const STORAGE_DATE_KEY = 'wizardwar_cookie_consent_date';

// Re-prompt after this many days, in case the user wants to revisit the
// choice or the policy has meaningfully changed since (e.g. ads went live).
const RE_PROMPT_AFTER_DAYS = 180;

// Tracks whether the visitor has accepted or rejected non-essential storage
// (analytics/advertising, e.g. future Google AdSense cookies). Strictly
// necessary storage (websocket reconnect id, active-match flag, language and
// in-game preferences) is unaffected by this choice and keeps working either
// way — see GameSessionStorageService, WebsocketService, LanguageConfig,
// AudioConfig, AnimationConfig.
@Injectable({
  providedIn: 'root',
})
export class ConsentService {
  private choiceSubject = new BehaviorSubject<ConsentChoice | null>(this.loadChoice());
  choice$ = this.choiceSubject.asObservable();

  getChoice(): ConsentChoice | null {
    return this.choiceSubject.value;
  }

  hasNonEssentialConsent(): boolean {
    return this.choiceSubject.value === 'accepted';
  }

  accept(): void {
    this.setChoice('accepted');
  }

  reject(): void {
    this.setChoice('rejected');
  }

  private setChoice(choice: ConsentChoice): void {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
      localStorage.setItem(STORAGE_DATE_KEY, Date.now().toString());
    } catch {
      // localStorage unavailable (private mode / disabled) — the choice
      // still applies for this page load via the in-memory subject below.
    }
    this.choiceSubject.next(choice);
  }

  private loadChoice(): ConsentChoice | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const savedDate = Number(localStorage.getItem(STORAGE_DATE_KEY) ?? 0);
      const ageDays = (Date.now() - savedDate) / (1000 * 60 * 60 * 24);

      if ((saved === 'accepted' || saved === 'rejected') && ageDays < RE_PROMPT_AFTER_DAYS) {
        return saved;
      }
    } catch {
      // localStorage unavailable — treat as undecided, banner will show.
    }
    return null;
  }
}
