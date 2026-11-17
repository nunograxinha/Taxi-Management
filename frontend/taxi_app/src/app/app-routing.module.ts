import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomePageComponent } from './home/home-page/home-page.component';
import { GestorPageComponent } from './manager/manager-page/manager-page.component';
import { MotoristaPageComponent } from './drivers/driver-page/driver-page.component';
import { GerirTurnoComponent } from './shifts/manage-shifts/manage-shifts.component';
import { ClientePageComponent } from './client/client-page/client-page.component';
import { GerirTaxisComponent } from './taxis/manage-taxis/manage-taxis.component';
import { GerirMotoristasComponent } from './drivers/manage-drivers/manage-drivers.component';
import { GerirPrecosComponent } from './manage-prices/manage-prices.component';
import { SimularPrecoComponent } from './manage-prices/simulate-price/simulate-price.component';
import { MotoristaLoginComponent } from './drivers/driver-login/driver-login.component';
import { AguardarRespostaComponent } from './client/waiting-response/waiting-response.component';
import { ConfirmarViagemComponent } from './client/confirm-trip/confirm-trip.component';
import { PedidosPendentesComponent } from './drivers/pending-requests/pending-requests.component';
import { TurnoFormComponent } from './shifts/shift-form/shift-form.component';
import { PedidoAceitoComponent } from './drivers/accepted-request/accepted-request.component';
import { AcompanharViagemComponent } from './client/track-trip/track-trip.component';
import { EditarMotoristaComponent } from './drivers/edit-driver/edit-driver.component';
import { EditarTaxiComponent } from './taxis/edit-taxi/edit-taxi.component';
import { RelatoriosPageComponent } from './reports/reports-page/reports-page.component';
import { TotalHorasComponent } from './reports/total-hours/total-hours.component';
import { TotalKmsComponent } from './reports/total-kms/total-kms.component';
import { TotalViagensComponent } from './reports/total-trips/total-trips.component';
import { TotalRevenueComponent } from './reports/total-revenue/total-revenue.component';
import { managerGuard, driverGuard } from './appServices/auth.guard';

const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'manager', component: GestorPageComponent, canActivate: [managerGuard] },
  { path: 'manager/manage-taxis', component: GerirTaxisComponent, canActivate: [managerGuard] },
  { path: 'manager/manage-drivers', component: GerirMotoristasComponent, canActivate: [managerGuard] },
  { path: 'manager/manage-prices', component: GerirPrecosComponent, canActivate: [managerGuard] },
  { path: 'manager/manage-prices/simulation', component: SimularPrecoComponent, canActivate: [managerGuard] },
  { path: 'manager/edit-driver/:nif', component: EditarMotoristaComponent, canActivate: [managerGuard] },
  { path: 'manager/edit-taxi/:licensePlate', component: EditarTaxiComponent, canActivate: [managerGuard] },
  { path: 'manager/reports', component: RelatoriosPageComponent, canActivate: [managerGuard] },
  { path: 'manager/reports/total-trips', component: TotalViagensComponent, canActivate: [managerGuard] },
  { path: 'manager/reports/total-hours', component: TotalHorasComponent, canActivate: [managerGuard] },
  { path: 'manager/reports/total-kms', component: TotalKmsComponent, canActivate: [managerGuard] },
  { path: 'manager/reports/total-revenue', component: TotalRevenueComponent, canActivate: [managerGuard] },

  { path: 'driver', component: MotoristaLoginComponent },
  { path: 'driver/accepted-request/:pedidoId', component: PedidoAceitoComponent, canActivate: [driverGuard] },
  {
    path: 'driver/:nif',
    component: MotoristaPageComponent,
    canActivate: [driverGuard],
    children: [
      { path: 'pending-requests', component: PedidosPendentesComponent },
      { path: 'shifts', component: GerirTurnoComponent },
      { path: 'shifts/register-shift', component: TurnoFormComponent }
    ]
  },

  { path: 'gestor', redirectTo: 'manager', pathMatch: 'full' },
  { path: 'motorista', redirectTo: 'driver', pathMatch: 'full' },

  { path: 'client', component: ClientePageComponent },
  { path: 'client/waiting-response/:pedidoId', component: AguardarRespostaComponent },
  { path: 'client/confirm-trip/:pedidoId', component: ConfirmarViagemComponent },
  { path: 'client/track-trip/:pedidoId', component: AcompanharViagemComponent},
  { path: 'cliente', redirectTo: 'client', pathMatch: 'full' },

  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
