import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  OnInit,
  input
} from '@angular/core';

import { Card } from '../../../models/card.model';
import { UNIT, SPELL } from '../../../core/config/game-data-config';


@Component({
  selector: 'app-card',
  standalone: false,
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css'],
})
export class CardComponent implements OnChanges, OnInit {
  unit: string = UNIT;
  spell: string = SPELL;

  ngOnInit(): void {
    this.faceDown = this.card === null;
  }

  @Input()
  target: boolean = false;

  @Input()
  attacking: boolean = false;

  @Input()
  card: Card | null = null;

  @Input()
  faceDown = false;

  @Input()
  canBeSelected = false;

  @Input()
  selected = false;

  private boundingRect?: DOMRect;

  ngOnChanges(
    changes: SimpleChanges
  ) {
    this.faceDown = changes['card'] &&
                    this.card === undefined;
  }

  onMouseEnter(event: MouseEvent) {

    this.boundingRect =
      (event.currentTarget as HTMLElement)
        .getBoundingClientRect();

  }

  onMouseLeave() {
    this.boundingRect = undefined;
  }

  onMouseMove(event: MouseEvent) {
    if (!this.boundingRect) return;

    const element =
      event.currentTarget as HTMLElement;

    const x =
      event.clientX -
      this.boundingRect.left;

    const y =
      event.clientY -
      this.boundingRect.top;

    const xPercentage =
      x / this.boundingRect.width;

    const yPercentage =
      y / this.boundingRect.height;

    const xRotation =
      (xPercentage - 0.5) * 20;

    const yRotation =
      (0.5 - yPercentage) * 20;

    element.style.setProperty(
      '--x-rotation',
      `${yRotation}deg`
    );

    element.style.setProperty(
      '--y-rotation',
      `${xRotation}deg`
    );

    element.style.setProperty(
      '--x',
      `${xPercentage * 100}%`
    );

    element.style.setProperty(
      '--y',
      `${yPercentage * 100}%`
    );

  }

  stringToColor(str: string): string {
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
      hash |= 0; // convertir a int32
    }

    const hue = Math.abs(hash) % 360;

    // variación ligera para que no todos tengan misma intensidad
    const saturation = 60 + (Math.abs(hash) % 20); // 60-79
    const lightness = 45 + (Math.abs(hash >> 8) % 20); // 45-64

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  familiesToGradient(families: string[]): string {
    if (families.length === 0) {
      return "hsl(0, 0%, 60%)";
    }

    const colors = families.map(f => this.stringToColor(f));

    if (colors.length === 1) {
      return colors[0];
    }

    const step = 100 / colors.length;

    const gradientStops = colors.map((color, index) => {
      const start = index * step;
      const end = (index + 1) * step;

      return `${color} ${start}%, ${color} ${end}%`;
    });

    var result = `linear-gradient(135deg, ${gradientStops.join(", ")})`;
    return result;
  }

}