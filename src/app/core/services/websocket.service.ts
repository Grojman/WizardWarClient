import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { runtimeConfig } from '../../runtime-config';

export interface WebSocketMessage {
  Type?: string;
  Content?: unknown;
}

type MessageHandler = (msg: WebSocketMessage) => boolean;

// A message queued for later, plus which subscriber callbacks have already
// been offered it and rejected it (returned true = "not mine"). Tracking
// this per-message is what makes replay-on-subscribe safe to call
// repeatedly: a subscriber that has already rejected a message won't be
// asked again, so a message nobody ever claims gets dropped instead of
// being replayed forever every time something subscribes.
interface QueuedMessage {
  msg: WebSocketMessage;
  rejectedBy: Set<MessageHandler>;
}

const CLIENT_ID_STORAGE_KEY = 'ww_client_id';

function getOrCreateClientId(): string {
  let clientId = localStorage.getItem(CLIENT_ID_STORAGE_KEY);
  if (!clientId) {
    clientId = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_STORAGE_KEY, clientId);
  }
  return clientId;
}

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private messageQueue: unknown[] = [];
  private receivedMessageQueue: QueuedMessage[] = [];
  private socket?: WebSocket;
  private isConnecting = false;
  private isConnected = false;
  private onMessage: MessageHandler = () => false;
  private reconnectAttempts = 0;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private manualDisconnect = false;

  constructor(
    private router: Router,
    private zone: NgZone,
  ) {}

  // Whether the socket was already open (or opening) the moment connect()
  // was last called. A page reload always sees this as false right before
  // it calls connect() (services are rebuilt from scratch), while an SPA
  // route change reuses the still-open socket — this is how GameComponent
  // tells a genuine new match (deal-in animation wanted) apart from a
  // reconnect after reload (snapshot is already ground truth).
  get connected(): boolean {
    return this.isConnected || this.isConnecting;
  }

  connect(): void {
    if (this.isConnected || this.isConnecting) {
      return;
    }

    this.manualDisconnect = false;
    this.isConnecting = true;
    this.clearReconnectTimer();

    console.log('Connecting...');

    try {
      const clientId = getOrCreateClientId();
      this.socket = new WebSocket(`${runtimeConfig.websocketUrl}?clientId=${clientId}`);
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
      this.dispatch({ msg, rejectedBy: new Set() });
    });
  }

  // Offers a queued message to the current subscriber, unless that exact
  // subscriber has already rejected it before. Re-queues it (with the
  // rejection recorded) only if it's still unclaimed afterwards.
  private dispatch(entry: QueuedMessage): void {
    if (entry.rejectedBy.has(this.onMessage)) {
      return;
    }

    if (this.onMessage(entry.msg)) {
      entry.rejectedBy.add(this.onMessage);
      this.receivedMessageQueue.push(entry);
    }
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

  public subscribe(callback: MessageHandler): void {
    this.onMessage = callback;

    // Replay messages left unhandled by earlier subscribers. Snapshot the
    // queue first — dispatch() re-appends anything still unclaimed, and
    // draining the live array instead of a snapshot would pick that
    // re-appended entry right back up in the same pass, looping forever
    // whenever nobody ever claims it (this used to hang the tab). The
    // per-message rejectedBy set is the second layer: even across separate
    // subscribe() calls, a message already rejected by this exact callback
    // is dropped instead of being offered to it again.
    const pending = this.receivedMessageQueue;
    this.receivedMessageQueue = [];
    for (const entry of pending) {
      this.dispatch(entry);
    }
  }

  public clearSubscription(): void {
    this.onMessage = () => false;
    this.receivedMessageQueue = [];
  }
}