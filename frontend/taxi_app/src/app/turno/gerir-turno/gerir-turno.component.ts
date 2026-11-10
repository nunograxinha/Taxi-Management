import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { MotoristaService } from '../../appServices/motorista.service';
import { Motorista } from '../../motoristas/motorista_interface';

@Component({
  selector: 'app-gerir-turno',
  templateUrl: './gerir-turno.component.html',
  styleUrls: ['./gerir-turno.component.css']
})
export class GerirTurnoComponent {
    motorista?: Motorista;
    private subscription?: Subscription;
    
  
    constructor(
        private motoristaService: MotoristaService ) {}

        ngOnInit() {
          this.subscription = this.motoristaService.motorista$.subscribe((m) => {
            if (m) {
              this.motorista = m;
            }
          });
        }    
  
}
