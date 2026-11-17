// cliente-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClientePageComponent } from './client-page/client-page.component';
import { AguardarRespostaComponent } from './waiting-response/waiting-response.component';

const routes: Routes = [
  { path: 'client', component: ClientePageComponent },
  { path: 'client/waiting-response/:id', component: AguardarRespostaComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClienteRoutingModule { }
