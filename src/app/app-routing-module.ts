import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { GameComponent } from './pages/game/game.component';
import { ErrorComponent } from './pages/error/error.component';
import { GalleryComponent } from './pages/gallery/gallery.component';
import { StatsComponent } from './pages/stats/stats.component';
import { SeriesComponent } from './pages/series/series.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'game', component: GameComponent },
  { path: 'error', component: ErrorComponent },
  { path: 'gallery', component: GalleryComponent },
  { path: 'stats', component: StatsComponent },
  { path: 'series', component: SeriesComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
