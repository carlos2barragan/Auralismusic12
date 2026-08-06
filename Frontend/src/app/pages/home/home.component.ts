import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HeaderComponent } from '../../components/header/header.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { RandomSongListComponent } from '../../components/random-song-list/random-song-list.component';
import { MostPlayedSongsComponent } from '../../components/most-played-songs/most-played-songs.component';
import { RecentSongsComponent } from '../../components/recent-songs/recent-songs.component';
import { SongService } from '../../services/song.service';
import { SpotifyService } from '../../services/spotify.service';
import { Cancion } from '../../models/cancion.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    SidebarComponent,
    RandomSongListComponent,
    MostPlayedSongsComponent,
    RecentSongsComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private loadRecentlyTimeout: ReturnType<typeof setTimeout> | null = null;
  currentSong: Cancion | null = null;
  isPlaying = false;
  showMusicPlayer = false;
  selectedArtist: { nombre: string; avatar: string } | null = null;
  mostPlayedSongs: Cancion[] = [];
  recentSongs: Cancion[] = [];
  recentlyPlayed: Cancion[] = [];
  listenedArtists: any[] = [];
  quickItems: Cancion[] = [];

  spotifyImages   = new Map<string, string>();
  spotifyLinks    = new Map<string, string>();
  spotifyPreviews = new Map<string, string>();
  artistImages    = new Map<string, string>();
  artistLinks     = new Map<string, string>();

  readonly defaultAvatar = 'https://res.cloudinary.com/dbt58u6ag/image/upload/v1740604204/uploads/afo3nyrvyhmn330lq0np.webp';
  heroTransform = '';

  constructor(private songService: SongService, private spotifyService: SpotifyService) {}

  ngOnInit() {
    this.songService.getMostPlayedSongs().pipe(takeUntil(this.destroy$)).subscribe(songs => {
      this.mostPlayedSongs = songs;
      this.buildQuickItems();
      this.deriveArtists();
      this.enrichSongs(songs);
      this.enrichArtists(songs.map((s: any) => s.cantante).filter(Boolean));
    });
    this.songService.getRecentSongs().pipe(takeUntil(this.destroy$)).subscribe(songs => {
      this.recentSongs = songs;
      this.enrichSongs(songs);
    });
    this.loadRecentlyPlayed();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.loadRecentlyTimeout) {
      clearTimeout(this.loadRecentlyTimeout);
    }
  }

  private loadRecentlyPlayed(): void {
    try {
      this.recentlyPlayed = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');
      this.buildQuickItems();
      this.deriveArtists();
    } catch { this.recentlyPlayed = []; }
  }

  private enrichSongs(songs: any[]): void {
    const payload = songs.slice(0, 10).map((s: any) => ({
      id: s._id,
      titulo: s.titulo,
      artista: s.cantante?.cantante || ''
    }));
    if (!payload.length) return;
    this.spotifyService.enrichSongs(payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: results => results.forEach((r: any) => {
        if (r.imagen) this.spotifyImages.set(r.id, r.imagen);
        if (r.externalUrl) this.spotifyLinks.set(r.id, r.externalUrl);
        if (r.preview) this.spotifyPreviews.set(r.id, r.preview);
      }),
      error: () => { console.error('Error al enriquecer canciones con Spotify'); }
    });
  }

  private enrichArtists(artists: any[]): void {
    const unique = [...new Map(artists.map((a: any) => [a._id, a])).values()].slice(0, 8);
    if (!unique.length) return;
    const payload = unique.map((a: any) => ({ id: a._id, nombre: a.cantante || a.nombre }));
    this.spotifyService.enrichArtists(payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: results => results.forEach((r: any) => {
        if (r.imagen) this.artistImages.set(r.id, r.imagen);
        if (r.externalUrl) this.artistLinks.set(r.id, r.externalUrl);
      }),
      error: () => { console.error('Error al enriquecer artistas con Spotify'); }
    });
  }

  private buildQuickItems(): void {
    const seen = new Set<string>();
    const result: Cancion[] = [];
    for (const s of [...this.recentlyPlayed, ...this.mostPlayedSongs]) {
      const id = (s as any)._id;
      if (id && !seen.has(id)) { seen.add(id); result.push(s); }
      if (result.length >= 8) break;
    }
    this.quickItems = result;
  }

  private deriveArtists(): void {
    const map = new Map<string, any>();
    [...this.recentlyPlayed, ...this.mostPlayedSongs].forEach((s: any) => {
      const c = s?.cantante;
      if (c?._id && !map.has(c._id)) map.set(c._id, c);
    });
    this.listenedArtists = [...map.values()].slice(0, 8);
  }

  get greeting(): string {
    const h = new Date().getHours();
    if (h >= 6 && h < 12) return 'Buenos días';
    if (h >= 12 && h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  get userName(): string {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored)?.nombre?.split(' ')[0] || '' : '';
    } catch { return ''; }
  }

  playSong(song: Cancion) {
    if (!song) return;
    const preview = this.spotifyPreviews.get((song as any)._id);
    const enriched = preview ? { ...song, fileUrl: preview } : song;
    this.currentSong = enriched as Cancion;
    this.isPlaying = true;
    this.showMusicPlayer = true;
    this.songService.setCurrentSong(enriched as Cancion);
    this.songService.setIsPlaying(true);
    this.selectedArtist = {
      nombre: song.cantante?.cantante || 'Artista desconocido',
      avatar: song.cantante?.avatar || this.defaultAvatar,
    };
    if (this.loadRecentlyTimeout) clearTimeout(this.loadRecentlyTimeout);
    this.loadRecentlyTimeout = setTimeout(() => this.loadRecentlyPlayed(), 500);
  }

  playRandomSong() {
    const pool = [...this.mostPlayedSongs, ...this.recentSongs];
    if (!pool.length) return;
    let s: Cancion;
    do { s = pool[Math.floor(Math.random() * pool.length)]; }
    while (s === this.currentSong && pool.length > 1);
    this.playSong(s);
  }

  onSongSelected(song: Cancion) { this.playSong(song); }

  onHeroMouseMove(e: MouseEvent): void {
    const el = e.currentTarget as HTMLElement;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = ((e.clientX - left) / width  - 0.5) * 12;
    const y = ((e.clientY - top)  / height - 0.5) * -8;
    this.heroTransform = `perspective(1200px) rotateY(${x}deg) rotateX(${y}deg)`;
  }

  onHeroMouseLeave(): void {
    this.heroTransform = 'perspective(1200px) rotateY(0deg) rotateX(0deg)';
  }

  get avatarUrl(): string { return this.selectedArtist?.avatar || this.defaultAvatar; }

  getImageUrl(song: any): string {
    const spotify = this.spotifyImages.get(song?._id);
    if (spotify) return spotify;
    if (!song?.imagen) return '';
    return song.imagen.startsWith('http')
      ? song.imagen
      : `https://res.cloudinary.com/dbt58u6ag/image/upload/v1740519430/${song.imagen}`;
  }

  getArtistImage(artist: any): string {
    return this.artistImages.get(artist?._id) || artist?.avatar || this.defaultAvatar;
  }

  getSpotifyLink(id: string): string | null {
    return this.spotifyLinks.get(id) || null;
  }
}
