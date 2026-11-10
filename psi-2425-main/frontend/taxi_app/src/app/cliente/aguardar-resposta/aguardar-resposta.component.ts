import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PedidoViagemService } from '../../appServices/pedido-viagem.service';
import { PedidoViagem } from '../../cliente/pedidoViagem_interface';
import { Motorista } from '../../motoristas/motorista_interface';
import { Subscription, interval }from 'rxjs';

@Component({
  selector: 'app-aguardar-resposta',
  templateUrl: './aguardar-resposta.component.html',
  styleUrls: ['./aguardar-resposta.component.css']
})
export class AguardarRespostaComponent implements OnInit {
  pedidoId: string = '';
  pedido: PedidoViagem | null = null;
  motorista: Motorista | null = null;
  loading: boolean = true;
  erro: string = '';
  polllingSubscription: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private pedidoViagemService: PedidoViagemService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const paramId = this.route.snapshot.paramMap.get('pedidoId');
    if (!paramId) {
      this.erro = 'ID de pedido inválido.';
      this.loading = false;
      return;
    }
    this.carregarPedido();
    this.pedidoId = paramId;
    this.pedidoViagemService.requestMotorista(this.pedidoId).subscribe({
      next: (res) => {
        console.log(res)
        console.log("accepted")
        this.router.navigate(['/cliente/confirmar-viagem', this.pedidoId])
      },
      error: (err) => {
        console.error('Error requesting driver:', err);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.polllingSubscription) {
      this.polllingSubscription.unsubscribe();
    }
  }
  async carregarPedido() {
    try {
      const pedido = await this.pedidoViagemService.getPedidoById(this.pedidoId).toPromise();
      this.pedidoViagemService.getPedidoById(this.pedidoId).subscribe({
      next: (pedido) => {
        console.log(pedido)
        this.pedido = pedido ? pedido : null;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading pedido:', err);
        this.loading = false;
      }
    });
      
      this.loading = false;
    } catch (error) {
      console.error('Erro ao carregar pedido:', error);
      this.erro = 'Erro ao carregar o pedido.';
      this.loading = false;
    }
  }

  async cancelarPedido() {
    const confirmacao = window.confirm('Tem certeza que deseja cancelar o pedido?');
    if (!confirmacao) {
      return;
    }
    try {
      await this.pedidoViagemService.deletePedido(this.pedidoId).toPromise();
      this.router.navigate(['/cliente']);
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
      this.erro = 'Erro ao cancelar o pedido.';
    }
  }

}