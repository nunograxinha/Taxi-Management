import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { TaxiService } from '../../appServices/taxi.service';
import { Taxi } from '../taxi_interface';
import { TurnoService } from '../../appServices/turno.service';

@Component({
  selector: 'app-taxi-form',
  templateUrl: './taxi-form.component.html',
  styleUrls: ['./taxi-form.component.css']
})
export class TaxiFormComponent implements OnChanges {
  @Output() taxiCreated = new EventEmitter<void>();
  taxiForm: FormGroup;

  selectedBrand: string = '';

  successMessage: string = '';

  errorMessage: string = '';

  availableModels: string[] = [];

  availableYears: number[] = [];

  inShift: boolean = false;

  @Input() taxiToEdit: any;
  @Output() taxiUpdated = new EventEmitter<void>();

  brandModels: { [brand: string]: string[] } = {
    'Audi': ['A3', 'A4', 'A6', 'Q4 e-tron', 'Q5'],
    'BMW': ['Série 2 Active Tourer', 'Série 3', 'Série 5', 'i4', 'i5', 'X1', 'X3'],
    'BYD': ['Atto 3', 'Dolphin', 'Han', 'Seal', 'Seal U'],
    'Citroën': ['Berlingo', 'C3', 'C4', 'C4 X', 'C5 Aircross', 'C5 X', 'ë-C4', 'SpaceTourer'],
    'Dacia': ['Duster', 'Jogger', 'Logan', 'Sandero', 'Spring'],
    'Fiat': ['500e', 'Doblo', 'Egea', 'Panda', 'Scudo', 'Tipo', 'Ulysse'],
    'Ford': ['Focus', 'Galaxy', 'Kuga', 'Mondeo', 'Mustang Mach-E', 'Puma', 'S-Max', 'Tourneo Connect', 'Tourneo Custom'],
    'Honda': ['Accord', 'Civic', 'CR-V', 'HR-V', 'Jazz'],
    'Hyundai': ['Elantra', 'i20', 'i30', 'Ioniq', 'Ioniq 5', 'Ioniq 6', 'Kona', 'Santa Fe', 'Tucson'],
    'Kia': ['Ceed', 'EV6', 'Niro', 'Optima', 'ProCeed', 'Sorento', 'Sportage', 'XCeed'],
    'Lexus': ['ES', 'NX', 'RX', 'UX'],
    'Mazda': ['3', '6', 'CX-30', 'CX-5', 'CX-60'],
    'Mercedes': ['Classe A', 'Classe B', 'Classe C', 'Classe E', 'Classe S', 'Classe V', 'EQA', 'EQB', 'EQE', 'EQS', 'EQV', 'Sprinter', 'Vito'],
    'MG': ['MG4', 'MG5', 'ZS EV'],
    'Nissan': ['Ariya', 'Juke', 'Leaf', 'NV200', 'Qashqai', 'X-Trail'],
    'Opel': ['Astra', 'Combo Life', 'Corsa', 'Crossland', 'Grandland', 'Insignia', 'Mokka', 'Vivaro', 'Zafira Life'],
    'Peugeot': ['2008', '208', '3008', '308', '408', '5008', '508', 'e-2008', 'e-308', 'Partner', 'Rifter', 'Traveller'],
    'Renault': ['Arkana', 'Austral', 'Captur', 'Clio', 'Espace', 'Kangoo', 'Megane', 'Megane E-Tech', 'Scenic E-Tech', 'Talisman', 'Trafic', 'Zoe'],
    'SEAT': ['Alhambra', 'Arona', 'Ateca', 'Ibiza', 'Leon', 'Tarraco', 'Toledo'],
    'Škoda': ['Enyaq', 'Fabia', 'Kamiq', 'Karoq', 'Kodiaq', 'Octavia', 'Rapid', 'Scala', 'Superb'],
    'Suzuki': ['Across', 'S-Cross', 'Swace', 'Vitara'],
    'Tesla': ['Model 3', 'Model S', 'Model X', 'Model Y'],
    'Toyota': ['Auris', 'Avensis', 'bZ4X', 'Camry', 'C-HR', 'Corolla', 'Corolla Cross', 'Highlander', 'Prius', 'Prius+', 'Proace', 'Proace City', 'RAV4', 'Yaris', 'Yaris Cross'],
    'Volkswagen': ['Arteon', 'Caddy', 'Caravelle', 'Golf', 'ID.3', 'ID.4', 'ID.5', 'ID.7', 'ID. Buzz', 'Jetta', 'Passat', 'Sharan', 'T-Cross', 'T-Roc', 'Tiguan', 'Touran', 'Transporter'],
    'Volvo': ['EX30', 'EX40', 'S60', 'S90', 'V60', 'V90', 'XC40', 'XC60', 'XC90']
  };

  maxCurrentYearValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    const year = +value;
    const currentYear = new Date().getFullYear();

    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (year < 0) {
      return { negativeYear: true };
    }

    if (isNaN(year) || control.value.toString().length !== 4) {
      return { invalidYearFormat: true };
    }

    if (year > currentYear) {
      return { futureYear: true };
    }

    return null;
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly taxiService: TaxiService,
    private readonly turnoService: TurnoService
  ) {
    this.taxiForm = this.fb.group({
      licensePlate: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{2}-\d{2}-[A-Za-z]{2}$|^\d{2}-[A-Za-z]{2}-\d{2}$|^[A-Za-z]{2}-\d{2}-\d{2}$|^\d{2}-\d{2}-[A-Za-z]{2}$/)]],
      brand: ['', Validators.required],
      model: ['', Validators.required],
      confort: ['', Validators.required],
      purchaseYear: ['', [Validators.required, this.maxCurrentYearValidator]]
    });

    const currentYear = new Date().getFullYear();
    this.availableYears = Array.from({ length: 50 }, (_, i) => currentYear - i);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['taxiToEdit'] && this.taxiToEdit) {
      this.selectedBrand = this.taxiToEdit.brand;
      this.taxiForm.patchValue({
        licensePlate: this.taxiToEdit.licensePlate,
        brand: this.taxiToEdit.brand,
        model: this.taxiToEdit.model,
        confort: this.taxiToEdit.confort,
        purchaseYear: this.taxiToEdit.purchaseYear
      });

      // Check if the taxi has associated shifts -> if so, disable the comfort field
      this.turnoService.getTurnosByTaxiPlate(this.taxiToEdit.licensePlate).subscribe({
        next: (shifts) => {
          this.inShift = Array.isArray(shifts) && shifts.length > 0;
          if (this.inShift) {
            this.taxiForm.get('confort')?.disable();
          } else {
            this.taxiForm.get('confort')?.enable();
          }
        },
        error: () => {
          this.taxiForm.get('confort')?.enable();
          this.inShift = false;
        }
      });
    }
  }

  onSubmit(): void {
    if (this.taxiForm.valid) {
      const formData = this.taxiForm.getRawValue();
      formData.licensePlate = formData.licensePlate.toUpperCase();

      const taxiPayload: Taxi = {
        licensePlate: formData.licensePlate,
        brand: formData.brand,
        model: formData.model,
        confort: formData.confort,
        purchaseYear: formData.purchaseYear
      };

      if (this.taxiToEdit) {
        this.taxiService.updateTaxiByLicensePlate(this.taxiToEdit.licensePlate, taxiPayload).subscribe({
          next: () => {
            this.taxiForm.reset();
            this.taxiUpdated.emit();
            this.successMessage = 'Taxi updated successfully!';
            setTimeout(() => { this.successMessage = ''; }, 3000);
          },
          error: () => {
            this.errorMessage = 'An error occurred while updating the taxi. Please try again.';
            setTimeout(() => { this.errorMessage = ''; }, 3000);
          }
        });
      } else {
        this.taxiService.createTaxi(taxiPayload).subscribe({
          next: (res) => {
            console.log('Taxi created successfully:', res);
            this.taxiForm.reset();
            this.taxiCreated.emit();
            this.successMessage = 'Taxi registered successfully!';
            setTimeout(() => { this.successMessage = ''; }, 3000);
          },
          error: (err) => {
            console.error('Error creating taxi:', err);
            this.errorMessage = 'An error occurred while registering the taxi. Please try again.';
            setTimeout(() => { this.errorMessage = ''; }, 3000);
          }
        });
      }
    } else {
      console.log('Invalid form!');
    }
  }

  onBrandChange(event: Event): void {
    const selected = (event.target as HTMLSelectElement).value;
    this.selectedBrand = selected;
    this.taxiForm.get('model')?.setValue('');
  }

  get availableBrands(): string[] {
    return Object.keys(this.brandModels);
  }
}
