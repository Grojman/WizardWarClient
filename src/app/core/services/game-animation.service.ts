import { Injectable } from '@angular/core';
import { AnimationSettingsService } from './animation-settings.service';
import { AudioService } from './audio.service';

@Injectable({
  providedIn: 'root',
})
export class GameAnimationService {
  constructor(private animationSettingsService: AnimationSettingsService,
    private audioService: AudioService
  ) {}

  private getAnimationLayer(): HTMLElement | null {
    return document.querySelector('.animation-layer') as HTMLElement | null;
  }

  nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }

  getCenter(element: HTMLElement): { x: number; y: number } {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }

  async animateAttack(
    attackerElement: HTMLElement,
    targetElement: HTMLElement,
    targetPlayer: { Health: { changeHealth: (amount: number, duration: number) => void } },
    targetIndex: number,
    targetType: 'BOARD' | 'PLAYER',
    attackerDamage: number,
    defenderDamage: number,
    attackerPlayer: { Board: Array<{ id: string; changeHealth: (amount: number, duration: number) => void } | null> },
    attackerId: string,
  ): Promise<void> {
    attackerElement.style.transformOrigin = '50% 100%';
    targetElement.style.transformOrigin = '50% 100%';
    attackerElement.style.willChange = 'transform, filter';
    targetElement.style.willChange = 'transform, filter';

    const attackerRect = attackerElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    const attackerCenterX = attackerRect.left + attackerRect.width / 2;
    const attackerCenterY = attackerRect.top + attackerRect.height / 2;
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;
    const dx = targetCenterX - attackerCenterX;
    const dy = targetCenterY - attackerCenterY;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const swingAngle = Math.max(-34, Math.min(34, angle * 0.14));
    const lift = dy > 0 ? 8 : -8;

    const swing = attackerElement.animate(
      [
        { transform: 'rotate(0deg) translateY(0px) scale(1)', filter: 'brightness(1)' },
        { transform: `rotate(${swingAngle}deg) translateY(${lift}px) scale(1.03)`, filter: 'brightness(1.15)' },
      ],
      {
        duration: this.animationSettingsService.getAdjustedDuration(240),
        easing: 'ease-out',
      },
    );

    await swing.finished;

    const pulse = targetElement.animate(
      [
        { transform: 'scale(1)', filter: 'brightness(1)' },
        { transform: 'scale(1.5)', filter: 'brightness(1.25)' },
        { transform: 'scale(1)', filter: 'brightness(1)' },
      ],
      {
        duration: this.animationSettingsService.getAdjustedDuration(360),
        easing: 'ease-out',
      },
    );

    const dash = attackerElement.animate(
      [
        { transform: 'translateY(0px) rotate(0deg) scale(1)' },
        { transform: `translate(${dx * 0.6}px, ${dy * 0.6}px) rotate(${swingAngle * 0.8}deg) scale(1.02)` },
        { transform: `translate(${dx}px, ${dy}px) rotate(${swingAngle}deg) scale(0.96)` },
        { transform: 'translate(0px, 0px) rotate(0deg) scale(1)' },
      ],
      {
        duration: this.animationSettingsService.getAdjustedDuration(500),
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    );

    await new Promise((resolve) => setTimeout(resolve, this.animationSettingsService.getAdjustedDuration(220)));

    switch (targetType) {
      case 'PLAYER':
        targetPlayer.Health.changeHealth(-attackerDamage, 500);
        break;
      case 'BOARD':
        if (targetPlayer && targetIndex >= 0) {
          const boardTarget = targetPlayer as unknown as { Board: Array<{ changeHealth: (amount: number, duration: number) => void } | null> };
          boardTarget.Board[targetIndex]?.changeHealth?.(-attackerDamage, 500);
        }
        const attackerIndex = attackerPlayer.Board.findIndex((card) => card?.id === attackerId);
        if (attackerIndex !== -1) {
          attackerPlayer.Board[attackerIndex]?.changeHealth?.(-defenderDamage, 500);
        }
        break;
    }

    this.audioService.playSfx("audio/sound1.mp3")
    await Promise.all([dash.finished, pulse.finished]);



    attackerElement.style.transform = '';
    attackerElement.style.filter = '';
    targetElement.style.transform = '';
    targetElement.style.filter = '';
  }

  async animateDeckCard(startIcon: string, cardOrigin: string, deckEnd: string, duration: number): Promise<void> {
    await this.nextFrame();

    const origin = document.querySelector(`[data-game-id="${cardOrigin}"]`) as HTMLElement | null;
    const destination = document.querySelector(`[data-game-id="${deckEnd}"]`) as HTMLElement | null;
    if (!origin || !destination) {
      return;
    }

    const icon = document.querySelector(startIcon) as HTMLElement | null;
    if (!icon) {
      return;
    }

    icon.style.display = 'block';
    const iconRect = icon.getBoundingClientRect();
    const start = this.getCenter(origin);
    const end = destination.getBoundingClientRect();
    const endCenter = {
      x: end.left + end.width / 2,
      y: end.top,
    };

    const dx = endCenter.x - start.x - (iconRect.width / 4);
    const dy = endCenter.y - start.y - iconRect.height;

    icon.style.position = 'fixed';
    icon.style.left = `${start.x - iconRect.width / 2}px`;
    icon.style.top = `${start.y - iconRect.height / 2}px`;
    icon.style.willChange = 'transform';

    const animation = icon.animate(
      [
        { transform: 'translate(0px, 0px) rotate(0deg) scale(0.9)', offset: 0.1 },
        { transform: `translate(${dx * 0.45}px, ${dy * 0.3}px) rotate(14deg) scale(1.05)`, offset: 0.55 },
        { transform: `translate(${dx}px, ${dy}px) rotate(0deg) scale(1)`, offset: 0.8 },
        { transform: `translate(${dx}px, ${dy}px) rotate(0deg) scale(1)`, opacity: 1, offset: 0.9 },
        { transform: `translate(${dx}px, ${dy + iconRect.height * 2}px) rotate(180deg) scale(0.8)`, opacity: 0, offset: 1 },
      ],
      {
        duration: this.animationSettingsService.getAdjustedDuration(duration),
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    );

    await animation.finished;



    icon.style.display = 'none';
  }

  async createProjectile(source: string, target: string): Promise<void> {
    if (source === target) {
      return;
    }

    // const projectile = document.querySelector('.proyectile') as HTMLElement | null;
    const projectile = document.createElement('div');
    projectile.classList.add('proyectile');
    const layer = this.getAnimationLayer();
    console.log('layer: ', layer)
    layer?.appendChild(projectile);
    await this.nextFrame();


    const sourceElement = document.querySelector(`[data-game-id="${source}"]`) as HTMLElement | null;
    const targetElement = document.querySelector(`[data-game-id="${target}"]`) as HTMLElement | null;

    if (!projectile || !sourceElement || !targetElement) {
      projectile.remove();
      return;
    }

    const start = this.getCenter(sourceElement);
    const end = this.getCenter(targetElement);
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    projectile.style.left = `${start.x}px`;
    projectile.style.top = `${start.y}px`;
    projectile.style.transform = 'translate(-50%, -50%)';

    const animation = projectile.animate(
      [
        { transform: 'translate(-50%, -50%) scale(0.7) rotate(0deg)', opacity: 0.85 },
        { transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${dy * 0.5}px)) scale(1.05) rotate(540deg)`, opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.75) rotate(1080deg)`, opacity: 0.2 },
      ],
      {
        duration: this.animationSettingsService.getAdjustedDuration(250),
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'forwards',
      },
    );

    await animation.finished;
    projectile.remove();
  }

  async animateUnitDeath(element: HTMLElement): Promise<void> {
    if (!element) {
      return;
    }


    const animation = element.animate(
      [
        { opacity: 1, transform: 'scale(1) rotate(0deg)', filter: 'brightness(1)' },
        { opacity: 0.25, transform: 'scale(0.85) rotate(8deg)', filter: 'brightness(1.3)' },
        { opacity: 0, transform: 'scale(0.55) rotate(16deg)', filter: 'brightness(0.8)' },
      ],
      {
        duration: this.animationSettingsService.getAdjustedDuration(420),
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'forwards',
      },
    );

    await animation.finished;
    element.style.opacity = '0';
    element.style.transform = 'scale(0.55) rotate(16deg)';
  }
}
