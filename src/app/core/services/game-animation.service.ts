import { Injectable } from '@angular/core';
import { AnimationSettingsService } from './animation-settings.service';

@Injectable({
  providedIn: 'root',
})
export class GameAnimationService {
  constructor(private animationSettingsService: AnimationSettingsService) {}

  private getAnimationLayer(): HTMLElement | null {
    return document.querySelector('.animation-layer') as HTMLElement | null;
  }

  private spawnBurst(x: number, y: number, color: string, size: number = 80): void {
    const layer = this.getAnimationLayer();
    if (!layer) {
      return;
    }

    const burst = document.createElement('div');
    burst.className = 'impact-burst';
    burst.style.left = `${x}px`;
    burst.style.top = `${y}px`;
    burst.style.setProperty('--burst-size', `${size}px`);
    burst.style.setProperty('--burst-color', color);
    layer.appendChild(burst);

    const animation = burst.animate(
      [
        { opacity: 0, transform: 'translate(-50%, -50%) scale(0.2)' },
        { opacity: 0.95, transform: 'translate(-50%, -50%) scale(1)' },
        { opacity: 0, transform: 'translate(-50%, -50%) scale(1.35)' },
      ],
      {
        duration: this.animationSettingsService.getAdjustedDuration(420),
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'forwards',
      },
    );

    animation.finished.finally(() => burst.remove());
  }

  private spawnSpark(x: number, y: number, angle: number): void {
    const layer = this.getAnimationLayer();
    if (!layer) {
      return;
    }

    const spark = document.createElement('div');
    spark.className = 'impact-spark';
    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;
    spark.style.setProperty('--spark-angle', `${angle}deg`);
    spark.style.setProperty('--spark-distance', `${24 + Math.random() * 30}px`);
    spark.style.setProperty('--spark-width', `${18 + Math.random() * 10}px`);
    spark.style.setProperty('--spark-height', `${6 + Math.random() * 4}px`);
    layer.appendChild(spark);

    const animation = spark.animate(
      [
        { opacity: 0.95, transform: 'translate(-50%, -50%) scale(0.6)' },
        { opacity: 0, transform: 'translate(-50%, -50%) scale(1.1)' },
      ],
      {
        duration: this.animationSettingsService.getAdjustedDuration(280) + Math.random() * this.animationSettingsService.getAdjustedDuration(120),
        easing: 'ease-out',
        fill: 'forwards',
      },
    );

    animation.finished.finally(() => spark.remove());
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
    const travelDistance = Math.hypot(dx, dy);
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

    const impactX = targetCenterX;
    const impactY = targetCenterY;
    this.spawnBurst(impactX, impactY, 'rgba(255, 214, 102, 0.95)', 84 + Math.random() * 26);
    for (let index = 0; index < 8; index += 1) {
      this.spawnSpark(impactX, impactY, angle + (index - 3.5) * 18 + (Math.random() - 0.5) * 10);
    }

    const pulse = targetElement.animate(
      [
        { transform: 'scale(1)', filter: 'brightness(1)' },
        { transform: 'scale(1.05)', filter: 'brightness(1.25)' },
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
        { transform: `translate(${dx}px, ${dy - iconRect.height / 2}px) rotate(180deg) scale(0.8)`, offset: 1 },
      ],
      {
        duration: this.animationSettingsService.getAdjustedDuration(duration),
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    );

    this.spawnBurst(endCenter.x, endCenter.y, 'rgba(255, 240, 120, 0.95)', 52);

    await animation.finished;
    icon.style.display = 'none';
  }

  async createProjectile(source: string, target: string): Promise<void> {
    if (source === target) {
      return;
    }

    await this.nextFrame();
    const projectile = document.querySelector('.proyectile') as HTMLElement | null;
    const sourceElement = document.querySelector(`[data-game-id="${source}"]`) as HTMLElement | null;
    const targetElement = document.querySelector(`[data-game-id="${target}"]`) as HTMLElement | null;

    if (!projectile || !sourceElement || !targetElement) {
      return;
    }

    const start = this.getCenter(sourceElement);
    const end = this.getCenter(targetElement);
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const arc = -Math.min(90, Math.max(-90, dx * 0.06));

    projectile.style.position = 'fixed';
    projectile.style.left = `${start.x}px`;
    projectile.style.top = `${start.y}px`;
    projectile.style.display = 'block';
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
    projectile.style.display = 'none';
    projectile.style.transform = 'translate(-50%, -50%)';
    this.spawnBurst(end.x, end.y, 'rgba(255, 200, 80, 0.95)', 86);
    for (let index = 0; index < 10; index += 1) {
      this.spawnSpark(end.x, end.y, (index / 10) * 360 + arc + (Math.random() - 0.5) * 22);
    }
  }

  async animateUnitDeath(element: HTMLElement): Promise<void> {
    if (!element) {
      return;
    }

    const bounds = element.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;

    this.spawnBurst(centerX, centerY, 'rgba(255, 94, 94, 0.95)', 96);

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
