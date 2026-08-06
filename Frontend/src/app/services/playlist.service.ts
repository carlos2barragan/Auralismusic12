import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PlaylistService {
  private apiUrl = `${environment.apiUrl}/Api/Playlist`;
  private http = inject(HttpClient);

  getPlaylists(): Observable<any[]> {
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!user || !user._id) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    return this.http.get<any[]>(`${this.apiUrl}?userId=${user._id}`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getPlaylist(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  addSongToPlaylist(playlistId: string, song: any): Observable<any> {
    const body = { canciones: [song._id] };
    return this.http.post<any>(`${this.apiUrl}/${playlistId}`, body).pipe(
      catchError(err => throwError(() => err))
    );
  }

  createPlaylist(playlist: any): Observable<any> {
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!user?._id) {
      return throwError(() => new Error('ID de usuario no encontrado'));
    }

    const playlistWithUser = { ...playlist, creadoPor: user._id };
    return this.http.post(`${this.apiUrl}`, playlistWithUser).pipe(
      catchError(err => throwError(() => err))
    );
  }

  guardarPlaylist(playlistData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, playlistData).pipe(
      catchError(err => throwError(() => err))
    );
  }
}
