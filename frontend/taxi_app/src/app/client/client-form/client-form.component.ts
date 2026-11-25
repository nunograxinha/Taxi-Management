import { Component, EventEmitter, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../appServices/auth.service';
import { Client } from '../client.interface';

@Component({
  selector: 'app-cliente-form',
  templateUrl: './client-form.component.html',
  styleUrls: ['./client-form.component.css']
})
export class ClientFormComponent {
  mode: 'login' | 'register' = 'login';
  loginForm: FormGroup;
  registerForm: FormGroup;
  registerPhoto: string | null = null;
  errorMessage: string = '';
  isSubmitting = false;
  @Output() clienteCriado = new EventEmitter<Client>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      NIF: ['', [Validators.required, this.nifValidator]],
      password: ['', [Validators.required]]
    });

    this.registerForm = this.fb.group({
      NIF: ['', [Validators.required, this.nifValidator]],
      name: ['', Validators.required],
      gender: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  switchMode(mode: 'login' | 'register'): void {
    this.mode = mode;
    this.errorMessage = '';
  }

  nifValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const nifPattern = /^\d{9}$/;
    if (control.value && !nifPattern.test(control.value)) {
      return { invalidNIF: true };
    }
    return null;
  }

  onSubmit(): void {
    this.errorMessage = '';
    if (this.mode === 'login') {
      if (this.loginForm.invalid) {
        this.loginForm.markAllAsTouched();
        return;
      }
      const { NIF, password } = this.loginForm.value;
      this.isSubmitting = true;
      this.authService.loginAsClient(NIF.trim(), password).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          if (res.client) {
            this.clienteCriado.emit(res.client);
            this.snackBar.open('Signed in successfully!', 'Close', { duration: 3000 });
          }
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage = err?.error?.error || 'Invalid NIF or password.';
        }
      });
    } else {
      if (this.registerForm.invalid) {
        this.registerForm.markAllAsTouched();
        return;
      }
      this.isSubmitting = true;
      this.authService.registerClient({
        ...this.registerForm.value,
        profilePhoto: this.registerPhoto
      }).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          if (res.client) {
            this.clienteCriado.emit(res.client);
            this.registerForm.reset();
            this.registerPhoto = null;
            this.snackBar.open('Account created successfully!', 'Close', { duration: 3500 });
          }
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage = err?.error?.error || 'Error creating account. Please try again.';
        }
      });
    }
  }
}
