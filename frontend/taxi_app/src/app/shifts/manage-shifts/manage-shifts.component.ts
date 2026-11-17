import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { MotoristaService } from '../../appServices/driver.service';
import { Motorista } from '../../drivers/driver.interface';

@Component({
  selector: 'app-gerir-turno',
  templateUrl: './manage-shifts.component.html',
  styleUrls: ['./manage-shifts.component.css']
})
export class GerirTurnoComponent implements OnInit, OnDestroy {
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

        ngOnDestroy() {
          this.subscription?.unsubscribe();
        }
  
}
