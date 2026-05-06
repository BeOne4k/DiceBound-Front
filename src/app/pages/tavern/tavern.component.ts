import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface ChatMessage {
  author: string;
  text: string;
  timestamp: number;
}

@Component({
  standalone: true,
  selector: 'app-tavern',
  templateUrl: './tavern.component.html',
  styleUrls: ['./tavern.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class TavernComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('chatBox') chatBox!: ElementRef<HTMLDivElement>;

  character: any = null;
  inputText = '';
  visibleMessages: ChatMessage[] = [];
  visitors: string[] = [];

  private readonly STORAGE_KEY = 'dicebound_tavern_messages';
  private readonly VISITORS_KEY = 'dicebound_tavern_visitors';
  private readonly SESSION_TS_KEY = 'dicebound_tavern_join_ts';
  private readonly MAX_MESSAGES = 200;
  private readonly PRUNE_AFTER_MS = 60 * 60 * 1000; // 1 hour

  private pollInterval: any;
  private shouldScroll = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    const savedChar = localStorage.getItem('selectedCharacter');
    if (savedChar) {
      this.character = JSON.parse(savedChar);
    } else {
      this.router.navigate(['/characters']);
      return;
    }

    // Mark join time so we only show messages from this point forward
    const joinTs = Date.now();
    sessionStorage.setItem(this.SESSION_TS_KEY, String(joinTs));

    // Register this visitor
    this.addVisitor(this.character.name);

    // Load messages that arrived after joining
    this.refreshMessages();

    // Poll every 2 seconds for new messages
    this.pollInterval = setInterval(() => this.refreshMessages(), 2000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.removeVisitor(this.character?.name);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

    goBackToCharacters() {
    this.router.navigate(['/characters']);
  }

  // ── MESSAGES ──────────────────────────────────────

  sendMessage(): void {
    const text = this.inputText.trim();
    if (!text) return;

    const msg: ChatMessage = {
      author: this.character?.name || 'Anonymous',
      text,
      timestamp: Date.now()
    };

    this.saveMessage(msg);
    this.inputText = '';
    this.refreshMessages();
  }

  private saveMessage(msg: ChatMessage): void {
    const all = this.loadAllMessages();
    all.push(msg);

    // Prune old messages (older than 1 hour) and cap at MAX_MESSAGES
    const cutoff = Date.now() - this.PRUNE_AFTER_MS;
    const pruned = all.filter(m => m.timestamp > cutoff).slice(-this.MAX_MESSAGES);

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(pruned));
  }

  private loadAllMessages(): ChatMessage[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private refreshMessages(): void {
    const joinTs = Number(sessionStorage.getItem(this.SESSION_TS_KEY) || 0);
    const all = this.loadAllMessages();
    const fresh = all.filter(m => m.timestamp >= joinTs);

    // Only update + scroll if something changed
    if (fresh.length !== this.visibleMessages.length) {
      this.visibleMessages = fresh;
      this.shouldScroll = true;
    }
  }

  private scrollToBottom(): void {
    if (this.chatBox?.nativeElement) {
      const el = this.chatBox.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  // ── VISITORS ──────────────────────────────────────

  private addVisitor(name: string): void {
    const list = this.loadVisitors();
    if (!list.includes(name)) list.push(name);
    localStorage.setItem(this.VISITORS_KEY, JSON.stringify(list));
    this.visitors = list;
  }

  private removeVisitor(name: string): void {
    if (!name) return;
    const list = this.loadVisitors().filter(v => v !== name);
    localStorage.setItem(this.VISITORS_KEY, JSON.stringify(list));
  }

  private loadVisitors(): string[] {
    try {
      const raw = localStorage.getItem(this.VISITORS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}
