// cliente-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClientPageComponent } from './client-page/client-page.component';
import { WaitingResponseComponent } from './waiting-response/waiting-response.component';

const routes: Routes = [
  { path: 'client', component: ClientPageComponent },
  { path: 'client/waiting-response/:id', component: WaitingResponseComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClienteRoutingModule { }
