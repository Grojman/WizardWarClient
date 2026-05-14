import {
  Component,
  ElementRef,
  ViewChild
} from '@angular/core';

@Component({
  selector: 'app-target',
  standalone: false,
  templateUrl: './target.component.html',
  styleUrl: './target.component.css',
})
export class TargetPlayerComponent {

  @ViewChild('arrow', { static: true })
  arrowRef!: ElementRef<HTMLImageElement>;

  private currentRotation = 0;

  apuntarAElemento(elemento: HTMLElement)
{
    const arrow = this.arrowRef.nativeElement;

    const parent =
        arrow.offsetParent as HTMLElement;

    const parentRect =
        parent.getBoundingClientRect();

    const arrowRect =
        arrow.getBoundingClientRect();

    const targetRect =
        elemento.getBoundingClientRect();

    // Coordenadas relativas al parent transformado
    const arrowX =
        arrowRect.left - parentRect.left +
        arrowRect.width / 2;

    const arrowY =
        arrowRect.top - parentRect.top +
        arrowRect.height / 2;

    const targetX =
        targetRect.left - parentRect.left +
        targetRect.width / 2;

    const targetY =
        targetRect.top - parentRect.top +
        targetRect.height / 2;

    const dx = targetX - arrowX;
    const dy = targetY - arrowY;

    let angle =
        Math.atan2(dy, dx) * 180 / Math.PI;

    // Si la flecha mira hacia arriba:
    // angle += 90;

    let delta = angle - this.currentRotation;

    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;

    this.currentRotation += delta;

    arrow.style.transform =
        `rotate(${this.currentRotation}deg)`;
}
}