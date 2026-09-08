import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { GameComponent } from './pages/game/game.component';
import { ErrorComponent } from './pages/error/error.component';
import { GalleryComponent } from './pages/gallery/gallery.component';
import { StatsComponent } from './pages/stats/stats.component';
import { SeriesComponent } from './pages/series/series.component';
import { TeamComponent } from './pages/team/team.component';
import { PrivacyComponent } from './pages/privacy/privacy.component';
import { gameAccessGuard } from './core/guards/game-access.guard';
import { matchLockGuard } from './core/guards/match-lock.guard';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    title: 'El Bar de los Magos — Juego de cartas online gratis, sin registro',
    data: {
      titleKey: 'TITLE_HOME',
      description:
        'Juega gratis online a El Bar de los Magos, un juego de cartas por turnos de magos y hechizos. Sin descargas ni registro: crea tu partida y juega ya.',
    },
  },
  {
    path: 'game',
    component: GameComponent,
    canActivate: [gameAccessGuard],
    title: 'Partida en curso — El Bar de los Magos',
    data: { titleKey: 'TITLE_GAME', robots: 'noindex, follow' },
  },
  {
    path: 'error',
    component: ErrorComponent,
    title: 'Error de conexión — El Bar de los Magos',
    data: { titleKey: 'TITLE_ERROR', robots: 'noindex, follow' },
  },
  {
    path: 'gallery',
    component: GalleryComponent,
    canActivate: [matchLockGuard],
    title: 'Galería de cartas — El Bar de los Magos',
    data: {
      titleKey: 'TITLE_GALLERY',
      description:
        'Explora todas las cartas de unidades y hechizos de El Bar de los Magos: arte, efectos y estadísticas de cada carta.',
    },
  },
  {
    path: 'stats',
    component: StatsComponent,
    canActivate: [matchLockGuard],
    title: 'Estadísticas de mazos — El Bar de los Magos',
    data: {
      titleKey: 'TITLE_STATS',
      description:
        'Consulta victorias, derrotas y enfrentamientos entre mazos de El Bar de los Magos.',
    },
  },
  {
    path: 'series',
    component: SeriesComponent,
    canActivate: [matchLockGuard],
    title: 'Serie al mejor de 3 — El Bar de los Magos',
    data: { titleKey: 'TITLE_SERIES', robots: 'noindex, follow' },
  },
  {
    path: 'team',
    component: TeamComponent,
    canActivate: [matchLockGuard],
    title: 'Equipo — El Bar de los Magos',
    data: {
      titleKey: 'TITLE_TEAM',
      description: 'Conoce al equipo y colaboradores detrás de El Bar de los Magos.',
    },
  },
  {
    path: 'privacy',
    component: PrivacyComponent,
    title: 'Política de privacidad — El Bar de los Magos',
    data: {
      titleKey: 'TITLE_PRIVACY',
      description:
        'Cómo El Bar de los Magos trata tus datos: almacenamiento local, cookies y publicidad.',
    },
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
