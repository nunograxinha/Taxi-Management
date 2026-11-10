import { Component } from '@angular/core';
import { Cliente } from '../cliente_interface';

@Component({
  selector: 'app-cliente-page',
  templateUrl: './cliente-page.component.html',
  styleUrls: ['./cliente-page.component.css']
})
export class ClientePageComponent {
  clienteSelecionado: Cliente | null = null;

  onClienteCriado(cliente: Cliente) {
    console.log("Cliente recebido:", cliente);
    this.clienteSelecionado = cliente;
  }
}
