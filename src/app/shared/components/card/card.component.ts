import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Card } from '../../../models/card.model';



@Component({
  selector: 'app-card',
  standalone: false,
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css'],
})
export class CardComponent implements OnChanges, OnInit {
  ngOnInit(): void {
    console.log("Mi carta: ", this.card);
    this.faceDown = this.card === null;
  }

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
    console.log("a")
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

}