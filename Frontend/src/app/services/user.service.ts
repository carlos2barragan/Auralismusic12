import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { RegisterData, RegisterResponse } from '../models/user.model';
import { tap, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  public apiUrl = `${environment.apiUrl}/Api`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  register(registerData: RegisterData): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/registro`, registerData).pipe(
      tap((response: RegisterResponse) => {
        if (response?.user?._id && response.token) {
          localStorage.setItem('userId', response.user._id);
          this.authService.setToken(response.token);
        }
      }),
      catchError(this.handleError<RegisterResponse>('Error al registrar el usuario'))
    );
  }

  verifyEmail(token: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/verificar/${token}`).pipe(
      tap(response => {
        if (response?.success && response?.token && response?.user) {
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('user', JSON.stringify({
            _id: response.user._id,
            nombre: response.user.nombre,
            email: response.user.email,
            rol: response.user.rol || 'usuario',
          }));
          this.router.navigate(['/login']);
        } else {
          this.router.navigate(['/register']);
        }
      }),
      catchError(() => throwError(() => new Error('Error al verificar el email.')))
    );
  }

  fetchUserProfile(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/usuarios/${userId}`).pipe(
      catchError(this.handleError<any>('Error al obtener el perfil'))
    );
  }

  updateUserRole(userId: string, role: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/usuarios/${userId}/rol`, { role }).pipe(
      catchError(this.handleError<any>('Error al actualizar el rol'))
    );
  }

  solicitarArtista(userId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/usuarios/${userId}/solicitar-artista`, {}).pipe(
      catchError(this.handleError<any>('Error al solicitar artista'))
    );
  }

  updateProfile(userId: string, data: { nombre?: string; email?: string; avatar?: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuarios/${userId}`, data).pipe(
      catchError(this.handleError<any>('Error al actualizar perfil'))
    );
  }

  changePassword(userId: string, passwordActual: string, passwordNueva: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/usuarios/${userId}/password`, { passwordActual, passwordNueva }).pipe(
      catchError(this.handleError<any>('Error al cambiar contraseña'))
    );
  }

  getStats(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/usuarios/${userId}/stats`).pipe(
      catchError(this.handleError<any>('Error al obtener estadísticas'))
    );
  }

  registerPlay(userId: string, song: { cancionId: string; titulo: string; cantante: string; genero: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios/${userId}/play`, song).pipe(
      catchError(() => of(null))
    );
  }

  updateConfig(userId: string, config: { perfilPublico?: boolean; mostrarHistorial?: boolean; notificaciones?: boolean }): Observable<any> {
    return this.http.patch(`${this.apiUrl}/usuarios/${userId}/config`, { config }).pipe(
      catchError(this.handleError<any>('Error al actualizar configuración'))
    );
  }

  private handleError<T>(defaultMessage: string) {
    return (error: any): Observable<T> => {
      const errorMessage = error.error ? JSON.stringify(error.error) : defaultMessage;
      return throwError(() => new Error(errorMessage));
    };
  }
}
