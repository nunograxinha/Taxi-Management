import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../appServices/auth.service';
import { MotoristaService } from '../../appServices/driver.service';
import { Motorista } from '../driver.interface';

@Component({
  selector: 'app-motorista-page',
  templateUrl: './driver-page.component.html',
  styleUrls: ['./driver-page.component.css']
})
export class MotoristaPageComponent implements OnInit {
  nifMotorista!: string;
  motorista?: Motorista;

  showPasswordModal = false;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordError = '';
  isUpdatingPassword = false;
  hasChildRoute = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private readonly motoristaService: MotoristaService,
    private readonly authService: AuthService,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.hasChildRoute = this.route.firstChild !== null;
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.hasChildRoute = this.route.firstChild !== null;
      });

    this.nifMotorista = this.route.snapshot.paramMap.get('nif')!;

    this.motoristaService.getMotoristaPorNIF(this.nifMotorista).subscribe({
      next: (motorista) => {
        this.motorista = motorista;
        this.motoristaService.setMotorista(motorista);
      },
      error: (err) => {
        console.error('Error fetching driver:', err);
      }
    });
  }

  openPasswordModal(): void {
    this.showPasswordModal = true;
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.passwordError = '';
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.passwordError = '';
  }

  submitPasswordChange(): void {
    this.passwordError = '';
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.passwordError = 'All fields are required.';
      return;
    }
    if (this.newPassword.length < 6) {
      this.passwordError = 'New password must be at least 6 characters.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'New passwords do not match.';
      return;
    }

    this.isUpdatingPassword = true;
    this.authService.changeDriverPassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.isUpdatingPassword = false;
        this.showPasswordModal = false;
        this.snackBar.open('Password updated successfully!', 'Close', { duration: 3500 });
      },
      error: (err) => {
        this.isUpdatingPassword = false;
        this.passwordError = err?.error?.error || 'Error updating password.';
      }
    });
  }
}
