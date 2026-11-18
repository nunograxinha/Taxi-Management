import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { DriverService } from '../../appServices/driver.service';
import { Driver } from '../../drivers/driver.interface';

@Component({
  selector: 'app-gerir-turno',
  templateUrl: './manage-shifts.component.html',
  styleUrls: ['./manage-shifts.component.css']
})
export class ManageShiftsComponent implements OnInit, OnDestroy {
    motorista?: Driver;
    private subscription?: Subscription;
    
  
    constructor(
        private motoristaService: DriverService ) {}

        ngOnInit() {
          this.subscription = this.motoristaService.driver$.subscribe((m) => {
            if (m) {
              this.motorista = m;
            }
          });
        }

        ngOnDestroy() {
          this.subscription?.unsubscribe();
        }
  
}
