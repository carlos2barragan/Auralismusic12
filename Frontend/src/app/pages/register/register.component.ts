import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertService } from '../../services/alert.service';
import { CLOUDINARY } from '../../shared/constants';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
})
export class RegisterComponent {
  readonly logoUrl = CLOUDINARY.logo;
  registerForm: FormGroup;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  passwordVisible: boolean = false;
  loading: boolean = false;
  cardTransform: string = '';

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

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private alert: AlertService
  ) {
    this.registerForm = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.alert.warning('Campos incompletos', 'Por favor, completa todos los campos correctamente.');
      return;
    }

    this.loading = true;

    const usuario = {
      nombre: this.registerForm.value.nombre,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password
    };

    this.userService.register(usuario).subscribe({
      next: () => {
        this.alert.success('¡Registro exitoso!', 'Hemos enviado un correo de verificación. Por favor, revisa tu bandeja de entrada.')
          .then(() => {
            this.registerForm.reset();
            this.router.navigate(['/verificar-email']);
          });
        this.loading = false;
      },
      error: (error) => {
        this.alert.error('Error al registrarse', error.error?.message || 'Hubo un problema, intenta nuevamente.');
        this.loading = false;
      },
    });
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }
}
