import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface JamendoTrack {
  jamendoId: string;
  titulo: string;
  artista: string;
  album: string;
  imagen: string;
  fileUrl: string;
  downloadUrl: string;
  duracion: number;
  genero: string;
  plays: number;
}

export interface JamendoArtist {
  nombre: string;
  imagen: string | null;
  generos: string[];
}

@Injectable({ providedIn: 'root' })
export class JamendoService {
  private apiUrl = `${environment.apiUrl}/Api/jamendo`;

  constructor(private http: HttpClient) {}

  getArtistTracks(artistName: string): Observable<JamendoTrack[]> {
    return this.http.get<JamendoTrack[]>(`${this.apiUrl}/artist/tracks?name=${encodeURIComponent(artistName)}`);
  }

  getArtistInfo(artistName: string): Observable<JamendoArtist | null> {
    return this.http.get<JamendoArtist | null>(`${this.apiUrl}/artist/info?name=${encodeURIComponent(artistName)}`);
  }
}
