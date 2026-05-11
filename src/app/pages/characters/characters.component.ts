import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CharacterService } from '../../core/services/character-service';

const FREE_LIMIT = 3;

@Component({
  standalone: true,
  selector: 'app-characters',
  templateUrl: './characters.component.html',
  styleUrls: ['./characters.component.scss'],
  imports: [CommonModule]
})
export class CharactersComponent implements OnInit {

  characters: any[] = [];
  loading = true;
  error: string | null = null;
  selectedCharacter: any = null;
  showLimitModal = false;

  constructor(
    private characterService: CharacterService,
    private router: Router
  ) {}

  ngOnInit() {
    const saved = localStorage.getItem('selectedCharacter');
    if (saved) {
      this.selectedCharacter = JSON.parse(saved);
    }

    this.characterService.getMyCharacters().subscribe({
      next: (res: any) => {
        this.characters = res;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load characters';
        this.loading = false;
      }
    });
  }

  selectCharacter(char: any) {
    this.selectedCharacter = char;
    localStorage.setItem('selectedCharacter', JSON.stringify(char));
    this.router.navigate(['/home']);
  }

  goToCreate() {
    if (this.characters.length < FREE_LIMIT || this.hasActiveSubscription()) {
      this.router.navigate(['/characters/create']);
    } else {
      this.showLimitModal = true;
    }
  }

  hasActiveSubscription(): boolean {
    try {
      const raw = localStorage.getItem('dicebound_subscription');
      if (!raw) return false;
      const sub = JSON.parse(raw);
      if (!sub.active) return false;
      return new Date(sub.expiresAt) > new Date();
    } catch {
      return false;
    }
  }

  goToSubscription() {
    this.showLimitModal = false;
    this.router.navigate(['/subscription']);
  }

  closeLimitModal() {
    this.showLimitModal = false;
  }
}
