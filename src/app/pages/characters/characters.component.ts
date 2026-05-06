import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CharacterService } from '../../core/services/character-service';

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
    this.router.navigate(['/characters/create']);
  }
}
