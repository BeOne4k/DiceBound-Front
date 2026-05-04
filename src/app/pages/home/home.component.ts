import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [CommonModule]
})
export class HomeComponent implements OnInit {
  character: any = null;
  missions: any[] = [];
  loadingMissions = true;

  news = [
    { title: 'NEW BOSS: RAGNAROK', description: '1 boss is never enough. Enjoy the pain, chaos.' },
    { title: 'LMAO NEW BOSS ADDED 2', description: 'Laugh through your suffering, adventurer.' },
    { title: 'SKAONIA FUCKED UP', description: 'Ponol habiti' },
    { title: 'LMAO NEW BOSS ADDED 3', description: '2 bosses is not enough aswell, scrol.' },
    { title: 'NEW BOSS ADDED 4 LMAO', description: 'Just when you thought it was over.' },
    { title: 'PATCH 1.3 DEPLOYED', description: 'Fixed balance issues with fire elementals.' },
    { title: 'TAVERN UPDATE', description: 'New drinks and quests available at the tavern.' },
  ];

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    const savedChar = localStorage.getItem('selectedCharacter');
    if (savedChar) {
      this.character = JSON.parse(savedChar);
    } else {
      this.router.navigate(['/characters']);
      return;
    }

    this.loadMissions();
  }

  loadMissions() {
    const token = localStorage.getItem('token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    this.http.get<any[]>(`${environment.apiUrl}/Missions`, { headers }).subscribe({
      next: (res) => {
        this.missions = res;
        this.loadingMissions = false;
      },
      error: () => {
        this.missions = [
          { id: '1', name: 'Mission with Laughables', minLevel: 1, difficulty: 2, rewardExperience: 100 },
          { id: '2', name: 'Laughables 2', minLevel: 2, difficulty: 3, rewardExperience: 200 },
          { id: '3', name: 'Mission with Laughables 3', minLevel: 3, difficulty: 4, rewardExperience: 300 },
          { id: '4', name: '2Mission with Laughables', minLevel: 4, difficulty: 5, rewardExperience: 400 },
        ];
        this.loadingMissions = false;
      }
    });
  }

  goBackToCharacters() {
    this.router.navigate(['/characters']);
  }

  goToTavern() {
    this.router.navigate(['/tavern']);
  }

  getDifficultyLabel(difficulty: number): string {
    const labels: { [key: number]: string } = {
      1: 'Easy', 2: 'Normal', 3: 'Hard', 4: 'Elite', 5: 'Legendary'
    };
    return labels[difficulty] || `Difficulty ${difficulty}`;
  }
}
