import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GameAnimationService {
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

    const attackerRect = attackerElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    const dx = targetRect.left + targetRect.width / 2 - (attackerRect.left + attackerRect.width / 2);
    const dy = targetRect.top + targetRect.height / 2 - (attackerRect.top + attackerRect.height / 2);

    const angle = Math.atan(dx / attackerRect.width) * (180 / Math.PI);
    const movementScaleX = 0.3;
    const movementScaleY = 0.15;
    const scaledDx = angle * movementScaleX;
    const scaledDy = dy * movementScaleY;
    const verticalMovement = scaledDy > 0 ? 6 : -6;

    const targetAnim = attackerElement.animate(
      [
        { transform: 'rotate(0deg) translateY(0px)' },
        { transform: `rotate(${scaledDx}deg) translateY(${verticalMovement}px)` },
      ],
      {
        duration: 500,
        easing: 'ease-out',
      },
    );

    await targetAnim.finished;

    const attackerAnim = attackerElement.animate(
      [
        { transform: 'translateY(0px)' },
        { transform: `translate(${dx}px, ${dy}px) rotate(${scaledDx}deg)` },
        { transform: 'translate(0px, 0px) rotate(0deg)' },
      ],
      {
        duration: 500,
        easing: 'ease-out',
      },
    );

    await new Promise((resolve) => setTimeout(resolve, 250));

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

    await Promise.all([attackerAnim.finished, targetAnim.finished]);
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
        { transform: 'translate(0px, 0px) rotate(0deg)', offset: 0.15 },
        { transform: `translate(${dx}px, ${dy}px) rotate(0deg)`, offset: 0.7 },
        { transform: `translate(${dx}px, ${dy - iconRect.height / 2}px) rotate(180deg)`, opacity: 1, offset: 0.85 },
        { transform: `translate(${dx}px, ${dy + iconRect.height}px) rotate(180deg)`, opacity: 0, offset: 1 },
      ],
      {
        duration,
        easing: 'ease-out',
      },
    );

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

    projectile.style.position = 'fixed';
    projectile.style.left = `${start.x}px`;
    projectile.style.top = `${start.y}px`;
    projectile.style.display = 'block';

    const dx = end.x - start.x;
    const dy = end.y - start.y;

    const animation = projectile.animate(
      [
        { transform: 'translate(0px, 0px) rotate(0deg)' },
        { transform: `translate(${dx}px, ${dy}px) rotate(1080deg)` },
      ],
      {
        duration: 250,
        easing: 'ease-out',
        fill: 'forwards',
      },
    );

    await animation.finished;
    projectile.style.display = 'none';
  }
}
