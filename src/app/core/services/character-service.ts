import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CharacterService {

  private apiUrl = `${environment.apiUrl}/Characters`;
  private racesUrl = `${environment.apiUrl}/Races`;

  constructor(private http: HttpClient) {}

  getMyCharacters() {
    return this.http.get<any[]>(`${this.apiUrl}/my`);
  }

  getRaces() {
    return this.http.get<any[]>(this.racesUrl);
  }

  // userId убран — бэкенд берёт его сам из JWT-токена
  createCharacter(dto: { raceId: string; name: string }) {
    return this.http.post<any>(this.apiUrl, dto);
  }
}