import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../appServices/auth.service';
import { DriverService } from '../../appServices/driver.service';
import { SocketService } from '../../appServices/socket.service';
import { AlertNotificationService } from '../../appServices/alert-notification.service';
import { Driver } from '../driver.interface';

@Component({
  selector: 'app-motorista-page',
  templateUrl: './driver-page.component.html',
  styleUrls: ['./driver-page.component.css']
})
export class DriverPageComponent implements OnInit, OnDestroy {
  nifMotorista!: string;
  motorista?: Driver;

  showPasswordModal = false;
  showReviewsModal = false;
  showPhotoModal = false;
  draftPhoto: string | null = null;
  photoError = '';
  isUpdatingPhoto = false;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordError = '';
  isUpdatingPassword = false;
  hasChildRoute = false;
  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private readonly motoristaService: DriverService,
    private readonly authService: AuthService,
    private readonly socketService: SocketService,
    private readonly snackBar: MatSnackBar,
    private readonly ngZone: NgZone,
    private readonly alertService: AlertNotificationService
  ) {}

  ngOnInit() {
    this.hasChildRoute = this.route.firstChild !== null;
    this.subscriptions.add(
      this.router.events
        .pipe(filter((event) => event instanceof NavigationEnd))
        .subscribe(() => {
          this.hasChildRoute = this.route.firstChild !== null;
          if (!this.hasChildRoute && this.nifMotorista) {
            this.loadDriverProfile();
          }
        })
    );

    this.nifMotorista =
      this.authService.getDriverNif() ||
      this.route.snapshot.paramMap.get('nif') ||
      '';

    this.loadDriverProfile();

    this.subscriptions.add(
      this.socketService
        .onEvent<{ driverId: string; ratingAverage: number; ratingCount: number }>('driver:ratingUpdated')
        .subscribe((ev) => {
          this.ngZone.run(() => {
            if (ev && this.motorista && String(ev.driverId) === String(this.motorista._id)) {
              const prevCount = this.motorista.ratingCount || 0;
              this.motorista.ratingAverage = ev.ratingAverage;
              this.motorista.ratingCount = ev.ratingCount;
              if (ev.ratingCount > prevCount) {
                this.alertService.notify({
                  title: 'New Driver Rating',
                  body: `Your average rating is now ${Number(ev.ratingAverage || 0).toFixed(1)} ★ (${ev.ratingCount} reviews).`,
                  sound: 'trip-update',
                  tag: 'driver-rating-updated'
                });
              }
            }
          });
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private loadDriverProfile(): void {
    if (!this.nifMotorista) return;
    this.motoristaService.getDriverByNIF(this.nifMotorista).subscribe({
      next: (motorista) => {
        this.motorista = motorista;
        this.motoristaService.setDriver(motorista);
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

  openReviewsModal(): void {
    this.showReviewsModal = true;
  }

  closeReviewsModal(): void {
    this.showReviewsModal = false;
  }

  openPhotoModal(): void {
    this.draftPhoto = this.motorista?.profilePhoto || null;
    this.photoError = '';
    this.showPhotoModal = true;
  }

  closePhotoModal(): void {
    if (!this.isUpdatingPhoto) {
      this.showPhotoModal = false;
      this.photoError = '';
    }
  }

  submitPhotoUpdate(): void {
    if (!this.nifMotorista || this.isUpdatingPhoto) return;
    this.photoError = '';
    this.isUpdatingPhoto = true;

    this.motoristaService.updateDriverPhoto(this.nifMotorista, this.draftPhoto).subscribe({
      next: (updated) => {
        this.isUpdatingPhoto = false;
        this.motorista = updated;
        this.motoristaService.setDriver(updated);
        this.showPhotoModal = false;
        this.snackBar.open('Profile photo updated!', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.isUpdatingPhoto = false;
        this.photoError = err?.error?.error || 'Could not update profile photo.';
      }
    });
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
