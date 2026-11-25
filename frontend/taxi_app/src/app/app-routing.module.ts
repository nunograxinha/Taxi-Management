import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomePageComponent } from './home/home-page/home-page.component';
import { ManagerPageComponent } from './manager/manager-page/manager-page.component';
import { DriverPageComponent } from './drivers/driver-page/driver-page.component';
import { ManageShiftsComponent } from './shifts/manage-shifts/manage-shifts.component';
import { ClientPageComponent } from './client/client-page/client-page.component';
import { ManageTaxisComponent } from './taxis/manage-taxis/manage-taxis.component';
import { ManageDriversComponent } from './drivers/manage-drivers/manage-drivers.component';
import { ManagePricesComponent } from './manage-prices/manage-prices.component';
import { SimulatePriceComponent } from './manage-prices/simulate-price/simulate-price.component';
import { DriverLoginComponent } from './drivers/driver-login/driver-login.component';
import { WaitingResponseComponent } from './client/waiting-response/waiting-response.component';
import { ConfirmTripComponent } from './client/confirm-trip/confirm-trip.component';
import { PendingRequestsComponent } from './drivers/pending-requests/pending-requests.component';
import { DriverEarningsComponent } from './drivers/driver-earnings/driver-earnings.component';
import { ShiftFormComponent } from './shifts/shift-form/shift-form.component';
import { AcceptedRequestComponent } from './drivers/accepted-request/accepted-request.component';
import { TrackTripComponent } from './client/track-trip/track-trip.component';
import { ShareTripComponent } from './client/share-trip/share-trip.component';
import { EditDriverComponent } from './drivers/edit-driver/edit-driver.component';
import { EditTaxiComponent } from './taxis/edit-taxi/edit-taxi.component';
import { ReportsPageComponent } from './reports/reports-page/reports-page.component';
import { TotalHoursComponent } from './reports/total-hours/total-hours.component';
import { TotalKmsComponent } from './reports/total-kms/total-kms.component';
import { TotalTripsComponent } from './reports/total-trips/total-trips.component';
import { TotalRevenueComponent } from './reports/total-revenue/total-revenue.component';
import { managerGuard, driverGuard, clientGuard } from './appServices/auth.guard';

const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'manager', component: ManagerPageComponent, canActivate: [managerGuard] },
  { path: 'manager/manage-taxis', component: ManageTaxisComponent, canActivate: [managerGuard] },
  { path: 'manager/manage-drivers', component: ManageDriversComponent, canActivate: [managerGuard] },
  { path: 'manager/manage-prices', component: ManagePricesComponent, canActivate: [managerGuard] },
  { path: 'manager/manage-prices/simulation', component: SimulatePriceComponent, canActivate: [managerGuard] },
  { path: 'manager/edit-driver/:nif', component: EditDriverComponent, canActivate: [managerGuard] },
  { path: 'manager/edit-taxi/:licensePlate', component: EditTaxiComponent, canActivate: [managerGuard] },
  { path: 'manager/reports', component: ReportsPageComponent, canActivate: [managerGuard] },
  { path: 'manager/reports/total-trips', component: TotalTripsComponent, canActivate: [managerGuard] },
  { path: 'manager/reports/total-hours', component: TotalHoursComponent, canActivate: [managerGuard] },
  { path: 'manager/reports/total-kms', component: TotalKmsComponent, canActivate: [managerGuard] },
  { path: 'manager/reports/total-revenue', component: TotalRevenueComponent, canActivate: [managerGuard] },

  { path: 'driver', component: DriverLoginComponent },
  { path: 'driver/accepted-request/:pedidoId', component: AcceptedRequestComponent, canActivate: [driverGuard] },
  {
    path: 'driver/portal',
    component: DriverPageComponent,
    canActivate: [driverGuard],
    children: [
      { path: 'pending-requests', component: PendingRequestsComponent },
      { path: 'shifts', component: ManageShiftsComponent },
      { path: 'shifts/register-shift', component: ShiftFormComponent },
      { path: 'earnings', component: DriverEarningsComponent }
    ]
  },

  { path: 'client', component: ClientPageComponent },
  { path: 'client/waiting-response/:pedidoId', component: WaitingResponseComponent, canActivate: [clientGuard] },
  { path: 'client/confirm-trip/:pedidoId', component: ConfirmTripComponent, canActivate: [clientGuard] },
  { path: 'client/track-trip/:pedidoId', component: TrackTripComponent, canActivate: [clientGuard] },
  { path: 'share-trip/:shareToken', component: ShareTripComponent },

  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
