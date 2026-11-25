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


import { DriverFormComponent } from './drivers/driver-form/driver-form.component';
import { DriverListComponent } from './drivers/driver-list/driver-list.component';
import { HomePageComponent } from './home/home-page/home-page.component';
import { ManagerPageComponent } from './manager/manager-page/manager-page.component';
import { DriverPageComponent } from './drivers/driver-page/driver-page.component';
import { ClientPageComponent } from './client/client-page/client-page.component';
import { TaxiListComponent } from './taxis/taxi-list/taxi-list.component';
import { ManageTaxisComponent } from './taxis/manage-taxis/manage-taxis.component';
import { ManageDriversComponent } from './drivers/manage-drivers/manage-drivers.component';
import { ManagePricesComponent } from './manage-prices/manage-prices.component';
import { SimulatePriceComponent } from './manage-prices/simulate-price/simulate-price.component';

import { TaxiFormComponent } from './taxis/taxi-form/taxi-form.component';
import { DriverLoginComponent } from './drivers/driver-login/driver-login.component';
import { RideRequestComponent } from './client/ride-request/ride-request.component';
import { ClientFormComponent } from './client/client-form/client-form.component';
import { WaitingResponseComponent } from './client/waiting-response/waiting-response.component';
import { ShiftFormComponent } from './shifts/shift-form/shift-form.component';
import { ConfirmTripComponent } from './client/confirm-trip/confirm-trip.component';
import { PendingRequestsComponent } from './drivers/pending-requests/pending-requests.component';
import { ManageShiftsComponent } from './shifts/manage-shifts/manage-shifts.component';
import { ShiftListComponent } from './shifts/shift-list/shift-list.component';
import { ShiftDetailComponent } from './shifts/shift-detail/shift-detail.component';
import { AcceptedRequestComponent } from './drivers/accepted-request/accepted-request.component';
import { TrackTripComponent } from './client/track-trip/track-trip.component';
import { ShareTripComponent } from './client/share-trip/share-trip.component';
import { EditDriverComponent } from './drivers/edit-driver/edit-driver.component';
import { EditTaxiComponent } from './taxis/edit-taxi/edit-taxi.component';
import { ReportsPageComponent } from './reports/reports-page/reports-page.component';
import { TotalTripsComponent } from './reports/total-trips/total-trips.component';
import { TotalHoursComponent } from './reports/total-hours/total-hours.component';
import { TotalKmsComponent } from './reports/total-kms/total-kms.component';
import { TotalRevenueComponent } from './reports/total-revenue/total-revenue.component';
import { ReportBreakdownComponent } from './reports/report-breakdown/report-breakdown.component';
import { TripChatComponent } from './shared/trip-chat/trip-chat.component';
import { AlertToggleComponent } from './shared/alert-toggle/alert-toggle.component';
import { DriverReviewsModalComponent } from './shared/driver-reviews-modal/driver-reviews-modal.component';
import { DriverEarningsComponent } from './drivers/driver-earnings/driver-earnings.component';
import { PhotoPickerComponent } from './shared/photo-picker/photo-picker.component';
import { ThemeToggleComponent } from './shared/theme-toggle/theme-toggle.component';

@NgModule({
  declarations: [
    AppComponent,
    DriverFormComponent,
    DriverListComponent,
    TaxiFormComponent,
    HomePageComponent,
    ManagerPageComponent,
    DriverPageComponent,
    ClientPageComponent,
    TaxiListComponent,
    ManageTaxisComponent,
    ManageDriversComponent,
    ManagePricesComponent,
    SimulatePriceComponent,
    DriverLoginComponent,
    RideRequestComponent,
    ClientFormComponent,
    WaitingResponseComponent,
    ShiftFormComponent,
    ConfirmTripComponent,
    PendingRequestsComponent,
    ManageShiftsComponent,
    ShiftListComponent,
    ShiftDetailComponent,
    AcceptedRequestComponent,
    TrackTripComponent,
    ShareTripComponent,
    EditDriverComponent,
    EditTaxiComponent,
    ReportsPageComponent,
    TotalTripsComponent,
    TotalHoursComponent,
    TotalKmsComponent,
    TotalRevenueComponent,
    ReportBreakdownComponent,
    TripChatComponent,
    AlertToggleComponent,
    DriverReviewsModalComponent,
    DriverEarningsComponent,
    PhotoPickerComponent,
    ThemeToggleComponent,
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
