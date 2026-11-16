import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TurnoService } from '../../appServices/turno.service';
import { TaxiService } from '../../appServices/taxi.service';
import { ActivatedRoute } from '@angular/router';
import { Turno } from '../turno_interface';
import { Taxi } from '../../taxis/taxi_interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-turno-form',
  templateUrl: './turno-form.component.html',
  styleUrls: ['./turno-form.component.css']
})
export class TurnoFormComponent implements OnInit {
  turnoForm!: FormGroup;
  taxisDisponiveis: Taxi[] = [];
  motoristaNif!: string;

  constructor(
    private fb: FormBuilder,
    private turnoService: TurnoService,
    private taxiService: TaxiService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.motoristaNif = this.route.snapshot.paramMap.get('nif')!;

    this.turnoForm = this.fb.group(
      {
        inicio: ['', [Validators.required]],
        fim: ['', [Validators.required]],
        taxi: ['', [Validators.required]],
      },
      {
        validators: [this.validarTurno],
      }
    );

    const atualizarTaxis = (): void => {
      const inicioCtrl = this.turnoForm.get('inicio');
      const fimCtrl = this.turnoForm.get('fim');

      if (inicioCtrl?.valid && fimCtrl?.valid && !this.turnoForm.errors) {
        this.carregarTaxisDisponiveis();
      } else {
        this.taxisDisponiveis = [];
      }
    };

    this.turnoForm.get('inicio')?.valueChanges.subscribe(atualizarTaxis);
    this.turnoForm.get('fim')?.valueChanges.subscribe(atualizarTaxis);
  }

  validarTurno(group: AbstractControl): { [key: string]: any } | null {
    const inicio = new Date(group.get('inicio')?.value);
    const fim = new Date(group.get('fim')?.value);
    const agora = new Date();

    if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) return null;

    const duracaoMs = fim.getTime() - inicio.getTime();
    const duracaoHoras = duracaoMs / (1000 * 60 * 60);

    if (inicio <= agora) {
      return { inicioFuturo: true };
    }

    if (fim <= inicio) {
      return { fimAntesInicio: true };
    }

    if (duracaoHoras > 8) {
      return { turnoMuitoLongo: true };
    }

    return null;
  }

  carregarTaxisDisponiveis(): void {
    const inicio = new Date(this.turnoForm.get('inicio')?.value);
    const fim = new Date(this.turnoForm.get('fim')?.value);
  
    if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) return;
  
    this.taxiService.getTaxis().subscribe({
      next: (todosTaxis: Taxi[]) => {
        this.turnoService.getTurnos().subscribe({
          next: (turnos: Turno[]) => {
            const turnosConflitantes = turnos.filter(t => {
              const tInicio = new Date(t.start);
              const tFim = new Date(t.end);
              return inicio < tFim && fim > tInicio;
            });
  
            const taxisEmUsoIds = new Set(turnosConflitantes.map(t => t.taxi));
            this.taxisDisponiveis = todosTaxis.filter(taxi =>
              taxi._id && !taxisEmUsoIds.has(taxi._id)
            );
          },
          error: (err) => {
            if (err.status === 404) {
              // No shifts -> all taxis are available
              this.taxisDisponiveis = todosTaxis;
            } else {
              console.error('Error loading shifts:', err);
            }
          }
        });
      },
      error: (err: any) => {
        console.error('Error loading available taxis:', err);
      }
    });
  }

  onSubmit(): void {
    if (this.turnoForm.invalid) return;
  
    const inicio = new Date(this.turnoForm.value.inicio);
    const fim = new Date(this.turnoForm.value.fim);
    const taxiId = this.turnoForm.value.taxi;
  
    this.turnoService.getTurnosInTimeFrame(this.motoristaNif, inicio.toISOString(), fim.toISOString())
      .subscribe({
        next: (existeIntersecao: any) => {
          if (existeIntersecao && existeIntersecao.length > 0) {
            this.snackBar.open('A shift already exists during this timeframe.', 'Close', { duration: 4000 });
          } else {
            this.registarTurno(inicio, fim, taxiId);
          }
        },
        error: (err: any) => {
          if (err.status === 404) {
            // No intersections -> can create shift
            this.registarTurno(inicio, fim, taxiId);
          } else {
            console.error('Error checking intersections:', err);
            this.snackBar.open('Error checking shift conflicts.', 'Close', { duration: 4000 });
          }
        }
      });
  }

  private registarTurno(inicio: Date, fim: Date, taxiId: string): void {
    const novoTurno = {
      driver: this.motoristaNif,
      taxi: taxiId,
      start: inicio.toISOString(),
      end: fim.toISOString(),
    };
  
    this.turnoService.createTurno(novoTurno).subscribe({
      next: () => {
        this.snackBar.open('Shift registered successfully!', 'Close', { duration: 3500 });
        this.turnoForm.reset();
        this.taxisDisponiveis = [];
        
        // Redirect to shifts page
        this.router.navigate(['/motorista', this.motoristaNif, 'turnos']);
      },
      error: (err) => {
        console.error('Error registering shift:', err);
        this.snackBar.open('Error registering shift.', 'Close', { duration: 4000 });
      },
    });
  }
}
