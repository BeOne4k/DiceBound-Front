import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Characters } from './characters.component';

const routes: Routes = [
  {
    path: '',
    component: Characters
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CharactersRoutingModule {}