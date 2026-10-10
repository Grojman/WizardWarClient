import { Component, signal } from '@angular/core';
import { WebsocketService } from './core/services/websocket.service';
import { LanguageSettingsService } from './core/services/language.service';
import { SeoService } from './core/services/seo.service';
import { FontSettingsService } from './core/services/font-settings.service';
import { CursorSettingsService } from './core/services/cursor-settings.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('wizard-war-client');

  constructor(
    private ws: WebsocketService,
    private languageService: LanguageSettingsService,
    private seo: SeoService,
    // Injected only so the saved font scales are applied from the first page.
    private fontSettings: FontSettingsService,
    // Same for the saved custom cursor.
    private cursorSettings: CursorSettingsService,
  )
  {
    this.ws.connect();
    this.languageService.sendCurrentLanguage();

    this.seo.init();
    this.seo.setLanguage(this.languageService.getLanguage());
    this.languageService.language$.subscribe((code) => this.seo.setLanguage(code));
  }
}
