import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AlertService } from '../../services/alert.service';
import { CLOUDINARY } from '../../shared/constants';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit, OnDestroy {
  readonly logoUrl = CLOUDINARY.logo;
  loginForm: FormGroup;
  mensaje: string = '';
  passwordVisible: boolean = false;
  errorMessage: string | null = null;
  cardTransform: string = '';
  private loginSubscription: Subscription | undefined;
  failedAttempts: number = 0;

  @ViewChild('cardRef') cardRef?: ElementRef<HTMLElement>;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private alert: AlertService
  ) {}

  onMouseMove(e: MouseEvent) {
    const scene = e.currentTarget as HTMLElement;
    const rect = scene.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const rotateX = (-y * 14).toFixed(2);
    const rotateY = (x * 14).toFixed(2);
    this.cardTransform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`;
  }

  onMouseLeave() {
    this.cardTransform = 'rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['verified']) {
        this.alert.success('Cuenta verificada', 'Ahora puedes iniciar sesión.');
      }
    });

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;

      if (this.loginSubscription) {
        this.loginSubscription.unsubscribe();
      }

      this.loginSubscription = this.authService.login(email, password).subscribe({
        next: (res) => {
          if (res.token && res.user) {
            this.alert.notify('success', 'Bienvenido de vuelta');
            this.router.navigate(['/home']).then(navigated => {
              if (!navigated) {
                this.alert.error('Error', 'No se pudo redirigir a la página principal.');
              }
            });
          } else {
            this.alert.warning('Respuesta inesperada', 'El servidor devolvió una respuesta inválida.');
          }
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Ocurrió un error, intenta más tarde.';
          this.failedAttempts++;

          if (this.failedAttempts > 2) {
            this.alert.confirm('¿Olvidaste tu contraseña?', 'Puedes restablecerla ahora.', 'Restablecer')
              .then(result => {
                if (result.isConfirmed) this.router.navigate(['/reset-password']);
              });
          } else {
            this.alert.error('Credenciales incorrectas', 'Verifica tu email y contraseña.');
          }
        }
      });
    } else {
      this.alert.warning('Campos incompletos', 'Por favor, completa todos los campos correctamente.');
    }
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  ngOnDestroy() {
    if (this.loginSubscription) {
      this.loginSubscription.unsubscribe();
    }
  }
}
