import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { catchError, tap, switchMap, filter, take } from 'rxjs/operators'
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/Api`;
  private http = inject(HttpClient);
  private router = inject(Router);
  private authStatus = new BehaviorSubject<boolean>(this.isLogged());
  isLogged$ = this.authStatus.asObservable();

  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  setToken(token: string): void {
    localStorage.setItem('user_token', token);
    this.authStatus.next(true);
  }

  setRefreshToken(refreshToken: string): void {
    localStorage.setItem('refresh_token', refreshToken);
  }

  removeToken(): void {
    localStorage.removeItem('user_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
    this.authStatus.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem('user_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  isLogged(): boolean {
    return !!localStorage.getItem('user_token');
  }

  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  logout(): void {
    const userId = this.getUserId();
    if (userId) {
      this.http.post(`${this.apiUrl}/usuarios/${userId}/cerrar-sesion`, {}).subscribe();
    }
    this.removeToken();
    this.authStatus.next(false);
    this.router.navigate(['/login']);
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        this.setToken(response.token);
        this.setRefreshToken(response.refreshToken);

        const userData = {
          _id: response.user._id,
          nombre: response.user.nombre,
          email: response.user.email,
          rol: response.user.rol?.trim().toLowerCase() || 'usuario',
        };

        localStorage.setItem('user', JSON.stringify(userData));
        this.router.navigate(['/home']);
      }),
      catchError(error => {
        let errorMessage = 'Error al iniciar sesión.';
        if (error?.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        return throwError(() => new Error(errorMessage));
      })
    );
  }

  refreshToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No hay refresh token'));
    }

    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token =>
          new Observable(subscriber => {
            subscriber.next({ token, refreshToken: this.getRefreshToken() });
            subscriber.complete();
          })
        )
      );
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    return this.http.post<any>(`${this.apiUrl}/refrescar-token`, { refreshToken }).pipe(
      tap(response => {
        this.isRefreshing = false;
        this.setToken(response.token);
        this.setRefreshToken(response.refreshToken);
        this.refreshTokenSubject.next(response.token);
      }),
      catchError(error => {
        this.isRefreshing = false;
        this.logout();
        return throwError(() => error);
      })
    );
  }
}
