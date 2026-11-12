import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PedidoViagemService } from '../../appServices/pedido-viagem.service';
import { PedidoViagem } from '../../cliente/pedidoViagem_interface';
import { Motorista } from '../../motoristas/motorista_interface';
import { firstValueFrom, Subscription } from 'rxjs';

@Component({
  selector: 'app-aguardar-resposta',
  templateUrl: './aguardar-resposta.component.html',
  styleUrls: ['./aguardar-resposta.component.css']
})
export class AguardarRespostaComponent implements OnInit, OnDestroy {
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
    this.pedidoId = paramId;
    this.carregarPedido();
    this.polllingSubscription = this.pedidoViagemService.requestMotorista(this.pedidoId).subscribe({
      next: (res: any) => {
        console.log(res);
        if (res && res.motoristaId) {
          console.log("accepted");
          this.router.navigate(['/cliente/confirmar-viagem', this.pedidoId]);
        } else {
          this.erro = 'Ainda não foi encontrado nenhum motorista disponível. Tente novamente ou aguarde.';
        }
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

  carregarPedido(): void {
    this.pedidoViagemService.getPedidoById(this.pedidoId).subscribe({
      next: (pedido) => {
        console.log(pedido);
        this.pedido = pedido ? pedido : null;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar pedido:', err);
        this.erro = 'Erro ao carregar o pedido.';
        this.loading = false;
      }
    });
  }

  async cancelarPedido() {
    const confirmacao = window.confirm('Tem certeza que deseja cancelar o pedido?');
    if (!confirmacao) {
      return;
    }
    try {
      await firstValueFrom(this.pedidoViagemService.deletePedido(this.pedidoId));
      this.router.navigate(['/cliente']);
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
      this.erro = 'Erro ao cancelar o pedido.';
    }
  }

}