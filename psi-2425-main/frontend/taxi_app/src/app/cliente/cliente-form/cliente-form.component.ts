import { Component, EventEmitter, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClienteService } from '../../appServices/cliente.service';
import { Cliente } from '../cliente_interface';

@Component({
  selector: 'app-cliente-form',
  templateUrl: './cliente-form.component.html',
  styleUrls: ['./cliente-form.component.css']
})
export class ClienteFormComponent {
  clienteForm: FormGroup;
  errorMessage: string = ''; 
  @Output() clienteCriado = new EventEmitter<Cliente>();

  constructor(
    private fb:FormBuilder,
    private clienteService: ClienteService  
    ) {
    this.clienteForm = this.fb.group({
      NIF: ['', [Validators.required, this.nifValidator]],
      name: ['', Validators.required],
      gender: ['', Validators.required]
    });
  }

  nifValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const nifPattern = /^\d{9}$/;
    if (control.value && !nifPattern.test(control.value)) {
      return { 'invalidNIF': true };
    }
    return null;
  }

 onSubmit() {
  this.errorMessage = '';
    if (this.clienteForm.valid) {
      const clienteData: Cliente = this.clienteForm.value;
      this.clienteService.registarCliente(clienteData).subscribe({
        next: (novoCliente) => {
          this.clienteCriado.emit(novoCliente);
          this.clienteForm.reset();
          alert("Cliente criado com sucesso!");
        },
        error: (error) => {
          console.error("Erro ao criar cliente:", error);
          this.errorMessage = "Erro ao criar cliente. Tente novamente."; 
        }
      });
    } else {
      Object.keys(this.clienteForm.controls).forEach(key => {
        const control = this.clienteForm.get(key);
        control?.markAsTouched();
      });    }
  }
}