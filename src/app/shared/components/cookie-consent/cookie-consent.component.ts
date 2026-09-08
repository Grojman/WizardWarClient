import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ConsentService } from '../../../core/services/consent.service';
import { LanguageSettingsService } from '../../../core/services/language.service';

interface ConsentText {
  message: string;
  reject: string;
  accept: string;
  policyLink: string;
}

// Static, self-contained strings (not routed through the server-fed
// TranslationService/`translate` pipe) because this banner has to render
// correctly on first paint, before any websocket round-trip can populate
// that dictionary, and it carries legally load-bearing text.
const TEXT: Record<string, ConsentText> = {
  es: {
    message:
      'Usamos almacenamiento local para que el juego funcione y, si nos das tu consentimiento, para mostrar anuncios. Puedes cambiar de opinión cuando quieras.',
    reject: 'Rechazar',
    accept: 'Aceptar',
    policyLink: 'Política de privacidad',
  },
  en: {
    message:
      "We use local storage to make the game work and, if you consent, to show ads. You can change your mind at any time.",
    reject: 'Reject',
    accept: 'Accept',
    policyLink: 'Privacy policy',
  },
};

@Component({
  selector: 'app-cookie-consent',
  standalone: false,
  templateUrl: './cookie-consent.component.html',
  styleUrl: './cookie-consent.component.css',
})
export class CookieConsentComponent implements OnInit, OnDestroy {
  visible = false;
  text: ConsentText = TEXT['es'];

  private sub?: Subscription;

  constructor(
    private consent: ConsentService,
    private languageService: LanguageSettingsService,
  ) {}

  ngOnInit(): void {
    this.visible = this.consent.getChoice() === null;

    this.updateText(this.languageService.getLanguage());
    this.sub = this.languageService.language$.subscribe((code) => this.updateText(code));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  accept(): void {
    this.consent.accept();
    this.visible = false;
  }

  reject(): void {
    this.consent.reject();
    this.visible = false;
  }

  private updateText(code: string): void {
    this.text = TEXT[code] ?? TEXT['es'];
  }
}
