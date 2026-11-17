import { Component } from '@angular/core';

@Component({
  selector: 'app-gerir-motoristas',
  templateUrl: './manage-drivers.component.html',
  styleUrls: ['./manage-drivers.component.css']
})
export class GerirMotoristasComponent {
  refreshTrigger: number = 0;

  atualizarLista() {
    this.refreshTrigger++;
  }
}
