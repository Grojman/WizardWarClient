import { Component, Input } from '@angular/core';
import { Health } from '../../../models/health.model';

@Component({
  selector: 'app-health',
  standalone: false,
  templateUrl: './health.component.html',
  styleUrl: './health.component.css',
})
export class HealthComponent {
  @Input()
  health!: Health

  @Input()
  rival: boolean = false;
}
