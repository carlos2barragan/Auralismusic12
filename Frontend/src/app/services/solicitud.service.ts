import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SolicitudService {
  private apiUrl = `${environment.apiUrl}/Api/solicitudes`;

  constructor(private http: HttpClient) {}

  enviar(userId: string, mensaje = ''): Observable<any> {
    return this.http.post(`${this.apiUrl}/${userId}`, { mensaje });
  }

  miSolicitud(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/usuario/${userId}`);
  }

  listar(estado?: string): Observable<any[]> {
    const params = estado ? `?estado=${estado}` : '';
    return this.http.get<any[]>(`${this.apiUrl}${params}`);
  }

  aceptar(solicitudId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${solicitudId}/aceptar`, {});
  }

  rechazar(solicitudId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${solicitudId}/rechazar`, {});
  }
}
