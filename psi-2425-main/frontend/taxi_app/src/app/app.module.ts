import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
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


import { MotoristaFormComponent } from './motoristas/motorista-form/motorista-form.component';
import { MotoristaListComponent } from './motoristas/motorista-list/motorista-list.component';
import { HomePageComponent } from './home/home-page/home-page.component';
import { GestorPageComponent } from './gestor/gestor-page/gestor-page.component';
import { MotoristaPageComponent } from './motoristas/motorista-page/motorista-page.component';
import { ClientePageComponent } from './cliente/cliente-page/cliente-page.component';
import { VerTaxisComponent } from './taxis/ver-taxis/ver-taxis.component';
import { GerirTaxisComponent } from './taxis/gerir-taxis/gerir-taxis.component';
import { GerirMotoristasComponent } from './motoristas/gerir-motoristas/gerir-motoristas.component';
import { GerirPrecosComponent } from './gerir-precos/gerir-precos.component';
import { SimularPrecoComponent } from './gerir-precos/simular-preco/simular-preco.component';

import { TaxiFormComponent } from './taxis/taxi-form/taxi-form.component';
import { MotoristaLoginComponent } from './motoristas/motorista-login/motorista-login.component';
import { PedidoViagemComponent } from './cliente/pedido-viagem/pedido-viagem.component';
import { ClienteFormComponent } from './cliente/cliente-form/cliente-form.component';
import { AguardarRespostaComponent } from './cliente/aguardar-resposta/aguardar-resposta.component';
import { TurnoFormComponent } from './turno/turno-form/turno-form.component';
import { ConfirmarViagemComponent } from './cliente/confirmar-viagem/confirmar-viagem.component';
import { PedidosPendentesComponent } from './motoristas/pedidos-pendentes/pedidos-pendentes.component';
import { GerirTurnoComponent } from './turno/gerir-turno/gerir-turno.component';
import { TurnoListComponent } from './turno/turno-list/turno-list.component';
import { VerTurnoComponent } from './turno/ver-turno/ver-turno.component';
import { PedidoAceitoComponent } from './motoristas/pedido-aceito/pedido-aceito.component';
import { AcompanharViagemComponent } from './cliente/acompanhar-viagem/acompanhar-viagem.component';
import { EditarMotoristaComponent } from './motoristas/editar-motorista/editar-motorista.component';
import { EditarTaxiComponent } from './taxis/editar-taxi/editar-taxi.component';
import { RelatoriosPageComponent } from './relatorios/relatorios-page/relatorios-page.component';
import { TotalViagensComponent } from './relatorios/total-viagens/total-viagens.component';
import { TotalHorasComponent } from './relatorios/total-horas/total-horas.component';
import { TotalKmsComponent } from './relatorios/total-kms/total-kms.component';

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
    TaxiFormComponent,
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
    MatListModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
