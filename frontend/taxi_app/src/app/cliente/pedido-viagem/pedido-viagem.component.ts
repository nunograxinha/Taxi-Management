import { AfterViewChecked, Component, Input, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { PedidoViagemService } from '../../appServices/pedido-viagem.service';
import { GeolocationService } from '../../appServices/geolocation.service';
import * as Papa from 'papaparse';
import * as L from 'leaflet';
import { Cliente } from '../cliente_interface';
import { PedidoViagem } from '../pedidoViagem_interface';
import { Router } from '@angular/router';


@Component({
  selector: 'app-pedido-viagem',
  templateUrl: './pedido-viagem.component.html',
  styleUrls: ['./pedido-viagem.component.css']
})
export class PedidoViagemComponent implements OnInit, AfterViewChecked, OnDestroy {
  form: FormGroup;
  confortOptions = ['Basic', 'Luxury'];
  address: string | null = null;
  useGeolocation: boolean = false;
  codigosPostais: any[] = [];
  codigoPostal: string | null = null;
  cidade: string | null = null;
  rua: string | null = null;
  mapExit: L.Map | null = null;
  useExitGeolocation: boolean = true;
  map: L.Map | null = null;
  @Input() clienteData!: Cliente;
  clienteCriado: Cliente | null = null;
  private mapExitInitialized = false;
  loading: boolean = false;
  addressVerified: boolean = false;
  addressMessage: string = '';
  miniMap: L.Map | null = null;


  constructor(
    private fb: FormBuilder,
    private pedidoViagemService: PedidoViagemService,
    private geolocationService: GeolocationService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      entryAddress: ['', Validators.required],
      exitAddress: ['', Validators.required],
      confort: ['', Validators.required],
      numberOfPeople: ['1', [Validators.required, Validators.min(1)]],
      codigoPostal: ['', [Validators.pattern(/^\d{4}-\d{3}$/)]],
      exitCidade: [''],
      exitRua: ['']
    });
  }

  ngOnInit() {
    this.carregarCodigosPostais();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['clienteData'] && this.clienteData) {
      console.log('Cliente recebido no PedidoViagemComponent:', this.clienteData);
      this.clienteData = changes['clienteData'].currentValue;
    }
  }

  ngAfterViewChecked() {
    if (!this.mapExitInitialized && document.getElementById('mapExit')) {
      this.initMapExit();
      this.mapExitInitialized = true;
    }
  }

  initMap() {
    if (!this.map)
      if (this.useGeolocation){
        this.geolocationService.getCurrentPosition().subscribe(
          (position) => {
            if (position) {
              const lat = parseFloat(position.latitude);
              const lon = parseFloat(position.longitude);
              this.map = L.map('map', {
                center: [lat, lon],
                zoom: 15,
              }); 
              L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              }).addTo(this.map);
              this.map.invalidateSize();

              L.marker([lat,lon])
                .addTo(this.map)
                .bindPopup('<b>You are here</b>')
                .openPopup();
            } else {
              console.error('Error: Coordinates not found');
            }
          },
          (err) => {
            console.error('Error obtaining position:', err);
          });
      } else {
        console.error('Geolocation not available');
      }
  }

  initMapExit() {
    if (!this.mapExit || document.getElementById('mapExit')) {
      this.mapExit = L.map('mapExit').setView([39.399872, -8.224454], 6);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.mapExit);
  
      let marker: L.Marker | null = null;
  
      this.mapExit.on('click', (e: L.LeafletMouseEvent) => {
        const latLng = e.latlng;
        this.form.patchValue({ exitAddress: `${latLng.lat},${latLng.lng}` });
        console.log('Selected coordinates:', latLng.lat, latLng.lng);
  
        if (marker) {
          this?.mapExit?.removeLayer(marker);
        }
  
        marker = L.marker([latLng.lat, latLng.lng])
          .addTo(this.mapExit as L.Map)
          .bindPopup('Selected destination')
          .openPopup();
      });

      this.mapExit.invalidateSize();

    }
  }

  async onExitGeolocationChange(event: any): Promise<void> {
    const checkbox = event.target as HTMLInputElement;
    this.useExitGeolocation = checkbox.checked;
    if (this.useExitGeolocation) {
      this.form.patchValue({exitAddress: '',exitCidade: '', exitRua: ''});
      this.form.get('exitCidade')?.markAsUntouched();
      this.form.get('exitRua')?.markAsUntouched();
      this.addressVerified = false;
      this.addressMessage = '';
      if (this.miniMap) {
        this.miniMap.remove();
        this.miniMap = null;
      }
      if (document.getElementById('mapExit') && !this.mapExit) {
        console.log('Reinicializando o mapa de saída...');
        this.initMapExit();
      }
      this.mapExitInitialized = false;
      return;
    }
    this.clearMapExit();
    this.form.patchValue({exitAddress: '',exitCidade: '', exitRua: ''});
    this.addressVerified = false;
    this.addressMessage = '';
  }

    async getLocation(): Promise<void> {
      if (this.useGeolocation) {
        try {
          const position = await firstValueFrom(this.geolocationService.getCurrentPosition());
          if (position) {
            console.log('Localização obtida:', position);
            const coordenadas = `${position.latitude},${position.longitude}`;
            this.form.patchValue({ entryAddress: coordenadas });
            
            try {
              const endereco = await this.geolocationService.getAddressFromCoordinates(position.latitude, position.longitude);
              if (endereco) {  
                const [cidade, rua] = endereco.split(', ');
                this.cidade = cidade;
                this.rua = rua;
              }
            } catch (addressError) {
              console.warn('Não foi possível obter o endereço para as coordenadas, usando coordenadas diretamente');
              // Continue with just the coordinates, no need to alert the user
            }
          }
        } catch (err) {
          console.error('Erro ao obter localização:', err);
          // Don't show an alert, just log the error
          this.useGeolocation = false;
        }
      }
    }
    


  onGeolocationChange(event: any): void {
    const checkbox = event.target as HTMLInputElement;
    this.useGeolocation = checkbox.checked;
    if (this.useGeolocation) {
      console.log('Geolocalização ativada');
      this.getLocation();
      this.initMap();
      this.form.get('codigoPostal')?.clearValidators();
    } else {
      console.log('Geolocalização desativada');
      this.clearMap();
      this.form.patchValue({ entryAddress: '' }); 
      this.cidade = null;
      this.rua = null;
      this.form.get('codigoPostal')?.setValidators([Validators.pattern(/^\d{4}-\d{3}$/)]);
    }
    this.form.get('codigoPostal')?.updateValueAndValidity();
  }

  clearMap(): void{
    if(this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  clearMapExit(): void{
    if(this.mapExit) {
      this.mapExit.remove();
      this.mapExit = null;
    }
  }

  async submeterPedido(): Promise<void> {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      this.showErrorMessages();
      return;
    }

    try {
      // verify client
      if (!this.clienteData) {
        this.snackBar.open('Client not selected.', 'Close', { duration: 3500 });
        return;
      }

      // destination coords
      if (!this.useExitGeolocation && !this.addressVerified) {
        this.snackBar.open('Please verify the destination address before continuing.', 'Close', { duration: 4000 });
        return;
      }

      // pickup coords
      if(!this.useGeolocation) {
        if(!this.cidade || !this.rua) {
          this.snackBar.open('Please fill in the pickup address with a valid postal code.', 'Close', { duration: 4000 });
          return;
        }
        const coords = await this.geolocationService.getCoordinatesFromAddress(this.cidade, this.rua);
        if (!coords) {
          this.snackBar.open('Could not get coordinates for the pickup address.', 'Close', { duration: 4000 });
          return;
        }
        this.form.patchValue({ entryAddress: `${coords.latitude},${coords.longitude}`})
      }

      if (!this.form.value.entryAddress|| !this.form.value.exitAddress) {
        this.snackBar.open('Invalid pickup or destination address.', 'Close', { duration: 4000 });
        return;
      }
      
      // create ride request
      const pedidoData: PedidoViagem= {
        client: this.clienteData._id || '',
        entryAddress: this.form.value.entryAddress,
        exitAddress: this.form.value.exitAddress,
        confort: this.form.value.confort,
        numberOfPeople: this.form.value.numberOfPeople
      };
          const response = await firstValueFrom(this.pedidoViagemService.createPedido(pedidoData));
          if (response) {
            this.snackBar.open('Ride request created successfully!', 'Close', { duration: 3500 });
            console.log(`Redirecting to /cliente/aguardar-resposta/${response._id}`);
            this.router.navigate([`/cliente/aguardar-resposta/${response._id}`]);
          } else {
            console.error("Error: Empty response from server");
            this.snackBar.open('Error creating ride request. Please try again.', 'Close', { duration: 4000 });
          }    } catch (error) {      console.error("Error submitting ride request:", error);
      this.snackBar.open('An error occurred while creating the ride request. Please check your details and try again.', 'Close', { duration: 4000 });
    }

  }
  carregarCodigosPostais() {
    Papa.parse('/assets/data/codigos_postais.csv', {
      download: true,
      header: true,
      complete: (result: Papa.ParseResult<any>) => {
        this.codigosPostais = result.data;
        console.log('Postal codes loaded', this.codigosPostais);
      },
      error: (error) => {
        console.error('Error loading CSV: ', error);
      }
    });
  }
  
  async onCodigoPostalChange() {
    const codigoPostal = this.form.value.codigoPostal;
    if (codigoPostal && /^\d{4}-\d{3}$/.test(codigoPostal)) { 
      const [numCp, extCp] = codigoPostal.split('-'); 
      const codigoPostalData = this.codigosPostais.find(item => item.num_cod_postal === numCp && item.ext_cod_postal === extCp);
      if (codigoPostalData) {
        const cidade = codigoPostalData.nome_localidade;
        const rua = `${codigoPostalData.tipo_arteria} ${codigoPostalData.nome_arteria}, ${codigoPostalData.local_arteria}`;
        this.cidade = cidade;
        this.rua = rua;
  
        try{
          const coordsResponse = await this.geolocationService.getCoordinatesFromAddress(cidade, rua);
          if (coordsResponse && coordsResponse.latitude && coordsResponse.longitude) {
            this.form.patchValue({ entryAddress: `${coordsResponse.latitude},${coordsResponse.longitude}` });
          } else {
            this.snackBar.open('Could not get coordinates for this postal code.', 'Close', { duration: 4000 });
          }        
        } catch (error) {
          console.error('Error getting coordinates:', error);
          this.snackBar.open('Error trying to get coordinates. Please try again.', 'Close', { duration: 4000 });
          this.form.patchValue({ entryAddress: '' });
        }
      } else {
        this.form.patchValue({ entryAddress: '' });
        this.snackBar.open('Postal code not found.', 'Close', { duration: 3500 });
      }
    } else {
      this.form.patchValue({ entryAddress: '' });
    }

  }  showErrorMessages() {
    Object.keys(this.form.controls).forEach((control) => {
      const field = this.form.get(control);
      if (field?.invalid) {
        console.log(`Field ${control} is invalid`);
      }
    });
  }

  async verificarEndereco() {
    const cidade = this.form.value.exitCidade;
    const rua = this.form.value.exitRua;
    this.form.patchValue({ exitAddress: '' });

    if (!cidade || !rua) {
      this.snackBar.open('Please fill in the destination address with a city and street.', 'Close', { duration: 4000 });
      return;
    }

    try {
      this.loading = true;
      const coords = await this.geolocationService.getCoordinatesFromAddress(cidade, rua);
      this.loading = false;
      if (coords) {
        this.form.patchValue({ exitAddress: `${coords.latitude},${coords.longitude}` });
        this.addressVerified = true;
        this.addressMessage =  `Destination address verified: ${cidade}, ${rua}`;

        setTimeout(() => {
          console.log('Attempting to show mini map');
          const miniMapElement = document.getElementById('miniMap');
          console.log('miniMap element exists:', !!miniMapElement);

          if(miniMapElement) {
          this.showMiniMap(coords.latitude, coords.longitude);
          } else {
            console.error('miniMap element not found in DOM');
          }
        }, 200);
        
        
      } else {
        this.addressVerified = false;
        this.addressMessage = 'Could not obtain coordinates for this address.';
      }
    } catch (error) {
      this.loading = false;
      console.error('Error verifying address:', error);
      this.addressVerified = false;
      this.addressMessage = 'Error verifying address. Please try again.';
    }
  }

  showMiniMap(lat: string, lon: string) {
    console.log('Initializing mini map with coordinates:', lat, lon);
    const miniMapElement = document.getElementById('miniMap');
    if (miniMapElement) {
      if (this.miniMap) {
        this.miniMap.remove();
        this.miniMap = null;
      }
      this.miniMap = L.map('miniMap').setView([parseFloat(lat), parseFloat(lon)], 15);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(this.miniMap);
      L.marker([parseFloat(lat), parseFloat(lon)]).addTo(this.miniMap).bindPopup('Selected destination').openPopup();
      this.miniMap.invalidateSize();
      console.log('Mini map initialized');
    } else {
      console.error('miniMap element not found');
    }
}

  updateMiniMap(lat: string, lon: string) {
    console.log('Updating mini map with coordinates:', lat, lon);
    if (this.miniMap) {
      this.miniMap.setView([parseFloat(lat), parseFloat(lon)], 15);
      this.miniMap.eachLayer(layer => {
        if (layer instanceof L.Marker) {
          this.miniMap?.removeLayer(layer);
        }
      });
      L.marker([parseFloat(lat), parseFloat(lon)]).addTo(this.miniMap).bindPopup('Selected destination').openPopup();
      this.miniMap.invalidateSize();
      console.log('Mini map updated');
    } else {
      console.error('Mini map is null cannot be updated');
      this.showMiniMap(lat, lon);
    }
  }

  ngOnDestroy() {
    this.clearMap();
    this.clearMapExit();
    if (this.miniMap) {
      this.miniMap.remove();
      this.miniMap = null;
    }
  }
}
