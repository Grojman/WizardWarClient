import {
  NgModule,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
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
import { CardvisualizerComponent } from './shared/components/cardvisualizer/cardvisualizer.component';
import { MessageDialogComponent } from './ui/message-dialog/message-dialog.component';
import { PlayerComponent } from './shared/components/player/player.component';
import { TargetPlayerComponent } from './shared/components/target-player/target-player.component';
import { ChatComponent } from './shared/components/chat/chat.component';
import { GameCardCheckComponent } from './shared/components/game-card-check/game-card-check.component';

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
    CardvisualizerComponent,
    MessageDialogComponent,
    PlayerComponent,
    TargetPlayerComponent,
    ChatComponent,
    GameCardCheckComponent,
  ],
  imports: [BrowserModule, AppRoutingModule, FormsModule],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
  ],
  bootstrap: [App],
})
export class AppModule {}
