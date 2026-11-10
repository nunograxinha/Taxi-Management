import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MotoristaService } from '../../appServices/motorista.service';

@Component({
  selector: 'app-editar-motorista',
  templateUrl: './editar-motorista.component.html',
  styleUrls: ['./editar-motorista.component.css']
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
    this.router.navigate(['/gestor/gerir-motoristas']);
  }
}
