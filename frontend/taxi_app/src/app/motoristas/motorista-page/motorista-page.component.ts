import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MotoristaService } from '../../appServices/motorista.service';
import { Motorista } from '../motorista_interface';

@Component({
  selector: 'app-motorista-page',
  templateUrl: './motorista-page.component.html',
  styleUrls: ['./motorista-page.component.css']
})
export class MotoristaPageComponent implements OnInit {
  nifMotorista!: string;
  motorista?: Motorista;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private readonly motoristaService: MotoristaService
  ) {}

  ngOnInit() {
    this.nifMotorista = this.route.snapshot.paramMap.get('nif')!;

    this.motoristaService.getMotoristaPorNIF(this.nifMotorista).subscribe({
      next: (motorista) => {
        this.motorista = motorista;
        this.motoristaService.setMotorista(motorista);
      },
      error: (err) => {
        console.error('Erro ao buscar motorista:', err);
      }
    });
  }
}

