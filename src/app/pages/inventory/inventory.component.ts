import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss'],
  imports: [CommonModule]
})
export class InventoryComponent implements OnInit {

  character: any = null;
  items: any[] = [];
  loading = true;
  error: string | null = null;

  // Сохранённые для отображения в топ-баре
  charName    = '';
  charLevel   = '';
  charHp      = '';
  charMaxHp   = '';
  charRace    = '';

  // Context menu
  ctxVisible = false;
  ctxX = 0;
  ctxY = 0;
  ctxItem: any = null;

  @HostListener('document:click')
  onDocClick() { this.ctxVisible = false; }

  @HostListener('document:contextmenu', ['$event'])
  onDocCtx(e: MouseEvent) {
    // Закрываем если клик не по строке таблицы
    const target = e.target as HTMLElement;
    if (!target.closest('.table-row')) this.ctxVisible = false;
  }

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    const saved = localStorage.getItem('selectedCharacter');
    if (!saved) {
      this.router.navigate(['/characters']);
      return;
    }

    this.character = JSON.parse(saved);
    const c = this.character;

    this.charName   = c.name   || c.Name   || '';
    this.charLevel  = c.level  || c.Level  || '?';
    this.charHp     = c.hp     || c.HP     || '?';
    this.charMaxHp  = c.hp     || c.HP     || '?';
    this.charRace   = c.raceName || c.RaceName || '';

    const charId = c.id || c.Id;
    if (!charId) {
      this.error = 'Character not found';
      this.loading = false;
      return;
    }

    const token = localStorage.getItem('token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    this.http.get<any[]>(`${environment.apiUrl}/Characters/${charId}/inventory`, { headers }).subscribe({
      next: (res) => {
        this.items = res;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load inventory';
        this.loading = false;
      }
    });
  }

  goBackToCharacters(): void {
    this.router.navigate(['/characters']);
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  onRowRightClick(e: MouseEvent, item: any): void {
    e.preventDefault();
    e.stopPropagation();
    this.ctxX = e.clientX;
    this.ctxY = e.clientY;
    this.ctxItem = item;
    this.ctxVisible = true;
  }

  deleteItem(): void {
    if (!this.ctxItem) return;
    this.ctxVisible = false;

    const charId = this.character?.id || this.character?.Id;
    const invItemId = this.ctxItem.id || this.ctxItem.Id;
    const token = localStorage.getItem('token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    this.http.delete(`${environment.apiUrl}/Characters/${charId}/inventory/${invItemId}`, { headers })
      .subscribe({
        next: () => {
          this.items = this.items.filter(i => (i.id || i.Id) !== invItemId);
        },
        error: () => {
          this.error = 'Failed to delete item';
        }
      });
  }

  getRarityClass(rarity: string): string {
    return 'rarity-' + (rarity || 'Common').toLowerCase();
  }


  getModifierLabel(modifier: number): string {
    if (!modifier) return '';
    return modifier > 0 ? `+${modifier}` : `${modifier}`;
  }

  getDiceLabel(item: any): string {
    const count = item.diceCount || item.DiceCount || 0;
    const sides = item.diceSides || item.DiceSides || 0;
    const mod   = item.modifier  || item.Modifier  || 0;
    if (!count || !sides) return '—';
    const base = `${count}d${sides}`;
    return mod ? `${base} ${mod > 0 ? '+' : ''}${mod}` : base;
  }
}
