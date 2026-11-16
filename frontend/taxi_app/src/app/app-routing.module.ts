import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomePageComponent } from './home/home-page/home-page.component';
import { GestorPageComponent } from './gestor/gestor-page/gestor-page.component';
import { MotoristaPageComponent } from './motoristas/motorista-page/motorista-page.component';
import { GerirTurnoComponent } from './turno/gerir-turno/gerir-turno.component';
import { ClientePageComponent } from './cliente/cliente-page/cliente-page.component';
import { GerirTaxisComponent } from './taxis/gerir-taxis/gerir-taxis.component';
import { GerirMotoristasComponent } from './motoristas/gerir-motoristas/gerir-motoristas.component';
import { GerirPrecosComponent } from './gerir-precos/gerir-precos.component';
import { SimularPrecoComponent } from './gerir-precos/simular-preco/simular-preco.component';
import { MotoristaLoginComponent } from './motoristas/motorista-login/motorista-login.component';
import { AguardarRespostaComponent } from './cliente/aguardar-resposta/aguardar-resposta.component';
import { ConfirmarViagemComponent } from './cliente/confirmar-viagem/confirmar-viagem.component';
import { PedidosPendentesComponent } from './motoristas/pedidos-pendentes/pedidos-pendentes.component';
import { TurnoFormComponent } from './turno/turno-form/turno-form.component';
import { PedidoAceitoComponent } from './motoristas/pedido-aceito/pedido-aceito.component';
import { AcompanharViagemComponent } from './cliente/acompanhar-viagem/acompanhar-viagem.component';
import { EditarMotoristaComponent } from './motoristas/editar-motorista/editar-motorista.component';
import { EditarTaxiComponent } from './taxis/editar-taxi/editar-taxi.component';
import { RelatoriosPageComponent } from './relatorios/relatorios-page/relatorios-page.component';
import { TotalHorasComponent } from './relatorios/total-horas/total-horas.component';
import { TotalKmsComponent } from './relatorios/total-kms/total-kms.component';
import { TotalViagensComponent } from './relatorios/total-viagens/total-viagens.component';
import { managerGuard, driverGuard } from './appServices/auth.guard';

const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'gestor', component: GestorPageComponent, canActivate: [managerGuard] },
  { path: 'gestor/gerir-taxis', component: GerirTaxisComponent, canActivate: [managerGuard] },
  { path: 'gestor/gerir-motoristas', component: GerirMotoristasComponent, canActivate: [managerGuard] },
  { path: 'gestor/gerir-precos', component: GerirPrecosComponent, canActivate: [managerGuard] },
  { path: 'gestor/gerir-precos/simulacao', component: SimularPrecoComponent, canActivate: [managerGuard] },
  { path: 'gestor/editar-motorista/:nif', component: EditarMotoristaComponent, canActivate: [managerGuard] },
  { path: 'gestor/editar-taxi/:licensePlate', component: EditarTaxiComponent, canActivate: [managerGuard] },
  { path: 'gestor/relatorios', component: RelatoriosPageComponent, canActivate: [managerGuard] },
  { path: 'gestor/relatorios/total-viagens', component: TotalViagensComponent, canActivate: [managerGuard] },
  { path: 'gestor/relatorios/total-horas', component: TotalHorasComponent, canActivate: [managerGuard] },
  { path: 'gestor/relatorios/total-kms', component: TotalKmsComponent, canActivate: [managerGuard] },

  { path: 'motorista', component: MotoristaLoginComponent },
  { path: 'motorista/:nif', component: MotoristaPageComponent, canActivate: [driverGuard] },
  { path: 'motorista/:nif/pedidos-pendentes', component: PedidosPendentesComponent, canActivate: [driverGuard] },
  { path: 'motorista/:nif/turnos', component: GerirTurnoComponent, canActivate: [driverGuard] },
  { path: 'motorista/:nif/turnos/registar-turno', component: TurnoFormComponent, canActivate: [driverGuard] },
  { path: 'motorista/pedido-aceito/:pedidoId', component: PedidoAceitoComponent, canActivate: [driverGuard] },

  { path: 'cliente', component: ClientePageComponent },
  { path: 'cliente/aguardar-resposta/:pedidoId', component: AguardarRespostaComponent },
  { path: 'cliente/confirmar-viagem/:pedidoId', component: ConfirmarViagemComponent },
  { path: 'cliente/acompanhar-viagem/:pedidoId', component: AcompanharViagemComponent},

  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
