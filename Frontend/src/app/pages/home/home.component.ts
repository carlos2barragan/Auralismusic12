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
import { PremiumModalComponent } from '../../components/premium-modal/premium-modal.component';
import { AdModalComponent } from '../../components/ad-modal/ad-modal.component';
import { SongService } from '../../services/song.service';
import { SpotifyService } from '../../services/spotify.service';
import { AdService } from '../../services/ad.service';
import { PremiumService } from '../../services/premium.service';
import { Cancion } from '../../models/cancion.model';
import { CLOUDINARY, buildCloudinaryUrl } from '../../shared/constants';

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
    PremiumModalComponent,
    AdModalComponent,
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

  readonly defaultAvatar = CLOUDINARY.defaultAvatar;
  heroTransform = '';

  showPremiumModal = false;
  showAd = false;
  isPremiumUser = false;

  adTitle = '';
  adDescription = '';
  adImage = '';
  adLink = '';

  private SONG_RECS = [
    { titulo: 'Blinding Lights', descripcion: 'The Weeknd · 4.2M reproducciones · Synth-pop' },
    { titulo: 'Mi Gente', descripcion: 'J Balvin · 3.4M reproducciones · Reggaetón' },
    { titulo: 'Bad Guy', descripcion: 'Billie Eilish · 3.1M reproducciones · Pop Alternativo' },
    { titulo: 'Waka Waka', descripcion: 'Shakira · 3.8M reproducciones · Pop Latino' },
    { titulo: 'Yellow', descripcion: 'Coldplay · 2.2M reproducciones · Rock Alternativo' },
    { titulo: 'Levitating', descripcion: 'Dua Lipa · 2.7M reproducciones · Pop / Disco' },
  ];

  private ARTIST_RECS = [
    { titulo: 'Bad Bunny', descripcion: '3.3M+ reproducciones · Reggaetón, Latin Urban' },
    { titulo: 'The Weeknd', descripcion: '6.8M+ reproducciones · R&B, Synth-pop' },
    { titulo: 'Shakira', descripcion: '4.9M+ reproducciones · Pop Latino' },
    { titulo: 'Eminem', descripcion: '4.7M+ reproducciones · Hip-Hop' },
    { titulo: 'Karol G', descripcion: '3.7M+ reproducciones · Reggaetón' },
    { titulo: 'Dua Lipa', descripcion: '5.1M+ reproducciones · Pop / Disco' },
  ];

  constructor(
    private songService: SongService,
    private spotifyService: SpotifyService,
    private adService: AdService,
    private premiumService: PremiumService
  ) {}

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
    this.checkPremiumAndAds();
  }

  private checkPremiumAndAds(): void {
    this.isPremiumUser = this.premiumService.isPremium();
    if (!this.isPremiumUser) {
      setTimeout(() => { this.pickRandomAd(); }, 8000);
    }
  }

  private pickRandomAd(): void {
    const roll = Math.random();
    if (roll < 0.35) {
      const rec = this.SONG_RECS[Math.floor(Math.random() * this.SONG_RECS.length)];
      this.adTitle = `🎵 ${rec.titulo}`;
      this.adDescription = rec.descripcion;
      this.adImage = '';
      this.adLink = '';
      this.showAd = true;
    } else if (roll < 0.65) {
      const rec = this.ARTIST_RECS[Math.floor(Math.random() * this.ARTIST_RECS.length)];
      this.adTitle = `🎤 ${rec.titulo}`;
      this.adDescription = rec.descripcion;
      this.adImage = '';
      this.adLink = '';
      this.showAd = true;
    } else {
      this.adService.getAnuncios().pipe(takeUntil(this.destroy$)).subscribe({
        next: (ads) => {
          const ad = ads[Math.floor(Math.random() * ads.length)];
          if (ad) {
            this.adTitle = ad.titulo;
            this.adDescription = ad.descripcion;
            this.adImage = ad.imagen || '';
            this.adLink = ad.enlace || '';
            this.showAd = true;
          }
        },
        error: () => {}
      });
    }
  }

  onAdClosed(): void {
    this.showAd = false;
    if (!this.isPremiumUser) {
      setTimeout(() => { this.pickRandomAd(); }, 60000);
    }
  }

  onUpgradeClick(): void {
    this.showPremiumModal = true;
  }

  onPremiumUpgraded(): void {
    this.isPremiumUser = true;
    this.showAd = false;
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
    return spotify || buildCloudinaryUrl(song?.imagen);
  }

  getArtistImage(artist: any): string {
    return this.artistImages.get(artist?._id) || artist?.avatar || this.defaultAvatar;
  }

  getSpotifyLink(id: string): string | null {
    return this.spotifyLinks.get(id) || null;
  }
}
