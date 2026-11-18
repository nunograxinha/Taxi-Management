import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../appServices/auth.service';
import { DriverService } from '../../appServices/driver.service';
import { Driver } from '../driver.interface';

@Component({
  selector: 'app-motorista-login',
  templateUrl: './driver-login.component.html',
  styleUrls: ['./driver-login.component.css']
})
export class DriverLoginComponent implements OnInit {
  allDrivers: Driver[] = [];
  filteredDrivers: Driver[] = [];
  driverLoginForm: FormGroup;
  loginError = '';
  isSubmitting = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly motoristaService: DriverService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.driverLoginForm = this.fb.group({
      NIF: ['', [Validators.required, this.nifValidator]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadDrivers();
    this.driverLoginForm.get('NIF')?.valueChanges.subscribe((val: string) => {
      const term = (val || '').trim();
      this.filteredDrivers = term
        ? this.allDrivers.filter(d => d.NIF.includes(term))
        : this.allDrivers;
    });
  }

  selectDriver(driver: Driver): void {
    this.driverLoginForm.patchValue({ NIF: driver.NIF });
    this.driverLoginForm.get('NIF')?.markAsTouched();
    this.loginError = '';
    const pwdInput = document.getElementById('driverPassword') as HTMLInputElement | null;
    pwdInput?.focus();
  }

  onSubmit(): void {
    if (this.driverLoginForm.invalid || this.isSubmitting) {
      this.driverLoginForm.markAllAsTouched();
      return;
    }

    const { NIF, password } = this.driverLoginForm.getRawValue();
    this.isSubmitting = true;
    this.loginError = '';

    this.authService.loginAsDriver(NIF.trim(), password).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/driver/portal']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.loginError = err?.error?.error || 'Invalid NIF or password.';
      }
    });
  }

  clearSearch(): void {
    this.driverLoginForm.reset({ NIF: '', password: '' });
    this.filteredDrivers = this.allDrivers;
    this.loginError = '';
  }

  private loadDrivers(): void {
    this.motoristaService.getDrivers().subscribe({
      next: (drivers) => {
        this.allDrivers = drivers.sort((a, b) =>
          new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime()
        );
        this.filteredDrivers = this.allDrivers;
      },
      error: (error) => {
        console.error('Error fetching drivers:', error);
      }
    });
  }

  private nifValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    if (value < 0) return { notPositive: true };

    const onlyDigits = /^\d+$/;
    if (!onlyDigits.test(value)) return { invalidFormat: true };

    if (String(value).length !== 9) return { invalidLength: true };

    return null;
  }
}
