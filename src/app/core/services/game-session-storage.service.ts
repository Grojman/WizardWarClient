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
}
