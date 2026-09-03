import { Injectable } from '@angular/core';

const ACTIVE_GAME_STORAGE_KEY = 'ww_active_game';

@Injectable({
  providedIn: 'root',
})
export class GameSessionStorageService {
  markActive(): void {
    localStorage.setItem(ACTIVE_GAME_STORAGE_KEY, '1');
  }

  markInactive(): void {
    localStorage.removeItem(ACTIVE_GAME_STORAGE_KEY);
  }

  isActive(): boolean {
    return localStorage.getItem(ACTIVE_GAME_STORAGE_KEY) === '1';
  }

  // In-memory only (doesn't need to survive a reload): lets HomeComponent
  // tell GameComponent "the socket is already open, but this is a
  // continuation of an existing match, not a brand-new one about to deal a
  // hand" — the one case the open-socket heuristic in GameComponent.ngOnInit
  // can't distinguish on its own, since a freshly-started match also
  // navigates to /game over an already-open socket.
  private resumingFromHome = false;

  markResumingFromHome(): void {
    this.resumingFromHome = true;
  }

  consumeResumingFromHome(): boolean {
    const value = this.resumingFromHome;
    this.resumingFromHome = false;
    return value;
  }
}
