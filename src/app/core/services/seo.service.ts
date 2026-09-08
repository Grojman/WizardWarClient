import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TranslationService } from './translation.service';

// Placeholder until the site has a real domain — update SITE_URL (and the
// canonical/OG URLs it feeds) before going live.
const SITE_URL = 'https://game.wizardbar.es';
const DEFAULT_DESCRIPTION =
  'El Bar de los Magos: juego de cartas online gratis, sin registro. Enfréntate a otros magos en partidas por turnos.';
const DEFAULT_IMAGE = `${SITE_URL}/images/home/logo.webp`;

// Keeps <title>, meta description/robots and Open Graph/Twitter tags in sync
// with the active route's `title`/`data.description`/`data.robots` (set in
// app-routing-module.ts), since this is a client-rendered SPA with no
// per-route server response to carry that metadata otherwise.
@Injectable({
  providedIn: 'root',
})
export class SeoService {
  // Route `title` (app-routing-module.ts) only ever supplies the Spanish
  // default the router's built-in TitleStrategy applies on activation - it
  // has already run by the time our NavigationEnd handler below fires, so
  // `title.getTitle()` reflects it. `titleKey` (route `data`) is what lets
  // us override that default with the current language's translation, both
  // right after navigation and whenever the dictionary is (re)loaded, since
  // it arrives asynchronously over the websocket.
  private currentTitleKey?: string;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private title: Title,
    private meta: Meta,
    private translation: TranslationService,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  init(): void {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) =>
        this.applyMetadata(this.deepestSnapshot(this.activatedRoute.snapshot), event.urlAfterRedirects),
      );

    this.applyMetadata(this.deepestSnapshot(this.activatedRoute.snapshot), this.router.url);

    this.translation.updated$.subscribe(() => this.applyTranslatedTitle());
  }

  setLanguage(code: string): void {
    this.document.documentElement.lang = code;
  }

  private deepestSnapshot(snapshot: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    while (snapshot.firstChild) {
      snapshot = snapshot.firstChild;
    }
    return snapshot;
  }

  private applyMetadata(snapshot: ActivatedRouteSnapshot, url: string): void {
    this.currentTitleKey = snapshot.data['titleKey'];
    this.applyTranslatedTitle();

    const description: string = snapshot.data['description'] ?? DEFAULT_DESCRIPTION;
    const robots: string = snapshot.data['robots'] ?? 'index, follow';
    const pageTitle = this.title.getTitle();
    const path = url.split('?')[0].split('#')[0];
    const canonicalUrl = `${SITE_URL}${path}`;

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'robots', content: robots });

    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
    this.meta.updateTag({ property: 'og:image', content: DEFAULT_IMAGE });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: DEFAULT_IMAGE });

    this.updateCanonicalLink(canonicalUrl);
  }

  // Falls back to the router's static default (still whatever
  // `this.title.getTitle()` currently holds) until the translation
  // dictionary has a real value for the key - avoids flashing the raw key
  // as the tab title before the websocket delivers translations.
  private applyTranslatedTitle(): void {
    if (!this.currentTitleKey) return;

    const translated = this.translation.translate(this.currentTitleKey);
    if (translated && translated !== this.currentTitleKey) {
      this.title.setTitle(translated);
    }
  }

  private updateCanonicalLink(url: string): void {
    let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
