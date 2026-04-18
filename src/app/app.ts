import { Component, signal } from '@angular/core';
import { WebsocketService } from './core/services/websocket.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('wizard-war-client');

  constructor(private ws: WebsocketService)
  {
    this.ws.connect();
  }
}
