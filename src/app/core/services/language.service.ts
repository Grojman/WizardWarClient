import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { languageConfig } from '../config/language-config';
import { WebsocketService } from './websocket.service';

@Injectable({
  providedIn: 'root',
})
export class LanguageSettingsService {
  private languageSubject = new BehaviorSubject<string>(languageConfig.getLanguage());
  language$: Observable<string> = this.languageSubject.asObservable();

  constructor(private ws: WebsocketService) {}

  getLanguage(): string {
    return languageConfig.getLanguage();
  }

  setLanguage(code: string): void {
    languageConfig.setLanguage(code);
    this.languageSubject.next(code);
    this.sendCurrentLanguage();
  }

  sendCurrentLanguage(): void {
    this.ws.send({
      '$type': 'ChangeLanguageAction',
      'Language': this.getLanguage(),
    });
  }
}
