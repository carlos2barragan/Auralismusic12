import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, firstValueFrom } from 'rxjs';
import { catchError, switchMap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface SpotifyTrack {
  spotifyId: string;
  titulo: string;
  artista: string;
  artistaId: string | null;
  album: string;
  imagen: string | null;
  duracionMs: number;
  preview: string | null;
  popularity: number;
  explicit: boolean;
  uri: string;
  externalUrl: string;
}

export interface SpotifyArtist {
  spotifyId: string;
  nombre: string;
  imagen: string | null;
  generos: string[];
  seguidores: number;
  popularity: number;
  uri: string;
  externalUrl: string;
}

export interface SpotifyPlaylist {
  id: string;
  nombre: string;
  descripcion: string;
  imagen: string | null;
  total: number;
  owner: string;
}

export interface SpotifySearchResult {
  tracks: SpotifyTrack[];
  artists: SpotifyArtist[];
}

@Injectable({ providedIn: 'root' })
export class SpotifyService {
  private apiUrl = `${environment.apiUrl}/Api/spotify`;

  constructor(private http: HttpClient) {}

  connectSpotify(userId: string): void {
    window.location.href = `${this.apiUrl}/auth?userId=${userId}`;
  }

  checkSession(): Observable<{ connected: boolean }> {
    return this.http.get<{ connected: boolean }>(`${this.apiUrl}/session`, { withCredentials: true });
  }

  disconnect(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/session`, { withCredentials: true });
  }

  search(query: string, type = 'track,artist', limit = 20): Observable<SpotifySearchResult> {
    return this.http
      .get<SpotifySearchResult>(`${this.apiUrl}/search`, { params: { q: query, type, limit } })
      .pipe(catchError(err => throwError(() => err)));
  }

  getTrack(id: string): Observable<SpotifyTrack> {
    return this.http
      .get<SpotifyTrack>(`${this.apiUrl}/track/${id}`)
      .pipe(catchError(err => throwError(() => err)));
  }

  getArtist(id: string): Observable<{ artist: SpotifyArtist; topTracks: SpotifyTrack[] }> {
    return this.http
      .get<{ artist: SpotifyArtist; topTracks: SpotifyTrack[] }>(`${this.apiUrl}/artist/${id}`)
      .pipe(catchError(err => throwError(() => err)));
  }

  getUserPlaylists(): Observable<SpotifyPlaylist[]> {
    return this.http
      .get<SpotifyPlaylist[]>(`${this.apiUrl}/playlists`, { withCredentials: true })
      .pipe(catchError(err => throwError(() => err)));
  }

  getPlaylistTracks(playlistId: string): Observable<SpotifyTrack[]> {
    return this.http
      .get<SpotifyTrack[]>(`${this.apiUrl}/playlists/${playlistId}/tracks`, { withCredentials: true })
      .pipe(catchError(err => throwError(() => err)));
  }

  getArtistByName(name: string): Observable<{ artist: SpotifyArtist; topTracks: SpotifyTrack[] } | null> {
    return this.search(name, 'artist', 1).pipe(
      switchMap(result => {
        const artist = result.artists[0];
        if (!artist) return of(null);
        return this.getArtist(artist.spotifyId);
      }),
      catchError(() => of(null))
    );
  }

  enrichSongs(songs: { id: string; titulo: string; artista: string }[]): Observable<any[]> {
    return this.http
      .post<any[]>(`${this.apiUrl}/enrich-songs`, { songs })
      .pipe(catchError(err => throwError(() => err)));
  }

  enrichArtists(artists: { id: string; nombre: string }[]): Observable<any[]> {
    return this.http
      .post<any[]>(`${this.apiUrl}/enrich-artists`, { artists })
      .pipe(catchError(err => throwError(() => err)));
  }

  // iTunes Search API — free, no auth, CORS-open, real 30s previews
  itunesPreview(titulo: string, artista: string): Observable<string | null> {
    const term = encodeURIComponent(`${titulo} ${artista}`);
    return this.http
      .get<any>(`https://itunes.apple.com/search?term=${term}&entity=song&limit=1&country=US`)
      .pipe(
        map(res => (res.results?.[0]?.previewUrl as string) || null),
        catchError(() => of(null))
      );
  }

  itunesPreviews(songs: { titulo: string; artista: string }[]): Observable<(string | null)[]> {
    return new Observable(obs => {
      Promise.all(
        songs.map(s =>
          firstValueFrom(this.itunesPreview(s.titulo, s.artista))
        )
      ).then(results => { obs.next(results as (string|null)[]); obs.complete(); })
       .catch(() => { obs.next(songs.map(() => null)); obs.complete(); });
    });
  }

  formatDuration(ms: number): string {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  }
}
