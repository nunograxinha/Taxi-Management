import { Component, EventEmitter, Input, OnChanges, Output, SimpleChange, SimpleChanges } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { TaxiService } from '../../appServices/taxi.service';
import { Taxi } from '../taxi_interface';
import { TurnoService } from '../../appServices/turno.service';

@Component({
  selector: 'app-taxi-form',
  templateUrl: './taxi-form.component.html',
  styleUrls: ['./taxi-form.component.css']
})
export class TaxiFormComponent implements OnChanges{
  @Output() taxiCriado = new EventEmitter<void>();
  taxiForm: FormGroup;

  selectedMarca: string = '';

  mensagemSucesso: string = '';

  mensagemErro: string = '';

  modelosDisponiveis: string[] = [];

  anosDisponiveis: number[] = [];

  emTurno: boolean = false;

  @Input() taxiParaEditar: any;
  @Output() taxiEditado = new EventEmitter<void>();

  //Exemplo de marcas e modelos associados
  marcasModelos : {[brand: string]: string[]} = {
    'Toyota': ['Corolla', 'Prius', 'Yaris'],
    'Renault': ['Clio', 'Megane', 'Kangoo'],
    'Mercedes': ['Classe A', 'Classe E', 'Sprinter']
  };

maxCurrentYearValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  const year = +value;
  const currentYear = new Date().getFullYear();

  if (value === null || value === undefined || value === '') {
    return null;
  }

  if(year < 0){
    return { negativeYear : true };
  }

  if (isNaN(year) || control.value.toString().length !== 4) {
    return { invalidYearFormat: true };
  }

  if (year > currentYear) {
    return { futureYear: true };
  }

  return null;
}


  constructor(private readonly fb: FormBuilder, private readonly taxiService: TaxiService, private readonly turnoService: TurnoService) {
    this.taxiForm = this.fb.group({
      licensePlate: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{2}-\d{2}-[A-Za-z]{2}$|^\d{2}-[A-Za-z]{2}-\d{2}$|^[A-Za-z]{2}-\d{2}-\d{2}$|^\d{2}-\d{2}-[A-Za-z]{2}$/)]],
      brand: ['', Validators.required],
      model: ['', Validators.required],
      confort: ['', Validators.required],
      purchaseYear: ['', [Validators.required, this.maxCurrentYearValidator]]
    });

    const currentYear = new Date().getFullYear();
    this.anosDisponiveis = Array.from({ length: 50 }, (_, i) => currentYear - i); //últimos 50 anos

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['taxiParaEditar'] && this.taxiParaEditar) {
      this.taxiForm.patchValue({
        licensePlate: this.taxiParaEditar.licensePlate,
        brand: this.taxiParaEditar.brand,
        model: this.taxiParaEditar.model,
        confort: this.taxiParaEditar.confort,
        purchaseYear: this.taxiParaEditar.purchaseYear
      });

      // Verifica se o táxi tem turnos associados -> se sim, desabilita o campo confort
      this.turnoService.getTurnosByTaxiPlate(this.taxiParaEditar.licensePlate).subscribe({
        next: (turnos) => {
          this.emTurno = Array.isArray(turnos) && turnos.length > 0;
          if (this.emTurno) {
            this.taxiForm.get('confort')?.disable();
          } else {
            this.taxiForm.get('confort')?.enable();
          }
        },
        error: (err) => {
          // Em caso de erro, permite editar tudo
          this.taxiForm.get('confort')?.enable();
          this.emTurno = false;        
        }
      });
    }
  }

  onSubmit() {
    if (this.taxiForm.valid) {
      const formData = this.taxiForm.getRawValue();
      formData.licensePlate = formData.licensePlate.toUpperCase();

      const taxiPayload: Taxi = {
        licensePlate: formData.licensePlate,
        brand: formData.brand,
        model: formData.model,
        confort: formData.confort,
        purchaseYear: formData.purchaseYear,
      };

      if (this.taxiParaEditar) {
        this.taxiService.updateTaxiByLicensePlate(this.taxiParaEditar.licensePlate, taxiPayload).subscribe({
        next: (res) => {
          this.taxiForm.reset();
          this.taxiEditado.emit();
          this.mensagemSucesso = 'Táxi atualizado com sucesso!';
          setTimeout(() => { this.mensagemSucesso = ''; }, 3000);
        },
        error: (err) => {
          this.mensagemErro = 'Ocorreu um erro ao atualizar o táxi. Tente novamente.';
          setTimeout(() => { this.mensagemErro = ''; }, 3000);
        }
      });
      } else {
        this.taxiService.createTaxi(taxiPayload).subscribe({
          next: (res) => {
            console.log('Táxi criado com sucesso:', res);
            this.taxiForm.reset();
            this.taxiCriado.emit();
            this.mensagemSucesso = 'Táxi registado com sucesso!';

            setTimeout(() => {
              this.mensagemSucesso = '';
            }, 3000);
          },
          error: (err) => {
            console.error('Erro ao criar táxi:', err);
            this.mensagemErro = 'Ocorreu um erro ao registar o táxi. Tente novamente.';

            setTimeout(() => {
              this.mensagemErro = '';
            }, 3000);
          }
        });
    }
    } else {
      console.log('Formulário inválido!');
    }
  }

  onMarcaChange(event: Event) {
    const selected = (event.target as HTMLSelectElement).value;
    this.selectedMarca = selected;
  
    this.taxiForm.get('model')?.setValue('');
  }

  get marcasDisponiveis(): string[] {
    return Object.keys(this.marcasModelos);
  }
  
}
