import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UIStateService } from '../../services/ui-state.service';
import { SongService } from '../../services/song.service';
import { SpotifyService, SpotifyTrack, SpotifyArtist } from '../../services/spotify.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  menuOpen = false;
  sidebarOpen = false;

  searchQuery = '';
  songs: any[] = [];
  dbResults: any[] = [];
  spotifyTracks: SpotifyTrack[] = [];
  spotifyArtists: SpotifyArtist[] = [];
  searchLoading = false;
  isSearchOpen = false;

  private searchSubject = new Subject<string>();
  private subs = new Subscription();

  constructor(
    private authService: AuthService,
    private uiState: UIStateService,
    private songService: SongService,
    private spotifyService: SpotifyService
  ) {}

  ngOnInit(): void {
    this.subs.add(this.uiState.sidebarOpen$.subscribe(v => this.sidebarOpen = v));
    this.songService.getCanciones().subscribe({ next: d => this.songs = d, error: () => console.error('Error al cargar canciones') });

    this.subs.add(
      this.searchSubject.pipe(
        debounceTime(320),
        distinctUntilChanged(),
        switchMap(q => {
          if (!q.trim()) {
            this.spotifyTracks = [];
            this.spotifyArtists = [];
            this.searchLoading = false;
            return of(null);
          }
          this.searchLoading = true;
          return this.spotifyService.search(q, 'track,artist', 6).pipe(
            catchError(() => of(null))
          );
        })
      ).subscribe(result => {
        this.searchLoading = false;
        if (result) {
          this.spotifyTracks = (result.tracks || []).slice(0, 5);
          this.spotifyArtists = (result.artists || []).slice(0, 3);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  toggleMenu()    { this.menuOpen = !this.menuOpen; }
  toggleSidebar() { this.uiState.toggle(); }

  openSearch(): void {
    this.isSearchOpen = true;
    this.filterDb();
  }

  onInput(): void {
    this.filterDb();
    this.searchSubject.next(this.searchQuery);
  }

  private filterDb(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.dbResults = q
      ? this.songs.filter(s =>
          s.titulo?.toLowerCase().includes(q) ||
          s.cantante?.cantante?.toLowerCase().includes(q) ||
          s.album?.toLowerCase().includes(q)
        ).slice(0, 5)
      : [];
  }

  get hasResults(): boolean {
    return this.dbResults.length > 0 || this.spotifyTracks.length > 0 || this.spotifyArtists.length > 0;
  }

  playSong(song: any): void {
    this.songService.setCurrentSong(song);
    this.songService.setIsPlaying(true);
    this.clearSearch();
  }

  playSpotifyTrack(track: SpotifyTrack): void {
    this.clearSearch();
    this.spotifyService.itunesPreview(track.titulo, track.artista).subscribe(previewUrl => {
      if (previewUrl) {
        this.songService.setCurrentSong({
          titulo: track.titulo,
          cantante: { cantante: track.artista },
          album: track.album,
          imagen: track.imagen || '',
          fileUrl: previewUrl,
          _id: track.spotifyId,
        } as any);
        this.songService.setIsPlaying(true);
      } else {
        window.open(track.externalUrl, '_blank');
      }
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.dbResults = [];
    this.spotifyTracks = [];
    this.spotifyArtists = [];
    this.isSearchOpen = false;
    this.searchLoading = false;
  }

  logout() {
    this.menuOpen = false;
    this.authService.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event): void {
    const el = document.querySelector('.header-search');
    if (el && !el.contains(e.target as Node)) this.isSearchOpen = false;
    const menu = document.querySelector('.dropdown');
    if (menu && !menu.contains(e.target as Node)) this.menuOpen = false;
  }
}
