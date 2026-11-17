import { AfterViewChecked, Component, Input, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { PedidoViagemService } from '../../appServices/ride-request.service';
import { GeolocationService } from '../../appServices/geolocation.service';
import * as Papa from 'papaparse';
import * as L from 'leaflet';
import { Cliente } from '../client.interface';
import { PedidoViagem } from '../ride-request.interface';
import { Router } from '@angular/router';


@Component({
  selector: 'app-pedido-viagem',
  templateUrl: './ride-request.component.html',
  styleUrls: ['./ride-request.component.css']
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
  streetSuggestions: any[] = [];
  exitStreetSuggestions: any[] = [];
  private exitMarker: L.Marker | null = null;
  private pickupSearchTimer: any = null;
  private exitSearchTimer: any = null;


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
      codigoPostal: [''],
      pickupStreetInput: [''],
      exitStreetInput: [''],
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
    if (!this.map && this.useGeolocation) {
      this.geolocationService.getCurrentPosition().subscribe({
        next: (position) => {
          if (position) {
            const lat = parseFloat(position.latitude);
            const lon = parseFloat(position.longitude);
            this.renderPickupMap(lat, lon, '<b>You are here</b>', true);
          }
        },
        error: (err) => {
          console.error('Error obtaining position:', err);
          // Fallback: open interactive pickup map centered on Portugal so mobile HTTP users can tap to pick
          this.renderPickupMap(38.5714, -7.9135, 'Tap on the map to set pickup location', false);
        }
      });
    }
  }

  private renderPickupMap(lat: number, lon: number, popupText: string, addInitialMarker: boolean): void {
    const mapEl = document.getElementById('map');
    if (!mapEl || this.map) return;

    this.map = L.map('map', {
      center: [lat, lon],
      zoom: addInitialMarker ? 15 : 13
    });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    let marker: L.Marker | null = null;
    if (addInitialMarker) {
      marker = L.marker([lat, lon]).addTo(this.map).bindPopup(popupText).openPopup();
    }

    this.map.on('click', async (e: L.LeafletMouseEvent) => {
      const coords = `${e.latlng.lat},${e.latlng.lng}`;
      this.form.patchValue({ entryAddress: coords });
      if (marker) {
        this.map?.removeLayer(marker);
      }
      marker = L.marker([e.latlng.lat, e.latlng.lng])
        .addTo(this.map as L.Map)
        .bindPopup('<b>Selected pickup location</b>')
        .openPopup();

      try {
        const endereco = await this.geolocationService.getAddressFromCoordinates(
          String(e.latlng.lat),
          String(e.latlng.lng)
        );
        if (endereco) {
          const [cidade, rua] = endereco.split(', ');
          this.cidade = cidade;
          this.rua = rua;
        }
      } catch {
        // Coordinates already patched
      }
    });

    setTimeout(() => this.map?.invalidateSize(), 100);
  }

  initMapExit() {
    if (!this.mapExit || document.getElementById('mapExit')) {
      this.mapExit = L.map('mapExit').setView([39.399872, -8.224454], 6);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.mapExit);

      this.exitMarker = null;

      this.mapExit.on('click', (e: L.LeafletMouseEvent) => {
        this.setExitMapPoint(e.latlng.lat, e.latlng.lng, false);
      });

      this.mapExit.invalidateSize();
    }
  }

  private setExitMapPoint(lat: number, lon: number, centerMap: boolean): void {
    this.form.patchValue({ exitAddress: `${lat},${lon}` });
    if (!this.mapExit) return;

    if (this.exitMarker) {
      this.mapExit.removeLayer(this.exitMarker);
    }

    this.exitMarker = L.marker([lat, lon])
      .addTo(this.mapExit)
      .bindPopup('Selected destination')
      .openPopup();

    if (centerMap) {
      this.mapExit.setView([lat, lon], 16, { animate: true });
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
          this.snackBar.open(
            'Automatic GPS requires HTTPS or permission. Tap on the map to choose your pickup location.',
            'Close',
            { duration: 5000 }
          );
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
      this.streetSuggestions = [];
    } else {
      console.log('Geolocalização desativada');
      this.clearMap();
      this.form.patchValue({ entryAddress: '', codigoPostal: '', pickupStreetInput: '' });
      this.cidade = null;
      this.rua = null;
      this.streetSuggestions = [];
    }
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

      // pickup coords (only fetch if not already resolved by street/postal code lookup)
      if (!this.useGeolocation && !this.form.value.entryAddress) {
        if (!this.cidade || !this.rua) {
          this.snackBar.open('Please fill in the pickup address with a valid postal code.', 'Close', { duration: 4000 });
          return;
        }
        const coords = await this.geolocationService.getCoordinatesFromAddress(this.cidade, this.rua);
        if (!coords) {
          this.snackBar.open('Could not get coordinates for the pickup address.', 'Close', { duration: 4000 });
          return;
        }
        this.form.patchValue({ entryAddress: `${coords.latitude},${coords.longitude}` });
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
            console.log(`Redirecting to /client/waiting-response/${response._id}`);
            this.router.navigate([`/client/waiting-response/${response._id}`]);
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
  
  onStreetInput(event: Event): void {
    const rawQuery = ((event.target as HTMLInputElement).value || '').trim();
    const query = this.normalizeText(rawQuery);
    this.form.patchValue({ entryAddress: '', codigoPostal: '' });
    this.cidade = null;
    this.rua = null;

    if (this.pickupSearchTimer) clearTimeout(this.pickupSearchTimer);
    if (rawQuery.length < 3) {
      this.streetSuggestions = [];
      return;
    }

    this.pickupSearchTimer = setTimeout(async () => {
      const osmMatches = await this.searchNominatim(rawQuery);
      this.streetSuggestions = osmMatches.length > 0 ? osmMatches : this.searchPostalMatches(query);
    }, 300);
  }

  onExitStreetInput(event: Event): void {
    const rawQuery = ((event.target as HTMLInputElement).value || '').trim();
    const query = this.normalizeText(rawQuery);

    if (this.exitSearchTimer) clearTimeout(this.exitSearchTimer);
    if (rawQuery.length < 3) {
      this.exitStreetSuggestions = [];
      return;
    }

    this.exitSearchTimer = setTimeout(async () => {
      const osmMatches = await this.searchNominatim(rawQuery);
      this.exitStreetSuggestions = osmMatches.length > 0 ? osmMatches : this.searchPostalMatches(query);
    }, 300);
  }

  private normalizeText(value: string): string {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private async searchNominatim(query: string): Promise<any[]> {
    try {
      // Photon (Komoot/OSM) supports partial/prefix word autocomplete (e.g. "Quinta do Evarist")
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lat=39.5&lon=-8.0`;
      const resp = await fetch(photonUrl);
      const data = await resp.json();
      const features = Array.isArray(data?.features) ? data.features : [];
      const ptFeatures = features.filter((f: any) => !f.properties?.countrycode || f.properties.countrycode === 'PT');

      if (ptFeatures.length > 0) {
        return ptFeatures.map((f: any) => {
          const props = f.properties || {};
          const [lon, lat] = f.geometry?.coordinates || [null, null];
          return {
            _isNominatim: true,
            lat,
            lon,
            nome_localidade: props.city || props.town || props.village || props.county || props.state || '',
            _streetLabel: props.street || props.name || query,
            _postcode: props.postcode || ''
          };
        });
      }

      // Fallback to Nominatim if Photon returned nothing
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=pt&limit=6&q=${encodeURIComponent(query)}`;
      const nomResp = await fetch(url);
      const results = await nomResp.json();
      if (!Array.isArray(results)) return [];
      return results.map((r: any) => ({
        _isNominatim: true,
        lat: r.lat,
        lon: r.lon,
        nome_localidade:
          r.address?.city ||
          r.address?.town ||
          r.address?.village ||
          r.address?.municipality ||
          '',
        _streetLabel:
          r.address?.road ||
          r.address?.pedestrian ||
          r.address?.suburb ||
          r.display_name?.split(',')[0] ||
          query,
        _postcode: r.address?.postcode || ''
      }));
    } catch {
      return [];
    }
  }

  private searchPostalMatches(query: string): any[] {
    if (query.length < 3) return [];
    const tokens = query.split(/\s+/).filter(Boolean);
    const matches: any[] = [];
    for (const item of this.codigosPostais) {
      if (!item || !item.num_cod_postal) continue;
      const haystack = `${this.normalizeText(this.buildStreetLabel(item))} ${this.normalizeText(item.nome_localidade || '')}`;
      if (tokens.every(t => haystack.includes(t))) {
        matches.push(item);
        if (matches.length >= 10) break;
      }
    }
    return matches;
  }

  private async geocodePostalEntry(item: any): Promise<{ latitude: string; longitude: string } | null> {
    if (item._isNominatim && item.lat && item.lon) {
      return { latitude: String(item.lat), longitude: String(item.lon) };
    }
    const cp = `${item.num_cod_postal}-${item.ext_cod_postal}`;
    const cidade = (item.nome_localidade || '').trim();
    const desigPostal = (item.desig_postal || '').trim();
    const arteria = [item.tipo_arteria, item.nome_arteria]
      .map((p: string) => (p || '').trim())
      .filter(Boolean)
      .join(' ');

    if (arteria) {
      if (desigPostal && desigPostal.toLowerCase() !== cidade.toLowerCase()) {
        const exactWithDesig = await this.geolocationService
          .getCoordinatesFromAddress(`${cidade}, ${desigPostal}`, arteria, false)
          .catch(() => null);
        if (exactWithDesig) return exactWithDesig;
      }
      const exact = await this.geolocationService.getCoordinatesFromAddress(cidade, arteria, false).catch(() => null);
      if (exact) return exact;
    }

    if (cidade && desigPostal && desigPostal.toLowerCase() !== cidade.toLowerCase()) {
      const byCityAndDesig = await this.geolocationService
        .getCoordinatesFromAddress(`${cidade}, ${desigPostal}`, '', false)
        .catch(() => null);
      if (byCityAndDesig) return byCityAndDesig;
    }

    // Structured postalcode query before bare city name (avoids matching another village with the same name, e.g. Vale do Forno in Tomar)
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&postalcode=${encodeURIComponent(cp)}&countrycodes=pt&limit=1`;
      const resp = await fetch(url);
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        return { latitude: String(data[0].lat), longitude: String(data[0].lon) };
      }
    } catch {
      // ignore
    }

    if (desigPostal) {
      const byDesig = await this.geolocationService.getCoordinatesFromAddress(desigPostal, '').catch(() => null);
      if (byDesig) return byDesig;
    }

    if (cidade) {
      const byCity = await this.geolocationService.getCoordinatesFromAddress(cidade, '').catch(() => null);
      if (byCity) return byCity;
    }

    return null;
  }

  buildStreetLabel(item: any): string {
    if (item._isNominatim) {
      return item._streetLabel;
    }
    const arteria = [item.tipo_arteria, item.nome_arteria]
      .map((p: string) => (p || '').trim())
      .filter(Boolean)
      .join(' ');
    const localArteria = (item.local_arteria || '').trim();
    return [arteria, localArteria].filter(Boolean).join(', ') || (item.desig_postal || '').trim() || (item.nome_localidade || '').trim();
  }

  getItemPostalCode(item: any): string {
    if (item._isNominatim) {
      return item._postcode || 'Portugal';
    }
    return `${item.num_cod_postal}-${item.ext_cod_postal}`;
  }

  async selectStreetSuggestion(item: any): Promise<void> {
    this.streetSuggestions = [];
    const cp = this.getItemPostalCode(item);
    const cidade = (item.nome_localidade || '').trim();
    const rua = this.buildStreetLabel(item);

    this.cidade = cidade;
    this.rua = rua;
    this.form.patchValue({
      codigoPostal: cp,
      pickupStreetInput: cidade ? `${rua} (${cidade})` : rua
    });

    try {
      const coordsResponse = await this.geocodePostalEntry(item);
      if (coordsResponse && coordsResponse.latitude && coordsResponse.longitude) {
        this.form.patchValue({ entryAddress: `${coordsResponse.latitude},${coordsResponse.longitude}` });
      } else {
        this.snackBar.open('Could not get coordinates for this street.', 'Close', { duration: 4000 });
      }
    } catch {
      this.snackBar.open('Error trying to get coordinates. Please try again.', 'Close', { duration: 4000 });
    }
  }

  async selectExitStreetSuggestion(item: any): Promise<void> {
    this.exitStreetSuggestions = [];
    const cidade = (item.nome_localidade || '').trim();
    const rua = this.buildStreetLabel(item);
    this.form.patchValue({ exitStreetInput: `${rua} (${cidade})` });

    try {
      const coordsResponse = await this.geocodePostalEntry(item);
      if (coordsResponse && coordsResponse.latitude && coordsResponse.longitude) {
        const lat = parseFloat(coordsResponse.latitude);
        const lon = parseFloat(coordsResponse.longitude);
        this.setExitMapPoint(lat, lon, true);
      } else {
        this.snackBar.open('Could not locate this street on the map. Please tap the map manually.', 'Close', { duration: 4000 });
      }
    } catch {
      this.snackBar.open('Error locating street on the map.', 'Close', { duration: 4000 });
    }
  }

  async onCodigoPostalChange() {
    const codigoPostal = this.form.value.codigoPostal;
    if (codigoPostal && /^\d{4}-\d{3}$/.test(codigoPostal)) { 
      const [numCp, extCp] = codigoPostal.split('-'); 
      const codigoPostalData = this.codigosPostais.find(item => item.num_cod_postal === numCp && item.ext_cod_postal === extCp);
      if (codigoPostalData) {
        const cidade = (codigoPostalData.nome_localidade || '').trim();
        const arteria = [codigoPostalData.tipo_arteria, codigoPostalData.nome_arteria]
          .map(p => (p || '').trim())
          .filter(Boolean)
          .join(' ');
        const localArteria = (codigoPostalData.local_arteria || '').trim();
        const rua = [arteria, localArteria].filter(Boolean).join(', ') || (codigoPostalData.desig_postal || '').trim() || cidade;
        this.cidade = cidade;
        this.rua = rua;
  
        try {
          let coordsResponse = await this.geolocationService
            .getCoordinatesFromAddress(cidade, arteria || '')
            .catch(() => null);
          if (!coordsResponse) {
            coordsResponse = await this.geolocationService.getCoordinatesFromAddress('', codigoPostal);
          }
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
