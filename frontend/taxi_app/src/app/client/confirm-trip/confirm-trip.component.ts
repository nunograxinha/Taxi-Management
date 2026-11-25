import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { RideRequestService } from '../../appServices/ride-request.service';
import { RideRequest } from '../ride-request.interface';
import { Driver } from '../../drivers/driver.interface';
import { Taxi } from '../../taxis/taxi.interface';
import { ShiftService } from '../../appServices/shift.service';
import { TaxiService } from '../../appServices/taxi.service';
import { DriverService } from '../../appServices/driver.service';
import { GeolocationService } from '../../appServices/geolocation.service';
import { PriceService } from '../../appServices/price.service';
import { RouteEstimateService } from '../../appServices/route-estimate.service';
import { getTaxiCarImage } from '../../appServices/taxi-icon.util';

@Component({
  selector: 'app-confirmar-viagem',
  templateUrl: './confirm-trip.component.html',
  styleUrls: ['./confirm-trip.component.css']
})
export class ConfirmTripComponent implements OnInit {
  pedido: RideRequest | null = null;
  motorista: Driver | null = null;
  taxi: Taxi | null = null;
  loading = true;
  erro = '';
  entryCidadeRua = '';
  exitCidadeRua = '';
  distanciaEstimadaKm = 0;
  tempoEstimadoMin = 0;
  etaMotoristaMin = 0;
  nightSurcharge = 0;
  hasNightRate = false;

  get taxiCarImage(): string {
    return getTaxiCarImage(this.taxi?.brand, this.taxi?.model);
  }
  custoEstimado = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pedidoViagemService: RideRequestService,
    private taxiService: TaxiService,
    private motoristaService: DriverService,
    private geolocationService: GeolocationService,
    private precoService: PriceService,
    private routeEstimateService: RouteEstimateService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    const pedidoId = this.route.snapshot.paramMap.get('pedidoId');
    if (!pedidoId) {
      this.erro = 'Invalid ride request ID';
      this.loading = false;
      return;
    }
    this.carregarDados(pedidoId);
  }

  async carregarDados(pedidoId: string) {
    try {
      const pedidoResponse = await firstValueFrom(this.pedidoViagemService.getRideRequestById(pedidoId));
      if (!pedidoResponse) {
        throw new Error('Ride request not found');
      }
      this.pedido = pedidoResponse;

      if (!this.pedido.driverId) {
        throw new Error('This ride request does not have an assigned driver');
      }

      if (!this.pedido.taxi) {
        throw new Error('This ride request does not have an assigned taxi');
      }

      const [motoristaResponse, taxiResponse, preco] = await Promise.all([
        firstValueFrom(this.motoristaService.getDriverById(this.pedido.driverId)),
        firstValueFrom(this.taxiService.getTaxiById(this.pedido.taxi)),
        firstValueFrom(this.precoService.getPrice())
      ]);

      if (!motoristaResponse) {
        throw new Error('Driver not found');
      }
      this.motorista = motoristaResponse;

      if (!taxiResponse) {
        throw new Error('Taxi not found');
      }
      this.taxi = taxiResponse;

      if (!preco) {
        throw new Error('Price not found');
      }

      const pickup = this.routeEstimateService.parseCoords(this.pedido.entryAddress);
      const dest = this.routeEstimateService.parseCoords(this.pedido.exitAddress);

      const [entryLabel, exitLabel, routeEst] = await Promise.all([
        this.pedido.entryAddressLabel
          ? Promise.resolve(this.pedido.entryAddressLabel)
          : this.geolocationService.resolveDisplayAddress(this.pedido.entryAddress),
        this.pedido.exitAddressLabel
          ? Promise.resolve(this.pedido.exitAddressLabel)
          : this.geolocationService.resolveDisplayAddress(this.pedido.exitAddress),
        pickup && dest
          ? this.routeEstimateService.getRouteEstimate(pickup, dest)
          : Promise.resolve({ distanceKm: 0, durationMin: 1, fromOsrm: false })
      ]);

      this.entryCidadeRua = entryLabel;
      this.exitCidadeRua = exitLabel;
      this.distanciaEstimadaKm = routeEst.distanceKm;
      this.tempoEstimadoMin = routeEst.durationMin;
      this.etaMotoristaMin = this.routeEstimateService.estimateArrivalMinutesFromRoadKm(this.pedido.distanceKmToDriver);

      const fare = this.routeEstimateService.computeEstimatedFare(
        preco,
        taxiResponse.confort as 'Basic' | 'Luxury',
        this.tempoEstimadoMin
      );
      this.custoEstimado = fare.total;
      this.hasNightRate = fare.hasNight;
      this.nightSurcharge = preco.nightTimeSurcharge || 0;

      this.loading = false;
    } catch (error) {
      console.error('Error loading data:', error);
      this.erro = error instanceof Error ? error.message : 'Error loading trip data';
      this.loading = false;
    }
  }  

  async aceitarMotorista() {
    if (!this.pedido){
      console.error('Ride request not found');
      return;
    }
    try {
      this.pedidoViagemService.acceptClient(this.pedido._id!).subscribe({
        next: (res) => {
          this.snackBar.open('Ride request confirmed successfully!', 'Close', { duration: 3500 });
          console.log("response:", res);
          localStorage.setItem('pedidoId', this.pedido!._id!);
          this.router.navigate(['/client/track-trip', this.pedido!._id!]);
        },
        error: (err) => {
          console.error('Error accepting driver:', err);
          this.erro = 'Error accepting driver';
        }
      });
    } catch (error) {
      console.error('Error accepting driver:', error);
      this.erro = 'Error accepting driver';
      }
  }

  async recusarMotorista() {
    const pedidoId = this.pedido?._id ?? this.route.snapshot.paramMap.get('pedidoId');
    if (!pedidoId) {
      this.erro = 'Could not identify the ride request.';
      return;
    }

    try {
      await firstValueFrom(this.pedidoViagemService.rejectDriver(pedidoId, this.pedido?.driverId));
      this.router.navigate(['/client/waiting-response', pedidoId]);
    } catch (error) {
      console.error('Error rejecting driver:', error);
      this.erro = 'Error rejecting driver. Please try again.';
    }
  }

  get showNightWarning(): boolean {
    return this.hasNightRate;
  }

}