import { Component, OnInit } from '@angular/core';
import { PrecoService } from '../appServices/preco.service';
import { Preco } from './preco_interface';

@Component({
  selector: 'app-gerir-precos',
  templateUrl: './gerir-precos.component.html',
  styleUrls: ['./gerir-precos.component.css']
})
export class GerirPrecosComponent implements OnInit {
  custoBase = 0;
  custoLuxo = 0;
  taxaNocturna = 0;
  precoId: string | undefined;

  showModal = false;
  campoAtual: 'custoBase' | 'custoLuxo' | 'taxaNocturna' | null = null;
  valorTemporario: string = '';
  erroValidacao: string = '';

  constructor(private precoService: PrecoService) {}

  ngOnInit(): void {
    this.precoService.getPreco().subscribe({
      next: (data: Preco) => {
        this.custoBase = data.pricePerMinuteConfort;
        this.custoLuxo = data.pricePerMinuteLuxury;
        this.taxaNocturna = data.nightTimeSurcharge;
        this.precoId = data._id;
      },
      error: (err) => console.error('[ERROR] Erro ao buscar preços:', err)
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
      this.erroValidacao = 'Insira um número válido.';
      return;
    }
  
    if (valor < 0) {
      this.erroValidacao = 'Insira um número positivo.';
      return;
    }
  
    const duasDecimais = /^\d+([.,]\d{1,2})?$/.test(this.valorTemporario);
    if (!duasDecimais) {
      this.erroValidacao = 'Use no máximo duas casas decimais.';
      return;
    }
  
    if (this.campoAtual === 'custoBase' || this.campoAtual === 'custoLuxo') {
      if (valor <= 0) {
        this.erroValidacao = 'O valor deve ser maior que 0.';
        return;
      }
    }
  
    if (this.campoAtual === 'taxaNocturna') {
      if (valor < 0 || valor > 100) {
        this.erroValidacao = 'A taxa deve estar entre 0% e 100%.';
        return;
      }
    }
  
    // Valor válido
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

    const precoAtualizado: Preco = {
      _id: this.precoId,
      pricePerMinuteConfort: this.custoBase,
      pricePerMinuteLuxury: this.custoLuxo,
      nightTimeSurcharge: this.taxaNocturna,
    };

    this.precoService.atualizarPreco(this.precoId, precoAtualizado).subscribe({
      next: () => console.log('[SUCCESS] Preço atualizado com sucesso.'),
      error: (err) => console.error('[ERROR] Erro ao atualizar preço:', err)
    });
  }
}
