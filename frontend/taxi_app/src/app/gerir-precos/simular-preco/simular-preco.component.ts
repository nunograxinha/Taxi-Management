import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PrecoService } from '../../appServices/preco.service';
import { Preco } from '../preco_interface';

@Component({
  selector: 'app-simular-preco',
  templateUrl: './simular-preco.component.html',
  styleUrls: ['./simular-preco.component.css']
})
export class SimularPrecoComponent implements OnInit {
  simulacaoForm: FormGroup;
  precoStandard: number = 0;
  precoLuxo: number = 0;
  custoTotal: number | null = null;

  constructor(private fb: FormBuilder, private precoService: PrecoService) {
    this.simulacaoForm = this.fb.group({
      conforto: ['', Validators.required],
      agravamentoNoturno: [0, [Validators.required, Validators.min(0)]],
      inicio: ['', Validators.required],
      fim: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.precoService.getPreco().subscribe({
      next: (data: Preco) => {
        this.precoStandard = data.pricePerMinuteConfort;
        this.precoLuxo = data.pricePerMinuteLuxury;
        this.simulacaoForm.patchValue({
          agravamentoNoturno: data.nightTimeSurcharge
        });
      },
      error: (err) => {
        console.error('Erro ao carregar valores default:', err);
      }
    });
  }

  calcularCusto(): void {
    const { conforto, agravamentoNoturno, inicio, fim } = this.simulacaoForm.value;

    const precoPorMinuto = conforto === 'Basico' ? this.precoStandard : this.precoLuxo;

    const dataInicio = new Date(inicio);
    const dataFim = new Date(fim);

    let minutosTotais = 0;
    let minutosNoturnos = 0;

    const dataAtual = new Date(dataInicio);

    while (dataAtual < dataFim) {
      const hora = dataAtual.getHours();
      const isNoturno = hora >= 21 || hora < 7;

      if (isNoturno) minutosNoturnos++;

      minutosTotais++;
      dataAtual.setMinutes(dataAtual.getMinutes() + 1);
    }

    const minutosNormais = minutosTotais - minutosNoturnos;
    const custo =
      (minutosNormais * precoPorMinuto) +
      (minutosNoturnos * precoPorMinuto * (1 + agravamentoNoturno / 100));

    this.custoTotal = custo;
  }
}
