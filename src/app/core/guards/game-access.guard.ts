import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GameSessionStorageService } from '../services/game-session-storage.service';

export const gameAccessGuard: CanActivateFn = () => {
  const gameSessionStorage = inject(GameSessionStorageService);
  const router = inject(Router);

  if (gameSessionStorage.isActive()) {
    return true;
  }

  return router.parseUrl('/');
};
