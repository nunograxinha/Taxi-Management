// cliente-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClientePageComponent } from './cliente-page/cliente-page.component';
import { AguardarRespostaComponent } from './aguardar-resposta/aguardar-resposta.component';

const routes: Routes = [
  { path: 'cliente', component: ClientePageComponent },
  { path: 'cliente/aguardar-resposta/:id', component: AguardarRespostaComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClienteRoutingModule { }
