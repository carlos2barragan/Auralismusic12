import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HeaderComponent } from '../../components/header/header.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ArtistService } from '../../services/artist.service';
import { SongService } from '../../services/song.service';
import { SpotifyService, SpotifyTrack, SpotifyArtist } from '../../services/spotify.service';
import { Cancion } from '../../models/cancion.model';

@Component({
  selector: 'app-artist-info',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, SidebarComponent],
  templateUrl: './artist-info.component.html',
  styleUrls: ['./artist-info.component.css'],
})
export class ArtistInfoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  artist: any = null;
  spotifyArtist: SpotifyArtist | null = null;

  dbSongs: Cancion[] = [];
  spotifySongs: any[] = [];

  currentSong: Cancion | null = null;
  isPlaying = false;
  loading = true;
  loadingSpotify = false;

  readonly defaultAvatar = 'https://res.cloudinary.com/dbt58u6ag/image/upload/v1740604204/uploads/afo3nyrvyhmn330lq0np.webp';

  constructor(
    private route: ActivatedRoute,
    private artistService: ArtistService,
    private songService: SongService,
    private spotifyService: SpotifyService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id) this.loadArtist(id);
    });
    this.songService.currentSong$.pipe(takeUntil(this.destroy$)).subscribe(s => this.currentSong = s);
    this.songService.isPlaying$.pipe(takeUntil(this.destroy$)).subscribe(p => this.isPlaying = p);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadArtist(id: string): void {
    this.loading = true;
    this.artistService.getArtist(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.artist = data;
        this.dbSongs = Array.isArray(data.canciones) ? data.canciones : [];
        this.loading = false;
        this.enrichDbSongsWithSpotify();
        this.loadSpotifyTracks(data.cantante);
      },
      error: () => { this.loading = false; }
    });
  }

  private enrichDbSongsWithSpotify(): void {
    if (!this.dbSongs.length) return;
    const payload = this.dbSongs.map((s: any) => ({
      id: s._id,
      titulo: s.titulo,
      artista: s.cantante?.cantante || ''
    }));
    this.spotifyService.enrichSongs(payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (results: any[]) => {
        const map = new Map(results.map(r => [r.id, r]));
        this.dbSongs = this.dbSongs.map((song: any) => {
          const enriched = map.get(song._id);
          if (!enriched) return song;
          return {
            ...song,
            imagen: enriched.imagen || song.imagen,
            fileUrl: enriched.preview || song.fileUrl,
            _externalUrl: enriched.externalUrl,
            _hasSpotify: !!enriched.preview,
          };
        });
      },
      error: () => { this.loading = false; console.error('Error al obtener datos de Spotify') }
    });
  }

  private loadSpotifyTracks(artistName: string): void {
    this.loadingSpotify = true;
    this.spotifyService.getArtistByName(artistName).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        this.loadingSpotify = false;
        if (!result) return;
        this.spotifyArtist = result.artist;

        // Replace DB avatar with Spotify image if better
        if (result.artist.imagen && this.artist) {
          this.artist = { ...this.artist, avatar: result.artist.imagen };
        }

        // Keep only tracks not already in DB (by title)
        const dbTitles = new Set(this.dbSongs.map(s => s.titulo.toLowerCase().trim()));
        this.spotifySongs = result.topTracks
          .filter(t => !dbTitles.has(t.titulo.toLowerCase().trim()))
          .map(t => this.trackToSong(t, result.artist));
      },
      error: () => { this.loadingSpotify = false; }
    });
  }

  private trackToSong(track: SpotifyTrack, artist: SpotifyArtist): any {
    return {
      _id: `spotify_${track.spotifyId}`,
      titulo: track.titulo,
      cantante: { _id: '', cantante: artist.nombre, avatar: artist.imagen },
      album: track.album,
      genero: artist.generos?.[0] || '',
      imagen: track.imagen || '',
      fileUrl: track.preview || '',
      plays: track.popularity || 0,
      _fromSpotify: true,
      _hasPreview: !!track.preview,
      _externalUrl: track.externalUrl,
      _popularity: track.popularity,
    };
  }

  get allSongs(): any[] {
    return [...this.dbSongs, ...this.spotifySongs];
  }

  get totalPlays(): number {
    return this.dbSongs.reduce((sum, s: any) => sum + (s.plays || 0), 0);
  }

  get generos(): string[] {
    const g = new Set([
      ...this.dbSongs.map((s: any) => s.genero),
      ...(this.spotifyArtist?.generos?.slice(0, 2) || [])
    ].filter(Boolean));
    return [...g].slice(0, 4);
  }

  get artistAvatar(): string {
    return this.artist?.avatar || this.defaultAvatar;
  }

  get spotifyFollowers(): string | null {
    if (!this.spotifyArtist?.seguidores) return null;
    const n = this.spotifyArtist.seguidores;
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
    return String(n);
  }

  playSong(song: any): void {
    if (song._fromSpotify && !song._hasPreview) {
      if (song._externalUrl) window.open(song._externalUrl, '_blank');
      return;
    }
    this.songService.setCurrentSong(song);
    this.songService.setIsPlaying(true);
  }

  playRandom(): void {
    const playable = this.allSongs.filter(s => !s._fromSpotify || s._hasPreview);
    if (!playable.length) return;
    this.playSong(playable[Math.floor(Math.random() * playable.length)]);
  }

  isCurrentSong(song: any): boolean {
    return this.currentSong?._id === song._id;
  }

  formatPlays(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
    return String(n);
  }
}
