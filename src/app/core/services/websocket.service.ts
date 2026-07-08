import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { runtimeConfig } from '../../runtime-config';

export interface WebSocketMessage {
  Type?: string;
  Content?: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private messageQueue: unknown[] = [];
  private receivedMessageQueue: WebSocketMessage[] = [];
  private socket?: WebSocket;
  private isConnecting = false;
  private isConnected = false;
  private onMessage: (msg: WebSocketMessage) => boolean = () => false;
  private reconnectAttempts = 0;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private manualDisconnect = false;

  constructor(
    private router: Router,
    private zone: NgZone,
  ) {}

  connect(): void {
    if (this.isConnected || this.isConnecting) {
      return;
    }

    this.manualDisconnect = false;
    this.isConnecting = true;
    this.clearReconnectTimer();

    console.log('Connecting...');

    try {
      this.socket = new WebSocket(runtimeConfig.websocketUrl);
    } catch (error) {
      console.error('WebSocket initialization failed', error);
      this.handleDisconnect('initialization-failed');
      return;
    }

    this.socket.onopen = () => {
      console.log('Connected');
      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;

      while (this.messageQueue.length > 0) {
        const msg = this.messageQueue.shift();
        if (msg !== undefined) {
          this.socket?.send(JSON.stringify(msg));
        }
      }
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        this.handleMessage(message);
      } catch (error) {
        console.error('Invalid WebSocket payload', error, event.data);
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error', error);
      this.handleDisconnect('error');
    };

    this.socket.onclose = () => {
      console.warn('Disconnected');
      if (!this.manualDisconnect) {
        this.handleDisconnect('closed');
      }
    };
  }

  send(data: unknown): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('Sending data: ', JSON.stringify(data));
      this.socket.send(JSON.stringify(data));
    } else {
      console.log('Queueing message');
      this.messageQueue.push(data);
    }
  }

  disconnect(): void {
    this.manualDisconnect = true;
    this.clearReconnectTimer();
    this.socket?.close();
  }

  private handleMessage(msg: WebSocketMessage): void {
    this.zone.run(() => {
      if (this.onMessage(msg)) {
        this.receivedMessageQueue.push(msg);
      }
    });
  }

  private handleDisconnect(reason: string): void {
    this.isConnected = false;
    this.isConnecting = false;

    if (this.manualDisconnect) {
      return;
    }

    if (this.reconnectAttempts < runtimeConfig.maxReconnectAttempts) {
      this.reconnectAttempts += 1;
      console.warn(`Reconnecting in ${runtimeConfig.reconnectDelayMs}ms (${reason})`);
      this.reconnectTimer = setTimeout(() => this.connect(), runtimeConfig.reconnectDelayMs);
      return;
    }

    this.router.navigate(['/error']);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }

  public subscribe(callback: (msg: WebSocketMessage) => boolean): void {
    this.onMessage = callback;

    while (this.receivedMessageQueue.length > 0) {
      const msg = this.receivedMessageQueue.shift();
      if (msg) {
        this.handleMessage(msg);
      }
    }
  }

  public clearSubscription(): void {
    this.onMessage = () => false;
    this.receivedMessageQueue = [];
  }
}