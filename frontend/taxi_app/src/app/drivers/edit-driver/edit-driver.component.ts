import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MotoristaService } from '../../appServices/driver.service';

@Component({
  selector: 'app-editar-motorista',
  templateUrl: './edit-driver.component.html',
  styleUrls: ['./edit-driver.component.css']
})
export class EditarMotoristaComponent implements OnInit {
  motoristaParaEditar: any;
  constructor(
    private route: ActivatedRoute,
    private motoristaService: MotoristaService,
    private router: Router,
  ) {}

  ngOnInit() {
    const nif = this.route.snapshot.paramMap.get('nif');
    if (nif) {
      this.motoristaService.getMotoristaPorNIF(nif).subscribe(motorista => {
        this.motoristaParaEditar = motorista;
      });
    }
  }
  voltarALista() {
    this.router.navigate(['/manager/manage-drivers']);
  }
}
