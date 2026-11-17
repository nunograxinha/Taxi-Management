import { Component } from '@angular/core';

@Component({
  selector: 'app-gerir-taxis',
  templateUrl: './manage-taxis.component.html',
  styleUrls: ['./manage-taxis.component.css']
})
export class GerirTaxisComponent {
  refreshTrigger: number = 0;

  refreshList() {
    this.refreshTrigger++;
  }

}
