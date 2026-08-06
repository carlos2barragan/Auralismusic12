import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SongService } from '../../services/song.service';
import { HeaderComponent } from '../../components/header/header.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { AlertService } from '../../services/alert.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-subir-cancion',
  standalone: true,
  templateUrl: './subir-cancion.component.html',
  styleUrls: ['./subir-cancion.component.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HeaderComponent, SidebarComponent]
})
export class SubirCancionComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  cancionForm: FormGroup;
  cargando = false;
  archivoCancion: File | null = null;
  archivoImagen: File | null = null;
  nombreArchivo = '';
  nombreImagen = '';
  previewImagen = '';

  readonly generos = [
    'Reggaeton', 'Pop', 'R&B', 'Hip-Hop', 'Rock', 'Electronic',
    'Latin', 'Trap', 'Alternative', 'Indie', 'Soul', 'Jazz',
    'Dance', 'Classical', 'Indie Pop', 'Latin Urban'
  ];

  constructor(
    private fb: FormBuilder,
    private songService: SongService,
    private router: Router,
    private alert: AlertService
  ) {
    this.cancionForm = this.fb.group({
      cantante: ['', Validators.required],
      cancion:  ['', Validators.required],
      album:    ['', Validators.required],
      genero:   ['', Validators.required],
    });
  }

  ngOnInit(): void {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user?.nombre) this.cancionForm.patchValue({ cantante: user.nombre });
    } catch {}
  }

  seleccionarArchivo(event: Event, tipo: 'song' | 'image'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (tipo === 'song') {
      if (!file.type.startsWith('audio/')) {
        this.alert.warning('Archivo inválido', 'Selecciona un archivo de audio (MP3, WAV, etc.)');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        this.alert.warning('Archivo muy grande', 'El audio no debe superar 20 MB.');
        return;
      }
      this.archivoCancion = file;
      this.nombreArchivo = file.name;
    } else {
      if (!file.type.startsWith('image/')) {
        this.alert.warning('Archivo inválido', 'Selecciona una imagen (JPG, PNG, etc.)');
        return;
      }
      this.archivoImagen = file;
      this.nombreImagen = file.name;
      const reader = new FileReader();
      reader.onload = (e) => { this.previewImagen = e.target?.result as string; };
      reader.readAsDataURL(file);
    }
  }

  limpiarAudio(): void {
    this.archivoCancion = null;
    this.nombreArchivo = '';
  }

  limpiarImagen(): void {
    this.archivoImagen = null;
    this.nombreImagen = '';
    this.previewImagen = '';
  }

  subirCancion(): void {
    if (this.cancionForm.invalid || !this.archivoCancion) {
      this.alert.warning('Campos incompletos', 'Completa todos los campos y selecciona un archivo de audio.');
      return;
    }

    const formData = new FormData();
    formData.append('cantante', this.cancionForm.get('cantante')!.value);
    formData.append('cancion',  this.cancionForm.get('cancion')!.value);
    formData.append('album',    this.cancionForm.get('album')!.value);
    formData.append('genero',   this.cancionForm.get('genero')!.value);
    formData.append('song', this.archivoCancion);
    if (this.archivoImagen) formData.append('imageCover', this.archivoImagen);

    this.cargando = true;
    this.songService.subirCancion(formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.cargando = false;
        this.alert.success('¡Canción publicada!', 'Tu música ya está disponible en Auralis.')
          .then(() => this.router.navigate(['/home']));
        this.cancionForm.reset();
        this.archivoCancion = null;
        this.archivoImagen = null;
        this.nombreArchivo = '';
        this.nombreImagen = '';
        this.previewImagen = '';
      },
      error: () => {
        this.cargando = false;
        this.alert.error('Error al subir', 'Hubo un problema. Intenta nuevamente.');
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
