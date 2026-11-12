import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from "@angular/core";
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import * as Papa from 'papaparse';
import { MotoristaService } from '../../appServices/motorista.service';
import { Motorista } from '../motorista_interface';

@Component({
  selector: 'app-motorista-form',
  templateUrl: './motorista-form.component.html',
  styleUrls: ['./motorista-form.component.css']
})
export class MotoristaFormComponent implements OnInit, OnChanges{
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
  
    // Verifica se é um número com 4 dígitos
    if (!/^\d{4}$/.test(trimmed)) {
      return { invalidYearFormat: true }; // ← nome agora corresponde ao template
    }
  
    const year = Number(trimmed);
    const currentYear = new Date().getFullYear();
  
    // Ano futuro
    if (year > currentYear) {
      return { futureYear: true };
    }
  
    // Menor de idade
    if ((currentYear - year) < 18) {
      return { minor: true };
    }
  
    return null;
  }
  
 

  nifValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    if (!value) return null;

    const trimmed = value.toString().trim();

    // Deve conter apenas dígitos (sem espaços, letras ou símbolos)
    if (!/^\d+$/.test(trimmed)) {
      return { invalidFormat: true };
    }

    // Não tem exatamente 9 dígitos
    if (trimmed.length !== 9) {
      return { invalidLength: true };
    }

    const num = Number(trimmed);

    // Número negativo ou zero
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


  constructor(private readonly fb: FormBuilder, private readonly motoristaService: MotoristaService) {
    this.motoristaForm = this.fb.group({
      name: ['', Validators.required],
      birthYear: ['', [Validators.required,this.birthYearValidator]], // RIA 6
      NIF: ['', [Validators.required, this.nifValidator]], // RIA 10
      gender: ['', Validators.required], // RIA 11
      drivingLicenseNumber: ['', [Validators.required,Validators.pattern(/^\d+$/)]], // RIA 12
      postalCode: ['', Validators.required],
      city: [''], // preenchido automaticamente
      street: ['', Validators.required], 
      doorNumber: ['', [Validators.required,this.doorNumberValidator]]
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['motoristaParaEditar'] && this.motoristaParaEditar) {
      // Preenche o formulário com os dados do motorista a editar
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
  
      const motoristaPayload: Motorista = {
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
      this.motoristaService.atualizarMotorista(
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
      this.motoristaService.criarMotorista(motoristaPayload).subscribe({
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

  // Verificar e preencher automaticamente a localidade com base no código postal
  onCodigoPostalChange() {
    const cp = this.motoristaForm.get('postalCode')?.value;
    if (cp && /^\d{4}-\d{3}$/.test(cp)) { 
      const [numCp, extCp] = cp.split('-'); // Divide o código postal em duas partes

      // Procurar pelo código postal completo
      const codigoPostalData = this.codigosPostais.find(item => item.num_cod_postal === numCp && item.ext_cod_postal === extCp);

      if (codigoPostalData) { // Se encontrar, preenche a localidade
        this.motoristaForm.get('city')?.setValue(codigoPostalData.nome_localidade);
      } else { // Se não encontrar, limpa o campo
        this.motoristaForm.get('city')?.setValue('');
      }
    }
  }
}
