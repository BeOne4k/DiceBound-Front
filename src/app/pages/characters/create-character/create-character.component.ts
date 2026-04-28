import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CharacterService } from '../../../core/services/character-service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-create-character',
  templateUrl: './create-character.component.html',
  styleUrls: ['./create-character.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class CreateCharacterComponent implements OnInit {

  characterName = '';
  selectedRaceId = '';
  races: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private characterService: CharacterService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.characterService.getRaces().subscribe({
      next: (res) => this.races = res,
      error: () => this.error = 'Could not load races.'
    });
  }

 create(): void {
  if (!this.characterName || !this.selectedRaceId) {
    this.error = 'Fill all fields';
    return;
  }

  const token = this.authService.getToken();
  if (!token) {
    this.router.navigate(['/auth']);
    return;
  }

  this.loading = true;

  this.characterService.createCharacter({
    name: this.characterName,
    raceId: this.selectedRaceId,
  }).subscribe({
    next: () => {
      this.router.navigate(['/characters']);
    },
    error: () => {
      this.error = 'Create failed';
      this.loading = false;
    }
  });
}

  cancel() {
    this.router.navigate(['/characters']);
  }
}