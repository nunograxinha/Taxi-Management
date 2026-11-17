import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './appServices/auth.interceptor';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatSnackBarModule } from '@angular/material/snack-bar';


import { MotoristaFormComponent } from './drivers/driver-form/driver-form.component';
import { MotoristaListComponent } from './drivers/driver-list/driver-list.component';
import { HomePageComponent } from './home/home-page/home-page.component';
import { GestorPageComponent } from './manager/manager-page/manager-page.component';
import { MotoristaPageComponent } from './drivers/driver-page/driver-page.component';
import { ClientePageComponent } from './client/client-page/client-page.component';
import { VerTaxisComponent } from './taxis/taxi-list/taxi-list.component';
import { GerirTaxisComponent } from './taxis/manage-taxis/manage-taxis.component';
import { GerirMotoristasComponent } from './drivers/manage-drivers/manage-drivers.component';
import { GerirPrecosComponent } from './manage-prices/manage-prices.component';
import { SimularPrecoComponent } from './manage-prices/simulate-price/simulate-price.component';

import { TaxiFormComponent } from './taxis/taxi-form/taxi-form.component';
import { MotoristaLoginComponent } from './drivers/driver-login/driver-login.component';
import { PedidoViagemComponent } from './client/ride-request/ride-request.component';
import { ClienteFormComponent } from './client/client-form/client-form.component';
import { AguardarRespostaComponent } from './client/waiting-response/waiting-response.component';
import { TurnoFormComponent } from './shifts/shift-form/shift-form.component';
import { ConfirmarViagemComponent } from './client/confirm-trip/confirm-trip.component';
import { PedidosPendentesComponent } from './drivers/pending-requests/pending-requests.component';
import { GerirTurnoComponent } from './shifts/manage-shifts/manage-shifts.component';
import { TurnoListComponent } from './shifts/shift-list/shift-list.component';
import { VerTurnoComponent } from './shifts/shift-detail/shift-detail.component';
import { PedidoAceitoComponent } from './drivers/accepted-request/accepted-request.component';
import { AcompanharViagemComponent } from './client/track-trip/track-trip.component';
import { EditarMotoristaComponent } from './drivers/edit-driver/edit-driver.component';
import { EditarTaxiComponent } from './taxis/edit-taxi/edit-taxi.component';
import { RelatoriosPageComponent } from './reports/reports-page/reports-page.component';
import { TotalViagensComponent } from './reports/total-trips/total-trips.component';
import { TotalHorasComponent } from './reports/total-hours/total-hours.component';
import { TotalKmsComponent } from './reports/total-kms/total-kms.component';
import { TotalRevenueComponent } from './reports/total-revenue/total-revenue.component';
import { ReportBreakdownComponent } from './reports/report-breakdown/report-breakdown.component';

@NgModule({
  declarations: [
    AppComponent,
    MotoristaFormComponent,
    MotoristaListComponent,
    TaxiFormComponent,
    HomePageComponent,
    GestorPageComponent,
    MotoristaPageComponent,
    ClientePageComponent,
    VerTaxisComponent,
    GerirTaxisComponent,
    GerirMotoristasComponent,
    GerirPrecosComponent,
    SimularPrecoComponent,
    MotoristaLoginComponent,
    PedidoViagemComponent,
    ClienteFormComponent,
    AguardarRespostaComponent,
    TurnoFormComponent,
    ConfirmarViagemComponent,
    PedidosPendentesComponent,
    GerirTurnoComponent,
    TurnoListComponent,
    VerTurnoComponent,
    PedidoAceitoComponent,
    AcompanharViagemComponent,
    EditarMotoristaComponent,
    EditarTaxiComponent,
    RelatoriosPageComponent,
    TotalViagensComponent,
    TotalHorasComponent,
    TotalKmsComponent,
    TotalRevenueComponent,
    ReportBreakdownComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatToolbarModule,
    MatSelectModule,
    MatSidenavModule,
    MatListModule,
    MatSnackBarModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
