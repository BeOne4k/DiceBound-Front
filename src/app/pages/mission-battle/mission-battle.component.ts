import {
  Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface ChatMessage {
  author: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
  isDeath?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-mission-battle',
  templateUrl: './mission-battle.component.html',
  styleUrls: ['./mission-battle.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class MissionBattleComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('chatBox') chatBox!: ElementRef<HTMLDivElement>;

  character: any = null;
  mission: any = null;
  boss: any = null;

  loadingBoss = true;
  battleStarted = false;
  battleFinished = false;
  isWin = false;
  isDead = false;
  gainedXp = 0;
  combatResult: any = null;

  // Battle log streamed line by line
  allLogs: string[] = [];
  visibleLogs: string[] = [];
  private logIndex = 0;
  private logInterval: any = null;

  // Chat
  visibleMessages: ChatMessage[] = [];
  inputText = '';
  players: string[] = [];

  // Boss HP tracking (simulated during log stream)
  bossMaxHp = 0;
  bossCurrentHp = 0;
  bossStatus = '';

  // Character HP tracking (damage from logs)
  charMaxHp = 0;
  charCurrentHp = 0;
  // Сохраняем raceName отдельно — refreshCharacter не затрёт
  savedRaceName = '';

  // Death + grayscale state
  deathOverlay = false;
  private shouldScroll = false;

  private readonly STORAGE_KEY = 'dicebound_mission_chat';
  private readonly SESSION_TS_KEY = 'dicebound_mission_join_ts';
  private pollInterval: any;
  private missionId: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const savedChar = localStorage.getItem('selectedCharacter');
    if (savedChar) {
      this.character = JSON.parse(savedChar);
      this.charMaxHp = this.character.hp ?? this.character.HP ?? this.character.Hp ?? 100;
      this.charCurrentHp = this.charMaxHp;
      this.savedRaceName = this.character.raceName || this.character.RaceName || '';
    } else {
      this.router.navigate(['/characters']);
      return;
    }

    this.missionId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.missionId) {
      this.router.navigate(['/home']);
      return;
    }

    // Register player in chat room
    const joinTs = Date.now();
    sessionStorage.setItem(this.SESSION_TS_KEY, String(joinTs));
    this.addPlayer(this.character.name || this.character.Name);
    this.refreshMessages();
    this.pollInterval = setInterval(() => this.refreshMessages(), 2000);

    // Load mission + boss data
    this.loadMissionData();
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
    if (this.logInterval) clearInterval(this.logInterval);
    this.removePlayer(this.character?.name);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  // ── DATA LOADING ──────────────────────────────────

  loadMissionData(): void {
    const token = localStorage.getItem('token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    this.http.get<any>(`${environment.apiUrl}/Missions/${this.missionId}`, { headers }).subscribe({
      next: (mission) => {
        this.mission = mission;
        if (mission.bossId) {
          this.loadBoss(mission.bossId, headers);
        } else {
          this.loadingBoss = false;
          this.startBattle();
        }
      },
      error: () => {
        // Fallback mock data
        this.mission = {
          id: this.missionId,
          name: 'Mission of the Fallen',
          minLevel: 1,
          difficulty: 3,
          rewardExperience: 200,
          bossId: 'mock-boss'
        };
        this.boss = {
          id: 'mock-boss',
          name: 'Ragnarok',
          hp: 50,
          armorClass: 14,
          requiredLevel: 1,
          xpValue: 300
        };
        this.bossMaxHp = this.boss.hp;
        this.bossCurrentHp = this.boss.hp;
        this.loadingBoss = false;
        this.startBattle();
      }
    });
  }

  loadBoss(bossId: string, headers: any): void {
    this.http.get<any>(`${environment.apiUrl}/Bosses/${bossId}`, { headers }).subscribe({
      next: (boss) => {
        this.boss = boss;
        this.bossMaxHp = boss.hp;
        this.bossCurrentHp = boss.hp;
        this.loadingBoss = false;
        this.startBattle();
      },
      error: () => {
        this.boss = { id: bossId, name: 'Ragnarok', hp: 50, armorClass: 14, requiredLevel: 1, xpValue: 300 };
        this.bossMaxHp = this.boss.hp;
        this.bossCurrentHp = this.boss.hp;
        this.loadingBoss = false;
        this.startBattle();
      }
    });
  }

  // ── BATTLE ────────────────────────────────────────

  startBattle(): void {

  if (this.battleStarted) return;
  this.battleStarted = true;

  this.visibleLogs = [];
  this.allLogs = [];
  this.logIndex = 0;

  if (this.logInterval) {
    clearInterval(this.logInterval);
    this.logInterval = null;
  }

  const token = localStorage.getItem('token');
  const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

  const characterId = this.character.id || this.character.Id;
  if (!characterId) {
    console.error('Character ID not found in:', this.character);
    this.battleStarted = false; // важно откатить
    return;
  }

  const dto = {
    characterId,
    missionId: this.missionId
  };

  this.bossStatus = 'Engaged';

  this.http.post<any>(`${environment.apiUrl}/Combat/start`, dto, { headers }).subscribe({
    next: (result) => {
      this.combatResult = result;
      this.allLogs = result.logs || result.Logs || [];
      this.isWin = result.isWin ?? result.IsWin ?? false;
      this.gainedXp = result.gainedXp || result.GainedXp || 0;

      this.battleFinished = false;
      this.streamLogs(this.isWin);
    },
    error: (err) => {
      console.error('Combat/start error:', err);

      const mockLogs = this.generateMockBattleLogs();
      this.allLogs = mockLogs;

      const mockWin = Math.random() > 0.4;
      this.isWin = mockWin;
      this.gainedXp = mockWin ? (this.mission?.rewardExperience || 200) : 0;

      this.streamLogs(mockWin);
    }
  });
}

  private generateMockBattleLogs(): string[] {
    const bossName = this.boss?.name || 'Boss';
    const charName = this.character?.name || 'Hero';
    return [
      ` Fight vs ${bossName}`,
      `Hit 6`,
      `Enemy miss`,
      `Hit 4`,
      `Enemy hit 3`,
      ` CRIT! 14`,
      `Enemy miss`,
      `Hit 7`,
      `Enemy hit 5`,
      `Miss`,
      `Enemy hit 4`,
      `Hit 8`,
      ` ${bossName} defeated`,
      `LEVEL UP! ${this.character?.level} → ${(this.character?.level || 1) + 1}`
    ];
  }

  private streamLogs(isWin: boolean): void {
    this.logIndex = 0;

    if (this.allLogs.length === 0) {
      // Нет логов — просто завершаем через паузу
      this.battleFinished = true;
      setTimeout(() => isWin ? this.handleVictory() : this.handleDeath(), 1500);
      return;
    }

    const showNext = () => {
      if (this.logIndex < this.allLogs.length) {
        const line = this.allLogs[this.logIndex];
        this.visibleLogs.push(line);
        this.logIndex++;
        this.updateBossHpFromLog(line);
        this.updateCharHpFromLog(line);
        this.updateBossStatus(line);
        this.shouldScroll = true;
      } else {
        clearInterval(this.logInterval);
        this.logInterval = null;
        this.battleFinished = true;
        setTimeout(() => isWin ? this.handleVictory() : this.handleDeath(), 1500);
      }
    };

    // Первую строку показываем сразу
    showNext();
    // Остальные — каждые 5 секунд
    this.logInterval = setInterval(showNext, 5000);
  }

  private updateBossHpFromLog(line: string): void {
    if (!this.boss) return;
    const hitMatch = line.match(/^Hit (\d+)/);
    const critMatch = line.match(/CRIT! (\d+)/);
    if (hitMatch) {
      this.bossCurrentHp = Math.max(0, this.bossCurrentHp - parseInt(hitMatch[1]));
    } else if (critMatch) {
      this.bossCurrentHp = Math.max(0, this.bossCurrentHp - parseInt(critMatch[1]));
    }
  }

  private updateCharHpFromLog(line: string): void {
    const enemyHitMatch = line.match(/^Enemy hit (\d+)/);
    if (enemyHitMatch) {
      this.charCurrentHp = Math.max(0, this.charCurrentHp - parseInt(enemyHitMatch[1]));
    }
  }

  private updateBossStatus(line: string): void {
    if (line.includes('defeated')) this.bossStatus = 'Defeated';
    else if (line.includes('CRIT')) this.bossStatus = 'Staggered';
    else if (line.includes('Miss')) this.bossStatus = 'Evading';
    else if (line.includes('Enemy hit')) this.bossStatus = 'Attacking';
    else if (line.includes('Fight vs')) this.bossStatus = 'Engaged';
  }

  // ── WIN / DEATH ───────────────────────────────────

  handleVictory(): void {
    const rewardItems: any[] = this.combatResult?.rewardItems || this.combatResult?.RewardItems || [];

    let victoryMsg = `⚔️ ${this.character.name || this.character.Name} defeated ${this.boss?.name || this.boss?.Name || 'the enemy'}! Gained ${this.gainedXp} XP!`;

    if (rewardItems.length > 0) {
      const itemNames = rewardItems.map((r: any) => {
        const name = r.itemName || r.ItemName || 'Item';
        const qty = r.quantity || r.Quantity || 1;
        return qty > 1 ? `${name} x${qty}` : name;
      }).join(', ');
      victoryMsg += ` 🎁 Items: ${itemNames}`;
    }

    this.addSystemMessage(victoryMsg);

    const updatedChar = { ...this.character, experience: (this.character.experience || this.character.Experience || 0) + this.gainedXp };
    localStorage.setItem('selectedCharacter', JSON.stringify(updatedChar));
    this.character = updatedChar;

    this.refreshCharacter();
  }

  handleDeath(): void {
    this.isDead = true;
    this.deathOverlay = true;

    const deathMsg = `💀 ${this.character.name} has fallen in battle...`;
    this.addSystemMessage(deathMsg, true);

    // Delete character from backend
    const token = localStorage.getItem('token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    const charId = this.character.id || this.character.Id;
    this.http.delete(`${environment.apiUrl}/Characters/${charId}`, { headers }).subscribe();

    // Clear local character
    localStorage.removeItem('selectedCharacter');

    // Navigate after 5 seconds
    setTimeout(() => {
      this.deathOverlay = false;
      this.router.navigate(['/characters']);
    }, 5000);
  }

  private refreshCharacter(): void {
    const token = localStorage.getItem('token');
    if (!token) return;
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const charId = this.character.id || this.character.Id;
    if (!charId) return;
    this.http.get<any>(`${environment.apiUrl}/Characters/${charId}`, { headers }).subscribe({
      next: (char) => {
        // Сохраняем raceName — бэкенд может вернуть его пустым если Race не включён в запрос
        if (!char.raceName && !char.RaceName) {
          char.raceName = this.savedRaceName;
        } else {
          this.savedRaceName = char.raceName || char.RaceName || this.savedRaceName;
        }
        localStorage.setItem('selectedCharacter', JSON.stringify(char));
        this.character = char;
        this.charMaxHp = char.hp ?? char.HP ?? char.Hp ?? this.charMaxHp;
      }
    });
  }

  // ── CHAT ──────────────────────────────────────────

  sendMessage(): void {
    const text = this.inputText.trim();
    if (!text || this.isDead) return;

    const msg: ChatMessage = {
      author: this.character?.name || this.character?.Name || 'Anonymous',
      text,
      timestamp: Date.now()
    };

    this.saveMessage(msg);
    this.inputText = '';
    this.refreshMessages();
  }

  private addSystemMessage(text: string, isDeath = false): void {
    const msg: ChatMessage = {
      author: 'System',
      text,
      timestamp: Date.now(),
      isSystem: true,
      isDeath
    };
    this.saveMessage(msg);
    this.refreshMessages();
  }

  private saveMessage(msg: ChatMessage): void {
    const storageKey = `${this.STORAGE_KEY}_${this.missionId}`;
    const all = this.loadAllMessages();
    all.push(msg);
    const pruned = all.slice(-200);
    localStorage.setItem(storageKey, JSON.stringify(pruned));
  }

  private loadAllMessages(): ChatMessage[] {
    try {
      const storageKey = `${this.STORAGE_KEY}_${this.missionId}`;
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  private refreshMessages(): void {
    const joinTs = Number(sessionStorage.getItem(this.SESSION_TS_KEY) || 0);
    const all = this.loadAllMessages();
    const fresh = all.filter(m => m.timestamp >= joinTs);

    if (fresh.length !== this.visibleMessages.length) {
      this.visibleMessages = fresh;
      this.shouldScroll = true;
    }

    // Refresh players list
    this.players = this.loadPlayers();
  }

  private scrollToBottom(): void {
    if (this.chatBox?.nativeElement) {
      const el = this.chatBox.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  // ── PLAYERS ───────────────────────────────────────

  private addPlayer(name: string): void {
    const key = `dicebound_mission_players_${this.missionId}`;
    const list = this.loadPlayers();
    if (!list.includes(name)) list.push(name);
    localStorage.setItem(key, JSON.stringify(list));
    this.players = list;
  }

  private removePlayer(name: string): void {
    if (!name) return;
    const key = `dicebound_mission_players_${this.missionId}`;
    const list = this.loadPlayers().filter(v => v !== name);
    localStorage.setItem(key, JSON.stringify(list));
  }

  private loadPlayers(): string[] {
    try {
      const key = `dicebound_mission_players_${this.missionId}`;
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  // ── NAV ───────────────────────────────────────────

  goBackToCharacters(): void {
    this.router.navigate(['/characters']);
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  // ── HELPERS ───────────────────────────────────────

  get bossHpPercent(): number {
    if (!this.bossMaxHp) return 100;
    return Math.round((this.bossCurrentHp / this.bossMaxHp) * 100);
  }

  get charHpPercent(): number {
    if (!this.charMaxHp) return 100;
    return Math.round((this.charCurrentHp / this.charMaxHp) * 100);
  }

  getDifficultyLabel(d: number): string {
    return ({ 1: 'Easy', 2: 'Normal', 3: 'Hard', 4: 'Elite', 5: 'Legendary' } as any)[d] || `Diff ${d}`;
  }

  getLogClass(line: string): string {
    if (line.includes('CRIT')) return 'log-crit';
    if (line.includes('defeated') || line.includes('LEVEL UP')) return 'log-victory';
    if (line.includes('died') || line.includes('❌')) return 'log-death';
    if (line.includes('Enemy hit')) return 'log-enemy';
    if (line.includes('Miss') && !line.includes('Enemy')) return 'log-miss';
    if (line.includes('Fight vs')) return 'log-fight';
    if (line.startsWith('Hit')) return 'log-hit';
    return '';
  }
}
