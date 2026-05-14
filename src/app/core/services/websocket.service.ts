import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NgZone } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  private messageQueue: any[] = [];

  private recievedMessageQueue: any[] = [];

  private socket?: WebSocket;

  private isConnecting = false;

  private isConnected = false;

  private onMessage: (msg: any) => boolean;

  constructor(
    private router: Router,
    private zone: NgZone
  ) {
    this.onMessage = (msg) => {
      console.log(msg);
      return false;
    }
  }

  connect() {
    if (
      this.isConnected ||
      this.isConnecting
    ) {
      return;
    }

    this.isConnecting = true;

    console.log('Connecting...');

    this.socket =
      new WebSocket(
        'ws://10.154.20.72:5182/ws'
      );


    this.socket.onopen = () => {

      console.log('Connected');

      this.isConnected = true;

      this.isConnecting = false;

      while (this.messageQueue.length > 0) {

        const msg = this.messageQueue.shift();

        this.socket!.send(JSON.stringify(msg));

      }

    };


    this.socket.onmessage = event => {

      const message =
        JSON.parse(event.data);

      console.log(message)

      this.handleMessage(message);

    };


    this.socket.onerror = error => {

      console.error(error);

      this.handleDisconnect();

    };


    this.socket.onclose = () => {

      console.warn('Disconnected');

      this.handleDisconnect();

    };

  }


  send(data: any) {
    if (
      this.socket &&
      this.socket.readyState === WebSocket.OPEN
    ) {
      console.log("Sending data: ", JSON.stringify(data))
      this.socket.send(JSON.stringify(data));

    } else {

      console.log("Queueing message");

      this.messageQueue.push(data);

    }

  }
  disconnect() {
    this.socket?.close();
  }

  private handleMessage(msg: any) {
    this.zone.run(() => {
      if(this.onMessage(msg))
      {
        this.recievedMessageQueue.push(msg);
      }
    })
  }

  private handleDisconnect() {

    this.isConnected = false;

    this.isConnecting = false;

    this.router.navigate([
      '/error'
    ]);
  }

  public subscribe(callback: (msg : any) => boolean) 
  {
    this.onMessage = callback;

    while(this.recievedMessageQueue.length > 0)
    {
      this.handleMessage(this.recievedMessageQueue.shift())
    }
  }
}