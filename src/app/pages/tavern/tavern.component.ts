import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
export class TavernComponent implements OnInit {

  character: any;
  inputText = '';

  messages: ChatMessage[] = [];

  constructor(private router: Router) {}

    users: string[] = [];

ngOnInit() {
  const savedCharacter = localStorage.getItem('selectedCharacter');

  if (!savedCharacter) {
    this.router.navigate(['/characters']);
    return;
  }

  this.character = JSON.parse(savedCharacter);

  this.users = [this.character.name];

  const savedMessages = localStorage.getItem('tavernMessages');

  if (savedMessages) {
    this.messages = JSON.parse(savedMessages);
  }
}

  sendMessage() {
    if (!this.inputText.trim()) return;

    const newMessage: ChatMessage = {
      user: this.character.name,
      text: this.inputText
    };

    this.messages.push(newMessage);

    // сохраняем
    localStorage.setItem(
      'tavernMessages',
      JSON.stringify(this.messages)
    );

    this.inputText = '';
  }

  clearChat() {
    this.messages = [];
    localStorage.removeItem('tavernMessages');
  }

  goBackToCharacters() {
    this.router.navigate(['/characters']);
  }

  goHome() {
    this.router.navigate(['/home']);
  }


}