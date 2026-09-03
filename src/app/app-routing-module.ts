import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { GameComponent } from './pages/game/game.component';
import { ErrorComponent } from './pages/error/error.component';
import { GalleryComponent } from './pages/gallery/gallery.component';
import { StatsComponent } from './pages/stats/stats.component';
import { SeriesComponent } from './pages/series/series.component';
import { TeamComponent } from './pages/team/team.component';
import { gameAccessGuard } from './core/guards/game-access.guard';
import { matchLockGuard } from './core/guards/match-lock.guard';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'game', component: GameComponent, canActivate: [gameAccessGuard] },
  { path: 'error', component: ErrorComponent },
  { path: 'gallery', component: GalleryComponent, canActivate: [matchLockGuard] },
  { path: 'stats', component: StatsComponent, canActivate: [matchLockGuard] },
  { path: 'series', component: SeriesComponent, canActivate: [matchLockGuard] },
  { path: 'team', component: TeamComponent, canActivate: [matchLockGuard] },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
