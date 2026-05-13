import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

type Tab = 'items' | 'bosses' | 'missions' | 'races';

@Component({
  standalone: true,
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class AdminComponent implements OnInit {

  // ── AUTH ──────────────────────────────────────
  authenticated = false;
  passwordInput = '';
  passwordError = false;
  readonly ADMIN_PASSWORD = '123123123';

  // ── TABS ──────────────────────────────────────
  activeTab: Tab = 'items';

  // ── LISTS ─────────────────────────────────────
  items: any[]    = [];
  bosses: any[]   = [];
  missions: any[] = [];
  races: any[]    = [];

  showRaceForm = false;
raceForm = {
  name: '',
  baseStrength: 10,
  baseDexterity: 10,
  baseConstitution: 10,
  baseIntelligence: 10
};

  loadingItems    = false;
  loadingBosses   = false;
  loadingMissions = false;
  loadingRaces    = false;

  // ── TOAST ─────────────────────────────────────
  toast: { msg: string; type: 'ok' | 'err' } | null = null;

  // ── FORMS ─────────────────────────────────────
  showItemForm    = false;
  showBossForm    = false;
  showMissionForm = false;

  itemForm = { name: '', type: 'Weapon', rarity: 'Common', diceCount: 1, diceSides: 6, modifier: 0, img: '' };
  bossForm = { name: '', requiredLevel: 1, hp: 100, armorClass: 14, xpValue: 100 };
  missionForm = { name: '', minLevel: 1, difficulty: 1, rewardExperience: 100, bossId: '' };

  itemTypes    = ['Weapon', 'Armor', 'Accessory'];
  itemRarities = ['Common', 'Rare', 'Epic', 'Legendary'];
  difficulties = [1, 2, 3, 4, 5];
  diffLabels: Record<number,string> = { 1:'Easy', 2:'Normal', 3:'Hard', 4:'Elite', 5:'Legendary' };

  // ── DELETE confirms ───────────────────────────
  confirmDelete: { type: string; id: string; name: string } | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const saved = sessionStorage.getItem('dicebound_admin');
    if (saved === '1') {
      this.authenticated = true;
      this.loadAll();
    }
  }

  // ── LOGIN ─────────────────────────────────────
  login(): void {
    if (this.passwordInput === this.ADMIN_PASSWORD) {
      this.authenticated = true;
      this.passwordError = false;
      sessionStorage.setItem('dicebound_admin', '1');
      this.loadAll();
    } else {
      this.passwordError = true;
      this.passwordInput = '';
    }
  }

  logout(): void {
    sessionStorage.removeItem('dicebound_admin');
    this.authenticated = false;
  }

  // ── LOAD ──────────────────────────────────────
  loadAll(): void {
    this.loadItems();
    this.loadBosses();
    this.loadMissions();
    this.loadRaces();
  }

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  loadItems(): void {
    this.loadingItems = true;
    this.http.get<any[]>(`${environment.apiUrl}/Items`, { headers: this.headers() }).subscribe({
      next: r => { this.items = r; this.loadingItems = false; },
      error: () => { this.loadingItems = false; }
    });
  }

  loadBosses(): void {
    this.loadingBosses = true;
    this.http.get<any[]>(`${environment.apiUrl}/Bosses`, { headers: this.headers() }).subscribe({
      next: r => { this.bosses = r; this.loadingBosses = false; },
      error: () => { this.loadingBosses = false; }
    });
  }

  loadMissions(): void {
    this.loadingMissions = true;
    this.http.get<any[]>(`${environment.apiUrl}/Missions`, { headers: this.headers() }).subscribe({
      next: r => { this.missions = r; this.loadingMissions = false; },
      error: () => { this.loadingMissions = false; }
    });
  }


  loadRaces(): void {
    this.loadingRaces = true;
    this.http.get<any[]>(`${environment.apiUrl}/Races`, { headers: this.headers() }).subscribe({
      next: r => { this.races = r; this.loadingRaces = false; },
      error: () => { this.loadingRaces = false; }
    });
  }

  // ── CREATE ────────────────────────────────────
  createItem(): void {
    if (!this.itemForm.name.trim()) return;
    this.http.post<any>(`${environment.apiUrl}/Items`, this.itemForm, { headers: this.headers() }).subscribe({
      next: r => {
        this.items.unshift(r);
        this.resetItemForm();
        this.showToast('Item created', 'ok');
      },
      error: () => this.showToast('Failed to create item', 'err')
    });
  }

  createBoss(): void {
    if (!this.bossForm.name.trim()) return;
    this.http.post<any>(`${environment.apiUrl}/Bosses`, this.bossForm, { headers: this.headers() }).subscribe({
      next: r => {
        this.bosses.unshift(r);
        this.resetBossForm();
        this.showToast('Boss created', 'ok');
      },
      error: () => this.showToast('Failed to create boss', 'err')
    });
  }

  createMission(): void {
    if (!this.missionForm.name.trim()) return;
    const dto: any = { ...this.missionForm };
    if (!dto.bossId) delete dto.bossId;
    this.http.post<any>(`${environment.apiUrl}/Missions`, dto, { headers: this.headers() }).subscribe({
      next: r => {
        this.missions.unshift(r);
        this.resetMissionForm();
        this.showToast('Mission created', 'ok');
      },
      error: () => this.showToast('Failed to create mission', 'err')
    });
  }


  createRace(): void {
    if (!this.raceForm.name.trim()) return;
    this.http.post<any>(`${environment.apiUrl}/Races`, this.raceForm, { headers: this.headers() }).subscribe({
      next: r => {
        this.races.unshift(r);
        this.resetRaceForm();
        this.showToast('Race created', 'ok');
      },
      error: () => this.showToast('Failed to create race', 'err')
    });
  }

  // ── DELETE ────────────────────────────────────
  askDelete(type: string, id: string, name: string): void {
    this.confirmDelete = { type, id, name };
  }

  doDelete(): void {
    if (!this.confirmDelete) return;
    const { type, id } = this.confirmDelete;
    const url = `${environment.apiUrl}/${type}/${id}`;
    this.http.delete(url, { headers: this.headers() }).subscribe({
      next: () => {
        if (type === 'Items')    this.items    = this.items.filter(x => (x.id||x.Id) !== id);
        if (type === 'Bosses')   this.bosses   = this.bosses.filter(x => (x.id||x.Id) !== id);
        if (type === 'Missions') this.missions = this.missions.filter(x => (x.id||x.Id) !== id);
        if (type === 'Races')    this.races    = this.races.filter(x => (x.id||x.Id) !== id);
        this.showToast('Deleted', 'ok');
        this.confirmDelete = null;
      },
      error: () => { this.showToast('Failed to delete', 'err'); this.confirmDelete = null; }
    });
  }

  // ── MISSION REWARD ────────────────────────────
  addReward(missionId: string, itemId: string, qty: number = 1): void {
    this.http.post(`${environment.apiUrl}/Missions/${missionId}/rewards`, { itemId, quantity: qty }, { headers: this.headers() }).subscribe({
      next: () => { this.loadMissions(); this.showToast('Reward added', 'ok'); },
      error: () => this.showToast('Failed to add reward', 'err')
    });
  }

  // expanded mission for reward assignment
  expandedMission: string | null = null;
  rewardItemId: Record<string, string> = {};
  rewardQty:    Record<string, number> = {};

  toggleExpand(id: string): void {
    this.expandedMission = this.expandedMission === id ? null : id;
    if (!this.rewardQty[id]) this.rewardQty[id] = 1;
  }

  submitReward(missionId: string): void {
    const itemId = this.rewardItemId[missionId];
    if (!itemId) return;
    this.addReward(missionId, itemId, this.rewardQty[missionId] || 1);
    this.rewardItemId[missionId] = '';
  }

  removeReward(missionId: string, rewardId: string): void {
    this.http.delete(`${environment.apiUrl}/Missions/${missionId}/rewards/${rewardId}`, { headers: this.headers() }).subscribe({
      next: () => { this.loadMissions(); this.showToast('Reward removed', 'ok'); },
      error: () => this.showToast('Failed', 'err')
    });
  }

  // ── HELPERS ───────────────────────────────────
  private showToast(msg: string, type: 'ok' | 'err'): void {
    this.toast = { msg, type };
    setTimeout(() => this.toast = null, 3000);
  }

  resetItemForm():    void { this.itemForm    = { name: '', type: 'Weapon', rarity: 'Common', diceCount: 1, diceSides: 6, modifier: 0, img: '' }; this.showItemForm = false; }
  resetBossForm():    void { this.bossForm    = { name: '', requiredLevel: 1, hp: 100, armorClass: 14, xpValue: 100 }; this.showBossForm = false; }
  resetMissionForm(): void { this.missionForm = { name: '', minLevel: 1, difficulty: 1, rewardExperience: 100, bossId: '' }; this.showMissionForm = false; }
resetRaceForm(): void {
  this.raceForm = {
    name: '',
    baseStrength: 10,
    baseDexterity: 10,
    baseConstitution: 10,
    baseIntelligence: 10
  };
  this.showRaceForm = false;
}

  getId(obj: any): string { return obj.id || obj.Id || ''; }
  getName(obj: any): string { return obj.name || obj.Name || ''; }
  getBossName(id: string): string { return this.bosses.find(b => this.getId(b) === id)?.name || this.bosses.find(b => this.getId(b) === id)?.Name || '—'; }
}
