import * as signalR from '@microsoft/signalr';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TavernSignalRService {

  private hubConnection!: signalR.HubConnection;

  messages: { user: string, text: string }[] = [];
  users: string[] = [];

    startConnection(): Promise<void> {
    this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl('https://unsworn-cover-reply.ngrok-free.app/tavernHub')
        .withAutomaticReconnect()
        .build();

    this.hubConnection.on('ReceiveMessage', (user, message) => {
        this.messages.push({ user, text: message });
    });

    this.hubConnection.on('UserJoined', (user) => {
        if (!this.users.includes(user)) this.users.push(user);
    });

    this.hubConnection.on('UserLeft', (user) => {
        this.users = this.users.filter(u => u !== user);
    });

    return this.hubConnection.start();
    }

  sendMessage(user: string, message: string) {
    this.hubConnection.invoke('SendMessage', user, message);
  }

  join(user: string) {
    this.hubConnection.invoke('Join', user);
  }

  leave(user: string) {
    this.hubConnection.invoke('Leave', user);
  }
}