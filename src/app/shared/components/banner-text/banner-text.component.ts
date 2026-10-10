import { Component, HostListener, OnDestroy } from '@angular/core';

export type BannerVariant = 'mine' | 'rival' | 'info';

export interface BannerOptions {
  subtitle?: string;
  variant?: BannerVariant;
  // How long (ms) the banner stays before hiding on its own. Ignored when
  // waitForClick is set.
  duration?: number;
  // Keeps the banner up until the player clicks (or presses Enter/Space),
  // with a "continue" hint underneath. Used by the tutorial's narration.
  waitForClick?: boolean;
  continueHint?: string;
}

// Must match the .leaving animation duration in the stylesheet.
const LEAVE_MS = 350;
const DEFAULT_DURATION_MS = 1600;

/**
 * Big centered ribbon of text drawn over the table, Legends of Runeterra
 * style: the game shows "your turn" with it, and the tutorial narrates with
 * it. show() resolves once the banner has fully left the screen, so callers
 * can await it before moving on.
 */
@Component({
  selector: 'app-banner-text',
  standalone: false,
  templateUrl: './banner-text.component.html',
  styleUrl: './banner-text.component.css',
})
export class BannerTextComponent implements OnDestroy {
  text = '';
  subtitle = '';
  continueHint = '';
  variant: BannerVariant = 'info';
  waitForClick = false;

  visible = false;
  leaving = false;
  // Bumped on every show() so *ngIf remounts the ribbon and its enter
  // animation replays even if a banner was already up.
  showId = 0;

  private hideTimer?: ReturnType<typeof setTimeout>;
  private leaveTimer?: ReturnType<typeof setTimeout>;
  private resolveCurrent?: () => void;

  show(text: string, options: BannerOptions = {}): Promise<void> {
    this.finish();

    this.text = text;
    this.subtitle = options.subtitle ?? '';
    this.variant = options.variant ?? 'info';
    this.waitForClick = !!options.waitForClick;
    this.continueHint = options.continueHint ?? '';
    this.visible = true;
    this.leaving = false;
    this.showId++;

    if (!this.waitForClick) {
      this.hideTimer = setTimeout(() => this.hide(), options.duration ?? DEFAULT_DURATION_MS);
    }

    return new Promise((resolve) => (this.resolveCurrent = resolve));
  }

  hide(): void {
    if (!this.visible || this.leaving) return;

    clearTimeout(this.hideTimer);
    this.leaving = true;
    this.leaveTimer = setTimeout(() => this.finish(), LEAVE_MS);
  }

  onClick(): void {
    if (this.waitForClick) {
      this.hide();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.visible || !this.waitForClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.hide();
    }
  }

  ngOnDestroy(): void {
    this.finish();
  }

  private finish(): void {
    clearTimeout(this.hideTimer);
    clearTimeout(this.leaveTimer);
    this.visible = false;
    this.leaving = false;

    const resolve = this.resolveCurrent;
    this.resolveCurrent = undefined;
    resolve?.();
  }
}
