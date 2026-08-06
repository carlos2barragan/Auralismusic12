import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { Cancion } from '../models/cancion.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SongService {
  private apiUrl = `${environment.apiUrl}/Api/canciones`;

  private playlist: Cancion[] = [];

  private playlistSubject = new BehaviorSubject<Cancion[]>(this.playlist);
  playlist$ = this.playlistSubject.asObservable();

  private currentSongSource = new BehaviorSubject<Cancion | null>(null);
  currentSong$ = this.currentSongSource.asObservable();

  private isPlayingSource = new BehaviorSubject<boolean>(false);
  isPlaying$ = this.isPlayingSource.asObservable();

  constructor(private http: HttpClient) {}

  getCanciones(): Observable<Cancion[]> {
    return this.http
      .get<Cancion[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  getCancionById(id: string): Observable<Cancion> {
    return this.http
      .get<Cancion>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  getMostPlayedSongs(): Observable<Cancion[]> {
    return this.http
      .get<Cancion[]>(`${this.apiUrl}/mas-escuchadas`)
      .pipe(catchError(this.handleError));
  }

  getRecentSongs(): Observable<Cancion[]> {
    return this.http
      .get<Cancion[]>(`${this.apiUrl}/recientes`)
      .pipe(catchError(this.handleError));
  }

  subirCancion(formData: FormData): Observable<Cancion> {
    return this.http
      .post<Cancion>(this.apiUrl, formData)
      .pipe(catchError(this.handleError));
  }

  updateSong(id: string, formData: FormData): Observable<Cancion> {
    return this.http
      .put<Cancion>(`${this.apiUrl}/${id}`, formData)
      .pipe(catchError(this.handleError));
  }

  deleteSong(id: string): Observable<any> {
    return this.http
      .delete<any>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  removeFromPlaylist(cancion: Cancion) {
    if (!cancion._id) return;
    this.playlist = this.playlist.filter((item) => item._id !== cancion._id);
    this.playlistSubject.next(this.playlist);
  }

  setCurrentSong(song: Cancion) {
    this.currentSongSource.next(song);
  }

  setIsPlaying(state: boolean) {
    this.isPlayingSource.next(state);
  }

  prevSong() {
    const currentSong = this.currentSongSource.getValue();
    if (!currentSong || this.playlist.length === 0) return;

    const currentIndex = this.playlist.findIndex((song) => song._id === currentSong._id);
    if (currentIndex > 0) {
      this.setCurrentSong(this.playlist[currentIndex - 1]);
    }
  }

  nextSong() {
    this.getCanciones().subscribe((songs) => {
      if (songs.length === 0) return;
      const randomIndex = Math.floor(Math.random() * songs.length);
      this.setCurrentSong(songs[randomIndex]);
      this.setIsPlaying(true);
    });
  }

  playRandomSong() {
    if (this.playlist.length === 0) return;
    const randomIndex = Math.floor(Math.random() * this.playlist.length);
    this.setCurrentSong(this.playlist[randomIndex]);
    this.setIsPlaying(true);
  }

  private handleError(error: any): Observable<never> {
    return throwError(() => error);
  }
}
