import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from "@angular/core";
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import * as Papa from 'papaparse';
import { DriverService } from '../../appServices/driver.service';
import { Driver } from '../driver.interface';

@Component({
  selector: 'app-motorista-form',
  templateUrl: './driver-form.component.html',
  styleUrls: ['./driver-form.component.css']
})
export class DriverFormComponent implements OnInit, OnChanges{
  @Output() motoristaCriado = new EventEmitter<void>();

  motoristaForm: FormGroup;

  codigosPostais: any[] = []; //guarda os dados do ficheiro CSV

  mensagemSucesso: string = '';

  mensagemErro: string = '';

  @Input() motoristaParaEditar: any;
  @Output() motoristaEditado = new EventEmitter<void>();

  birthYearValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
  
    if (!value) return null;
  
    const trimmed = value.toString().trim();
  
    // Check if it is a 4-digit number
    if (!/^\d{4}$/.test(trimmed)) {
      return { invalidYearFormat: true }; // matches template error key
    }
  
    const year = Number(trimmed);
    const currentYear = new Date().getFullYear();
  
    // Future year
    if (year > currentYear) {
      return { futureYear: true };
    }
  
    // Underage
    if ((currentYear - year) < 18) {
      return { minor: true };
    }
  
    return null;
  }
  
 

  nifValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    if (!value) return null;

    const trimmed = value.toString().trim();

    // Must contain digits only (no spaces, letters, or symbols)
    if (!/^\d+$/.test(trimmed)) {
      return { invalidFormat: true };
    }

    // Must be exactly 9 digits
    if (trimmed.length !== 9) {
      return { invalidLength: true };
    }

    const num = Number(trimmed);

    // Negative or zero
    if (num < 0) {
      return { notPositive: true };
    }

    return null;
}

doorNumberValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;

  if (value === null || value === undefined || value.toString().trim() === '') {
    return { required: true };
  }

  const trimmed = value.toString().trim();

  if (!/^\d+$/.test(trimmed)) {
    return { notDigitsOnly: true };
  }

  return null;
}


  constructor(private readonly fb: FormBuilder, private readonly motoristaService: DriverService) {
    this.motoristaForm = this.fb.group({
      name: ['', Validators.required],
      birthYear: ['', [Validators.required,this.birthYearValidator]], // RIA 6
      NIF: ['', [Validators.required, this.nifValidator]], // RIA 10
      gender: ['', Validators.required], // RIA 11
      drivingLicenseNumber: ['', [Validators.required,Validators.pattern(/^\d+$/)]], // RIA 12
      postalCode: ['', Validators.required],
      city: [''], // filled automatically
      street: ['', Validators.required], 
      doorNumber: ['', [Validators.required,this.doorNumberValidator]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['motoristaParaEditar'] && this.motoristaParaEditar) {
      this.motoristaForm.get('password')?.clearValidators();
      this.motoristaForm.get('password')?.updateValueAndValidity();
      // Populate the form with the driver data to edit
      this.motoristaForm.patchValue({
        name: this.motoristaParaEditar.name,
        birthYear: this.motoristaParaEditar.birthYear,
        NIF: this.motoristaParaEditar.NIF,
        gender: this.motoristaParaEditar.gender,
        drivingLicenseNumber: this.motoristaParaEditar.drivingLicenseNumber,
        postalCode: this.motoristaParaEditar.address?.postalCode,
        city: this.motoristaParaEditar.address?.city,
        street: this.motoristaParaEditar.address?.street,
        doorNumber: this.motoristaParaEditar.address?.doorNumber
      });
    }
  }

  ngOnInit() {
    this.carregarCodigosPostais();
  }

  // Load data from CSV
  carregarCodigosPostais() {
    Papa.parse('/assets/data/codigos_postais.csv', {
      download: true,
      header: true,
      complete: (result: Papa.ParseResult<any>) => {
        this.codigosPostais = result.data;
        console.log('Postal codes loaded');
      },
      error: (error) => {
        console.error('Error loading CSV: ', error);
      }
    });
  }

  onSubmit() {
    if (this.motoristaForm.valid) {
      const formData = this.motoristaForm.getRawValue();
  
      const motoristaPayload: Driver = {
        name: formData.name,
        NIF: formData.NIF,
        gender: formData.gender,
        birthYear: formData.birthYear,
        drivingLicenseNumber: formData.drivingLicenseNumber,
        address: {
          postalCode: formData.postalCode,
          city: formData.city,
          street: formData.street, 
          doorNumber: formData.doorNumber
        },
      };
  

      if (this.motoristaParaEditar) {
      // Edit
      this.motoristaService.updateDriver(
        this.motoristaParaEditar.NIF,
        motoristaPayload
      ).subscribe({
        next: () => {
          this.motoristaForm.reset();
          this.motoristaEditado.emit();
          this.mensagemSucesso = 'Driver updated successfully!';
          setTimeout(() => { this.mensagemSucesso = ''; }, 3000);
        },
        error: (err: any) => {
          this.mensagemErro = 'An error occurred while updating the driver. Please try again.';
          setTimeout(() => { this.mensagemErro = ''; }, 3000);
        }
      });
    } else {
      const createPayload = { ...motoristaPayload, password: formData.password };
      this.motoristaService.createDriver(createPayload).subscribe({
        next: (res: any) => {
          console.log('Driver created successfully:', res);
          this.motoristaForm.reset();
          this.motoristaCriado.emit();
          this.mensagemSucesso = 'Driver registered successfully!';
          setTimeout(() => {
            this.mensagemSucesso = '';
          }, 3000);
        },
        error: (err: any) => {
          console.error('Error creating driver:', err);
          this.mensagemErro = 'An error occurred while registering the driver. Please try again.';
          setTimeout(() => {
            this.mensagemErro = '';
          }, 3000);
        }
      });
    }
    } else {
      console.log('Invalid form!');
    }
}

  // Verify and auto-fill the city based on the postal code
  onCodigoPostalChange() {
    const cp = this.motoristaForm.get('postalCode')?.value;
    if (cp && /^\d{4}-\d{3}$/.test(cp)) { 
      const [numCp, extCp] = cp.split('-'); // Split postal code into two parts

      // Search for the full postal code
      const codigoPostalData = this.codigosPostais.find(item => item.num_cod_postal === numCp && item.ext_cod_postal === extCp);

      if (codigoPostalData) { // If found, fill in the city
        this.motoristaForm.get('city')?.setValue(codigoPostalData.nome_localidade);
      } else { // Otherwise, clear the field
        this.motoristaForm.get('city')?.setValue('');
      }
    }
  }

  generateRandomPassword(): void {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
    const bytes = new Uint32Array(10);
    crypto.getRandomValues(bytes);
    let generated = '';
    for (let i = 0; i < bytes.length; i++) {
      generated += chars[bytes[i] % chars.length];
    }
    this.motoristaForm.get('password')?.setValue(generated);
    this.motoristaForm.get('password')?.markAsTouched();
  }
}
