import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('user_token');
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/refrescar-token') && !req.url.includes('/login')) {
        const authService = inject(AuthService);
        return authService.refreshToken().pipe(
          switchMap((response: any) => {
            const newReq = req.clone({
              setHeaders: { Authorization: `Bearer ${response.token}` },
            });
            return next(newReq);
          }),
          catchError((refreshError) => throwError(() => refreshError))
        );
      }
      return throwError(() => error);
    })
  );
};
