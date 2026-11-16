import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../appServices/auth.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent {
  showManagerLogin = false;
  managerPassword = '';
  managerError = '';
  isSubmitting = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  openManagerLogin(): void {
    this.showManagerLogin = true;
    this.managerPassword = '';
    this.managerError = '';
  }

  closeManagerLogin(): void {
    this.showManagerLogin = false;
    this.managerPassword = '';
    this.managerError = '';
  }

  enterAsManager(): void {
    if (!this.managerPassword.trim() || this.isSubmitting) return;
    this.isSubmitting = true;
    this.managerError = '';

    this.authService.loginAsManager(this.managerPassword).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showManagerLogin = false;
        this.router.navigate(['/gestor']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.managerError = err?.error?.error || 'Invalid manager password.';
      }
    });
  }

  enterAsClient(): void {
    this.router.navigate(['/cliente']);
  }
}
