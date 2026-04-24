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
    path: 'characters',
    loadChildren: () =>
        import('./features/characters/characters-module')
        .then(m => m.CharactersModule)
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

];