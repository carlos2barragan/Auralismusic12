import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Anuncio {
  _id: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  enlace: string;
  tipo: 'banner' | 'modal' | 'sidebar';
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdService {
  private apiUrl = `${environment.apiUrl}/Api/anuncios`;
  private shownToday = new Set<string>();

  constructor(private http: HttpClient) {}

  getAnuncios(): Observable<Anuncio[]> {
    return this.http.get<Anuncio[]>(this.apiUrl);
  }

  markShown(adId: string): void {
    this.shownToday.add(adId);
  }

  wasShown(adId: string): boolean {
    return this.shownToday.has(adId);
  }

  resetShown(): void {
    this.shownToday.clear();
  }
}
