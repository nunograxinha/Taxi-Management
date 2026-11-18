import { Component, OnInit } from '@angular/core';
import { PriceService } from '../appServices/price.service';
import { Price } from './price.interface';

@Component({
  selector: 'app-gerir-precos',
  templateUrl: './manage-prices.component.html',
  styleUrls: ['./manage-prices.component.css']
})
export class ManagePricesComponent implements OnInit {
  custoBase = 0;
  custoLuxo = 0;
  taxaNocturna = 0;
  precoId: string | undefined;

  showModal = false;
  campoAtual: 'custoBase' | 'custoLuxo' | 'taxaNocturna' | null = null;
  valorTemporario: string = '';
  erroValidacao: string = '';

  constructor(private precoService: PriceService) {}

  ngOnInit(): void {
    this.precoService.getPrice().subscribe({
      next: (data: Price) => {
        this.custoBase = data.pricePerMinuteConfort;
        this.custoLuxo = data.pricePerMinuteLuxury;
        this.taxaNocturna = data.nightTimeSurcharge;
        this.precoId = data._id;
      },
      error: (err) => console.error('[ERROR] Error fetching prices:', err)
    });
  }

  alterarValor(campo: 'custoBase' | 'custoLuxo' | 'taxaNocturna') {
    this.campoAtual = campo;
    this.erroValidacao = '';
    this.valorTemporario = this[campo].toString();
    this.showModal = true;
  }

  confirmarAlteracao() {
    const valorTexto = this.valorTemporario.replace(',', '.');
    const valor = parseFloat(valorTexto);
  
    if (isNaN(valor)) {
      this.erroValidacao = 'Please enter a valid number.';
      return;
    }
  
    if (valor < 0) {
      this.erroValidacao = 'Please enter a positive number.';
      return;
    }
  
    const duasDecimais = /^\d+([.,]\d{1,2})?$/.test(this.valorTemporario);
    if (!duasDecimais) {
      this.erroValidacao = 'Use at most two decimal places.';
      return;
    }
  
    if (this.campoAtual === 'custoBase' || this.campoAtual === 'custoLuxo') {
      if (valor <= 0) {
        this.erroValidacao = 'The value must be greater than 0.';
        return;
      }
    }
  
    if (this.campoAtual === 'taxaNocturna') {
      if (valor < 0 || valor > 100) {
        this.erroValidacao = 'The surcharge must be between 0% and 100%.';
        return;
      }
    }
  
    // Valid value
    this[this.campoAtual!] = valor;
    this.showModal = false;
    this.salvarPreco();
  }
  

  cancelarAlteracao() {
    this.showModal = false;
    this.campoAtual = null;
    this.valorTemporario = '';
    this.erroValidacao = '';
  }

  salvarPreco() {
    if (!this.precoId) return;

    const precoAtualizado: Price = {
      _id: this.precoId,
      pricePerMinuteConfort: this.custoBase,
      pricePerMinuteLuxury: this.custoLuxo,
      nightTimeSurcharge: this.taxaNocturna,
    };

    this.precoService.updatePrice(this.precoId, precoAtualizado).subscribe({
      next: () => console.log('[SUCCESS] Price updated successfully.'),
      error: (err) => console.error('[ERROR] Error updating price:', err)
    });
  }
}
