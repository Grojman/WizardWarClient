import { Component, signal } from '@angular/core';
import { WebsocketService } from './core/services/websocket.service';
import { LanguageSettingsService } from './core/services/language.service';
import { SeoService } from './core/services/seo.service';


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
  )
  {
    this.ws.connect();
    this.languageService.sendCurrentLanguage();

    this.seo.init();
    this.seo.setLanguage(this.languageService.getLanguage());
    this.languageService.language$.subscribe((code) => this.seo.setLanguage(code));
  }
}
