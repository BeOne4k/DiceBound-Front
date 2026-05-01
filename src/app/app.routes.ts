import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'auth', pathMatch: 'full' },

  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth-module')
        .then(m => m.AuthModule)
  },
  {
    path: 'missions',
    loadChildren: () =>
      import('./features/missions/missions-module')
        .then(m => m.MissionsModule)
  },
  {
    path: 'combat',
    loadChildren: () =>
      import('./features/combat/combat-module')
        .then(m => m.CombatModule)
  },
  {
    path: 'characters',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/characters/characters.component')
            .then(m => m.CharactersComponent)
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./pages/characters/create-character/create-character.component')
            .then(m => m.CreateCharacterComponent)
      }
    ]
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home/home.component')
        .then(m => m.HomeComponent)
  },
];
