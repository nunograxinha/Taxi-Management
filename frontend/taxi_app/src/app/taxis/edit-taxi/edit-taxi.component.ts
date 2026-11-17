import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TaxiService } from '../../appServices/taxi.service';


@Component({
  selector: 'app-editar-taxi',
  templateUrl: './edit-taxi.component.html',
  styleUrls: ['./edit-taxi.component.css']
})
export class EditarTaxiComponent implements OnInit {
  taxiToEdit: any;
  constructor(
    private route: ActivatedRoute,
    private taxiService: TaxiService,
    private router: Router,
  ) {}

  ngOnInit() {
    const licensePlate = this.route.snapshot.paramMap.get('licensePlate');
    if (licensePlate) {
      this.taxiService.getTaxiByLicensePlate(licensePlate).subscribe(taxi => {
        this.taxiToEdit = taxi;
      });
    }
  }

  backToList() {
    this.router.navigate(['/manager/manage-taxis']);
  }
}
