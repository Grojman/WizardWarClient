import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GameSessionStorageService } from '../services/game-session-storage.service';

// Blocks navigating to unrelated pages (gallery, stats, team, series) while
// the client still has an unfinished match (see GameSessionStorageService) —
// otherwise a player could type one of those URLs directly and reach a page
// that sends lobby-only messages while the server still has them inside a
// GameSession, which the server can't make sense of. Home is always left
// reachable: it's where the player is offered to continue or cancel that
// match, and /game itself keeps its own gameAccessGuard.
export const matchLockGuard: CanActivateFn = () => {
  const gameSessionStorage = inject(GameSessionStorageService);
  const router = inject(Router);

  if (gameSessionStorage.isActive()) {
    return router.parseUrl('/');
  }

  return true;
};
