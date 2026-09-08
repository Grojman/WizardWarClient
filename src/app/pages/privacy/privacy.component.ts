import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ConsentService, ConsentChoice } from '../../core/services/consent.service';
import { LanguageSettingsService } from '../../core/services/language.service';
import { PRIVACY_CONTENT, PrivacyContent } from './privacy-content';

@Component({
  selector: 'app-privacy',
  standalone: false,
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.css',
})
export class PrivacyComponent implements OnInit, OnDestroy {
  content: PrivacyContent = PRIVACY_CONTENT['es'];
  choice: ConsentChoice | null = null;

  private langSub?: Subscription;
  private consentSub?: Subscription;

  constructor(
    private languageService: LanguageSettingsService,
    private consent: ConsentService,
  ) {}

  ngOnInit(): void {
    this.updateContent(this.languageService.getLanguage());
    this.langSub = this.languageService.language$.subscribe((code) => this.updateContent(code));
    this.consentSub = this.consent.choice$.subscribe((choice) => (this.choice = choice));
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
    this.consentSub?.unsubscribe();
  }

  accept(): void {
    this.consent.accept();
  }

  reject(): void {
    this.consent.reject();
  }

  private updateContent(code: string): void {
    this.content = PRIVACY_CONTENT[code] ?? PRIVACY_CONTENT['es'];
  }
}
