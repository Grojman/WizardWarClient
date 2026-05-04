import { Component } from '@angular/core';

import { Router } from '@angular/router';
import { WebsocketService } from '../../core/services/websocket.service';

@Component({
  selector: 'app-error.component',
  standalone: false,
  templateUrl: './error.component.html',
  styleUrl: './error.component.css',
})
export class ErrorComponent {

  constructor(private r: Router, private ws: WebsocketService) {}

  tryReload()
  {
    this.ws.disconnect();
    this.r.navigateByUrl("/");
  }
}
