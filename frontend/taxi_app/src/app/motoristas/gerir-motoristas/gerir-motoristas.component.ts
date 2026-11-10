import { Component } from '@angular/core';

@Component({
  selector: 'app-gerir-motoristas',
  templateUrl: './gerir-motoristas.component.html',
  styleUrls: ['./gerir-motoristas.component.css']
})
export class GerirMotoristasComponent {
  refreshTrigger: number = 0;

  atualizarLista() {
    this.refreshTrigger++;
  }
}
