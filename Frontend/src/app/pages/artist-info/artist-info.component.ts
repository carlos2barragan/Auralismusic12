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
import { FollowService } from '../../services/follow.service';
import { JamendoService, type JamendoTrack } from '../../services/jamendo.service';
import { Cancion } from '../../models/cancion.model';
import { CLOUDINARY } from '../../shared/constants';

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
  jamendoSongs: any[] = [];

  currentSong: Cancion | null = null;
  isPlaying = false;
  loading = true;
  loadingSpotify = false;
  isFollowing = false;
  followerCount = 0;
  private artistUserId: string | null = null;

  readonly defaultAvatar = CLOUDINARY.defaultAvatar;

  constructor(
    private route: ActivatedRoute,
    private artistService: ArtistService,
    private songService: SongService,
    private spotifyService: SpotifyService,
    private jamendoService: JamendoService,
    private followService: FollowService
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
    this.artistUserId = id;
    this.loadFollowInfo(id);
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
        if (!result || !result.artist) {
          this.spotifyArtist = null;
          this.spotifySongs = [];
          this.loadJamendoTracks(artistName);
          return;
        }
        this.spotifyArtist = result.artist;

        if (result.artist.imagen && this.artist) {
          this.artist = { ...this.artist, avatar: result.artist.imagen };
        }

        // Keep only tracks not already in DB (by title)
        const dbTitles = new Set(this.dbSongs.map(s => s.titulo.toLowerCase().trim()));
        this.spotifySongs = result.topTracks
          .filter(t => !dbTitles.has(t.titulo.toLowerCase().trim()))
          .map(t => this.trackToSong(t, result.artist));
      },
      error: () => {
        this.loadingSpotify = false;
        this.loadJamendoTracks(artistName);
      }
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

  private loadJamendoTracks(artistName: string): void {
    this.jamendoService.getArtistTracks(artistName).pipe(takeUntil(this.destroy$)).subscribe({
      next: (tracks) => {
        this.jamendoSongs = tracks.map((t: JamendoTrack) => ({
          _id: `jamendo_${t.jamendoId}`,
          titulo: t.titulo,
          cantante: { _id: '', cantante: t.artista, avatar: '' },
          album: t.album,
          genero: t.genero || 'General',
          imagen: t.imagen,
          fileUrl: t.fileUrl,
          plays: t.plays,
          _fromJamendo: true,
          _hasPreview: true,
        }));
        if (tracks.length > 0 && this.artist && !this.artist.avatar) {
          this.jamendoService.getArtistInfo(artistName).pipe(takeUntil(this.destroy$)).subscribe({
            next: (info) => {
              if (info?.imagen) {
                this.artist = { ...this.artist, avatar: info.imagen };
              }
            },
            error: () => {}
          });
        }
      },
      error: () => {}
    });
  }

  get allSongs(): any[] {
    return [...this.dbSongs, ...this.jamendoSongs, ...this.spotifySongs];
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

  get collaboratingArtists(): any[] {
    const artistName = this.artist?.cantante?.toLowerCase() || '';
    const seen = new Set<string>();
    return this.dbSongs
      .filter((s: any) => {
        const name = s.cantante?.cantante?.toLowerCase() || '';
        return name && name !== artistName;
      })
      .map((s: any) => s.cantante)
      .filter((c: any) => {
        if (!c?._id || seen.has(c._id)) return false;
        seen.add(c._id);
        return true;
      });
  }

  getAvatar(collab: any): string {
    return collab?.avatar || this.defaultAvatar;
  }

  private loadFollowInfo(userId: string): void {
    this.followService.isFollowing(userId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => this.isFollowing = res.following,
      error: () => {}
    });
    this.followService.getFollowers(userId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => this.followerCount = res.count,
      error: () => {}
    });
  }

  toggleFollow(): void {
    if (!this.artistUserId) return;
    if (!this.isLoggedIn()) return;
    if (this.isFollowing) {
      this.followService.unfollow(this.artistUserId).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => { this.isFollowing = false; this.followerCount = Math.max(0, this.followerCount - 1); },
        error: () => {}
      });
    } else {
      this.followService.follow(this.artistUserId).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => { this.isFollowing = true; this.followerCount++; },
        error: () => {}
      });
    }
  }

  formatFollowers(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
    return String(n);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('user_token');
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
