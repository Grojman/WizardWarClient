import {
  NgModule,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  isDevMode,
} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { HomeComponent } from './pages/home/home.component';
import { CardComponent } from './shared/components/card/card.component';
import { DeckComponent } from './shared/components/deck/deck.component';
import { GameComponent } from './pages/game/game.component';
import { ErrorComponent } from './pages/error/error.component';
import { DockComponent } from './shared/components/dock/dock.component';
import { HealthComponent } from './shared/components/health/health.component';
import { GalleryComponent } from './pages/gallery/gallery.component';
import { StatsComponent } from './pages/stats/stats.component';
import { CardvisualizerComponent } from './shared/components/cardvisualizer/cardvisualizer.component';
import { MessageDialogComponent } from './ui/message-dialog/message-dialog.component';
import { PlayerComponent } from './shared/components/player/player.component';
import { TurnWavesComponent } from './shared/components/turn-waves/turn-waves.component';
import { ChatComponent } from './shared/components/chat/chat.component';
import { GameCardCheckComponent } from './shared/components/game-card-check/game-card-check.component';
import { SettingsComponent } from './shared/components/settings/settings.component';
import { HelpComponent } from './shared/components/help/help.component';
import { AlertModalComponent } from './shared/components/alert-modal/alert-modal.component';
import { PrivateMatchModalComponent } from './shared/components/private-match-modal/private-match-modal.component';
import { TeamComponent } from './pages/team/team.component';
import { SeriesComponent } from './pages/series/series.component';
import { PrivacyComponent } from './pages/privacy/privacy.component';
import { CookieConsentComponent } from './shared/components/cookie-consent/cookie-consent.component';
import { TranslatePipe } from './shared/pipes/translate.pipe';
import { ServiceWorkerModule } from '@angular/service-worker';

@NgModule({
  declarations: [
    App,
    HomeComponent,
    CardComponent,
    DeckComponent,
    DockComponent,
    GameComponent,
    ErrorComponent,
    HealthComponent,
    GalleryComponent,
    StatsComponent,
    SettingsComponent,
    CardvisualizerComponent,
    MessageDialogComponent,
    PlayerComponent,
    TurnWavesComponent,
    ChatComponent,
    GameCardCheckComponent,
    HelpComponent,
    AlertModalComponent,
    PrivateMatchModalComponent,
    TeamComponent,
    SeriesComponent,
    PrivacyComponent,
    CookieConsentComponent,
    TranslatePipe,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
  ],
  bootstrap: [App],
})
export class AppModule {}
