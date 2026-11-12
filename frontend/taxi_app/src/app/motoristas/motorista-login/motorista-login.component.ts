import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MotoristaService } from '../../appServices/motorista.service';
import { Motorista } from '../motorista_interface';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-motorista-login',
  templateUrl: './motorista-login.component.html',
  styleUrls: ['./motorista-login.component.css']
})
export class MotoristaLoginComponent {
  todosMotoristas: Motorista[] = [];
  motoristasFiltrados: Motorista[] = [];
  motoristaLoginForm: FormGroup;
  pesquisado = false;
  
  constructor(private readonly fb: FormBuilder, private readonly motoristaService: MotoristaService) {
    this.motoristaLoginForm = this.fb.group({
          NIF: [{ value: '', disabled: true}, [Validators.required, this.nifValidator]],
        });
  }
  
  ngOnInit(): void {
    this.carregarMotoristas();
    console.log(this.todosMotoristas);
    console.log(this.motoristasFiltrados);
  }

  onSubmit() {
    this.pesquisado = true;

    if (this.motoristaLoginForm.valid) {
      const formData = this.motoristaLoginForm.getRawValue();

      const nifInserido = formData.NIF.trim();

      // Filtrar os motoristas com o NIF correspondente
      this.motoristasFiltrados = this.todosMotoristas.filter(motorista => motorista.NIF === nifInserido);
    }

  }

  private carregarMotoristas(): void {
    this.motoristaService.obterMotoristas().subscribe({
      next: (data: Motorista[]) => {
        this.todosMotoristas = this.motoristaService.sortMotoristasByUpdatedAt(data);
        this.motoristasFiltrados = this.todosMotoristas;

        // Ativar o campo NIF se houver motoristas
        if (this.todosMotoristas.length > 0) {
          this.motoristaLoginForm.get('NIF')?.enable();
        }
      },
      error: (err: any) => {
        console.error('Error loading drivers:', err);
      }
    });
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

  limpar(){
    this.motoristaLoginForm.reset();
    this.carregarMotoristas();
    this.pesquisado = false;
  }
}

