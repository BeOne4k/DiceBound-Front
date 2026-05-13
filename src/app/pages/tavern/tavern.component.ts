import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { TavernSignalRService } from 'src/app/core/services/tavern-signalr.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ChatMessage {
  user: string;
  text: string;
}

@Component({
  standalone: true,
  selector: 'app-tavern',
  templateUrl: './tavern.component.html',
  styleUrls: ['./tavern.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class TavernComponent implements OnInit, OnDestroy {

  character: any;
  inputText = '';

  // 👇 ЭТИ ДОЛЖНЫ БЫТЬ, ИНАЧЕ HTML ЛОМАЕТСЯ
  users: string[] = [];
  messages: ChatMessage[] = [];

  constructor(
    public signalR: TavernSignalRService,
    private router: Router
  ) {}

  async ngOnInit() {
    const saved = localStorage.getItem('selectedCharacter');

    if (!saved) {
      this.router.navigate(['/characters']);
      return;
    }

    this.character = JSON.parse(saved);

    await this.signalR.startConnection();
    await this.signalR.join(this.character.name);
  }

  sendMessage() {
    if (!this.inputText.trim()) return;

    this.signalR.sendMessage(
      this.character.name,
      this.inputText
    );

    this.inputText = '';
  }

  goBackToCharacters() {
    this.router.navigate(['/characters']);
  }

  goHome() {
    this.router.navigate(['/home']);
  }

  ngOnDestroy() {
    this.signalR.leave(this.character?.name);
  }
}