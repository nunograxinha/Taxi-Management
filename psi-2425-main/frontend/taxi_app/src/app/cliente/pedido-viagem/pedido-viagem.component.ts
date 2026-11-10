import {  AfterViewChecked, Component, Input, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  confortOptions = ['Basico', 'Luxuoso'];
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
    private router: Router
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
                .bindPopup('<b>Você está aqui</b>')
                .openPopup();
            } else {
              console.error('Erro: Coordenadas não encontradas');
            }
          },
          (err) => {
            console.error('Erro ao obter a posição:', err);
          });
      } else {
        console.error('Geolocalização não disponível');
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
        console.log('Coordenadas selecionadas:', latLng.lat, latLng.lng);
  
        if (marker) {
          this?.mapExit?.removeLayer(marker);
        }
  
        marker = L.marker([latLng.lat, latLng.lng])
          .addTo(this.mapExit as L.Map)
          .bindPopup('Destino selecionado')
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
          const position = await this.geolocationService.getCurrentPosition().toPromise();
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
      //verificar cliente
      if (!this.clienteData) {
        alert("Cliente não selecionado.");
        return;
      }

      //coords destino
      if (!this.useExitGeolocation && !this.addressVerified) {
        alert("Por favor, verifique o endereço de destino antes de continuar.");
        return;
      }

      //coords partida
      if(!this.useGeolocation) {
        if(!this.cidade || !this.rua) {
          alert('Por favor preencha o endereço de partida com um código postal correto.');
          return;
        }
        const coords = await this.geolocationService.getCoordinatesFromAddress(this.cidade, this.rua);
        if (!coords) {
          alert('Não foi possível obter coordenadas para o endereço de partida.');
          return;
        }
        this.form.patchValue({ entryAddress: `${coords.latitude},${coords.longitude}`})
      }

      if (!this.form.value.entryAddress|| !this.form.value.exitAddress) {
        alert('Endereço de partida ou de destino inválido.');
        return;
      }
      
      //criar pedido
      const pedidoData: PedidoViagem= {
        cliente: this.clienteData._id || '',
        entryAddress: this.form.value.entryAddress,
        exitAddress: this.form.value.exitAddress,
        confort: this.form.value.confort,
        numberOfPeople: this.form.value.numberOfPeople
      };
          const response = await this.pedidoViagemService.createPedido(pedidoData).toPromise();
          if (response) {
            alert("Pedido criado com sucesso!");
            console.log(`Redirecionando para /cliente/aguardar-resposta/${response._id}`);
            // this.pedidoViagemService.requestMotorista(response._id!).subscribe({
            //   next: (res) => {
            //     console.log(res)
            //     console.log("accepted")
            //   },
            //   error: (err) => {
            //     console.error('Error getting current position:', err);
            //   }
            // });
            this.router.navigate([`/cliente/aguardar-resposta/${response._id}`]);
          } else {
            console.error("Erro: Resposta vazia do servidor");
            alert("Erro ao criar pedido. Tente novamente.");
          }    } catch (error) {      console.error("Erro ao submeter pedido:", error);
      alert("Ocorreu um erro ao criar o pedido. Verifique os dados e tente novamente.");
    }

  }
  carregarCodigosPostais() {
    Papa.parse('/assets/data/codigos_postais.csv', {
      download: true,
      header: true,
      complete: (result: Papa.ParseResult<any>) => {
        this.codigosPostais = result.data;
        console.log('Códigos postais carregados', this.codigosPostais);
      },
      error: (error) => {
        console.error('Erro ao carregar o CSV: ', error);
      }
    });
  }
  
  async onCodigoPostalChange() {
    const codigoPostal = this.form.value.codigoPostal;
    if (codigoPostal && /^\d{4}-\d{3}$/.test(codigoPostal)) { 
      const [numCp, extCp] = codigoPostal.split('-'); 
      const codigoPostalData = this.codigosPostais.find(item => item.num_cod_postal === numCp && item.ext_cod_postal === extCp);
      if (codigoPostalData) {
        const cidade = codigoPostalData.nome_localidade; // Nome da cidade (localidade)
        const rua = `${codigoPostalData.tipo_arteria} ${codigoPostalData.nome_arteria}, ${codigoPostalData.local_arteria}`; // Nome da rua e detalhes de localização
        this.cidade = cidade;
        this.rua = rua;
  
        try{
          const coordsResponse = await this.geolocationService.getCoordinatesFromAddress(cidade, rua);
          if (coordsResponse && coordsResponse.latitude && coordsResponse.longitude) {
            this.form.patchValue({ entryAddress: `${coordsResponse.latitude},${coordsResponse.longitude}` });
          } else {
            alert('Não foi possível obter coordenadas para este código postal.');
          }        
        } catch (error) {
          console.error('Erro ao obter coordenadas:', error);
          alert('Erro ao tentar obter coordenadas. Tente novamente.');
          this.form.patchValue({ entryAddress: '' });
        }
      } else {
        this.form.patchValue({ entryAddress: '' });
        alert('Código postal não encontrado.');
      }
    } else {
      this.form.patchValue({ entryAddress: '' });
    }

  }  showErrorMessages() {
    Object.keys(this.form.controls).forEach((control) => {
      const field = this.form.get(control);
      if (field?.invalid) {
        console.log(`Campo ${control} é inválido`);
      }
    });
  }

  async verificarEndereco() {
    const cidade = this.form.value.exitCidade;
    const rua = this.form.value.exitRua;
    this.form.patchValue({ exitAddress: '' });

    if (!cidade || !rua) {
      alert('Por favor, preencha o endereço de destino com uma cidade e uma rua.');
      return;
    }

    try {
      this.loading = true;
      const coords = await this.geolocationService.getCoordinatesFromAddress(cidade, rua);
      this.loading = false;
      if (coords) {
        this.form.patchValue({ exitAddress: `${coords.latitude},${coords.longitude}` });
        this.addressVerified = true;
        this.addressMessage =  `Endereço de destino verificado: ${cidade}, ${rua}`;

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
        this.addressMessage = 'Não foi possível obter coordenadas para este endereço.';
      }
    } catch (error) {
      this.loading = false;
      console.error('Erro ao verificar endereço:', error);
      this.addressVerified = false;
      this.addressMessage = 'Erro ao verificar endereço. Tente novamente.';
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
      L.marker([parseFloat(lat), parseFloat(lon)]).addTo(this.miniMap).bindPopup('Destino selecionado').openPopup();
      this.miniMap.invalidateSize();
      console.log('Mini map initialized');
    } else {
      console.error('Elemento miniMap não encontrado');
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
      L.marker([parseFloat(lat), parseFloat(lon)]).addTo(this.miniMap).bindPopup('Destino selecionado').openPopup();
      this.miniMap.invalidateSize();
      console.log('Mini map updated');
    } else {
      console.error('Mini map is null cannot be updated');
      this.showMiniMap(lat, lon);
    }
  }

  ngOnDestroy() {
    if (this.miniMap) {
      this.miniMap.remove();
      this.miniMap = null;
    }
  }
}
