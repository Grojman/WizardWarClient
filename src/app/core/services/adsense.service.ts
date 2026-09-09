import { Injectable } from '@angular/core';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

// AdSense publisher ID, from the loader snippet Google gives you under
// Ads > Overview > Get more out of AdSense / Site ads. Not the ad-unit ID.
const CLIENT_ID = 'ca-pub-3398929424355284';
const LOADER_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT_ID}`;

// The loader script is injected on demand rather than sitting in index.html,
// so it only ever reaches the browser once a visitor has actually opted in
// to seeing ads (see HomeComponent.revealAd / ConsentService) instead of
// loading for every visitor regardless of consent.
@Injectable({
  providedIn: 'root',
})
export class AdsenseService {
  readonly clientId = CLIENT_ID;

  private loadPromise?: Promise<void>;

  loadScript(): Promise<void> {
    if (!this.loadPromise) {
      this.loadPromise = new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src^="${LOADER_SRC}"]`);
        if (existing) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.async = true;
        script.src = LOADER_SRC;
        script.crossOrigin = 'anonymous';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load AdSense script'));
        document.head.appendChild(script);
      });
    }
    return this.loadPromise;
  }

  // Call once per <ins class="adsbygoogle"> element after it's in the DOM.
  requestAd(): void {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // adsbygoogle not ready yet / blocked by an ad blocker — nothing to
      // recover here, the <ins> slot just stays empty.
    }
  }
}
