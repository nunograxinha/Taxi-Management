import { Component } from '@angular/core';

@Component({
  selector: 'app-gerir-taxis',
  templateUrl: './gerir-taxis.component.html',
  styleUrls: ['./gerir-taxis.component.css']
})
export class GerirTaxisComponent {
  refreshTrigger: number = 0;

  refreshList() {
    this.refreshTrigger++;
  }

}
