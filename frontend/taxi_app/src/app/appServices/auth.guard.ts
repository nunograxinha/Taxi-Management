import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from './auth.service';

export const managerGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  if (authService.isAuthenticated('manager')) {
    return true;
  }

  snackBar.open('Please sign in as a Manager to access this area.', 'Close', { duration: 3500 });
  return router.createUrlTree(['/']);
};

export const driverGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  const routeNif = route.paramMap.get('nif') || undefined;

  if (authService.isAuthenticated('driver', routeNif)) {
    return true;
  }

  snackBar.open('Please sign in with your Driver profile first.', 'Close', { duration: 3500 });
  return router.createUrlTree(['/motorista']);
};
