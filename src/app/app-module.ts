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
  ],
  imports: [BrowserModule, AppRoutingModule, FormsModule],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
  ],
  bootstrap: [App],
})
export class AppModule {}
