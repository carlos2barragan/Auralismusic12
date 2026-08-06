import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SongService } from '../../services/song.service';
import { UIStateService } from '../../services/ui-state.service';
import { catchError, of, Subscription } from 'rxjs';
import { CLOUDINARY } from '../../shared/constants';

export interface GenreCard {
  name: string;
  slug: string;
  icon: string;
  gradient: string;
  count: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  readonly logoUrl = CLOUDINARY.logo;
  isOpen = false;
  genres: GenreCard[] = [];

  get isAdmin(): boolean {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u)?.rol === 'administrador' : false;
    } catch { return false; }
  }

  private subs = new Subscription();

  private readonly genreMeta: Record<string, { icon: string; gradient: string }> = {
    'reggaeton':    { icon: '🎤', gradient: 'linear-gradient(135deg,#7C3AED,#4C1D95)' },
    'pop':          { icon: '🌟', gradient: 'linear-gradient(135deg,#DB2777,#831843)' },
    'r&b':          { icon: '🎷', gradient: 'linear-gradient(135deg,#DC2626,#7F1D1D)' },
    'hip-hop':      { icon: '🎧', gradient: 'linear-gradient(135deg,#D97706,#78350F)' },
    'alternative':  { icon: '🎸', gradient: 'linear-gradient(135deg,#059669,#064E3B)' },
    'indie':        { icon: '🎵', gradient: 'linear-gradient(135deg,#0284C7,#0C4A6E)' },
    'indie pop':    { icon: '🎵', gradient: 'linear-gradient(135deg,#0EA5E9,#0C4A6E)' },
    'latin urban':  { icon: '🎺', gradient: 'linear-gradient(135deg,#B2A179,#78683A)' },
    'latin':        { icon: '🪘', gradient: 'linear-gradient(135deg,#F59E0B,#92400E)' },
    'rock':         { icon: '🎸', gradient: 'linear-gradient(135deg,#6B7280,#1F2937)' },
    'electronic':   { icon: '⚡', gradient: 'linear-gradient(135deg,#6366F1,#3730A3)' },
    'dance':        { icon: '💃', gradient: 'linear-gradient(135deg,#06B6D4,#0E7490)' },
    'trap':         { icon: '🔊', gradient: 'linear-gradient(135deg,#8B5CF6,#4C1D95)' },
    'soul':         { icon: '❤️', gradient: 'linear-gradient(135deg,#EF4444,#7F1D1D)' },
    'jazz':         { icon: '🎷', gradient: 'linear-gradient(135deg,#F59E0B,#451A03)' },
    'classical':    { icon: '🎻', gradient: 'linear-gradient(135deg,#9CA3AF,#111827)' },
  };

  private readonly defaultMeta = { icon: '🎶', gradient: 'linear-gradient(135deg,#374151,#111827)' };

  constructor(
    private songService: SongService,
    private router: Router,
    private uiState: UIStateService
  ) {}

  ngOnInit(): void {
    this.subs.add(this.uiState.sidebarOpen$.subscribe(v => this.isOpen = v));
    this.loadGenres();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  close(): void { this.uiState.close(); }
  open(): void  { this.uiState.open(); }

  goToGenre(genre: GenreCard): void {
    this.router.navigate(['/genre', genre.slug]);
    this.close();
  }

  private loadGenres(): void {
    this.songService.getCanciones().pipe(catchError(() => of([]))).subscribe(songs => {
      const counts = new Map<string, number>();
      songs.forEach((s: any) => {
        if (s.genero) {
          const key = s.genero.toLowerCase().trim();
          counts.set(key, (counts.get(key) || 0) + 1);
        }
      });

      this.genres = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([key, count]) => {
          const meta = this.genreMeta[key] || this.defaultMeta;
          return {
            name: this.titleCase(key),
            slug: key,
            icon: meta.icon,
            gradient: meta.gradient,
            count
          };
        });
    });
  }

  private titleCase(str: string): string {
    return str.replace(/\b\w/g, c => c.toUpperCase());
  }
}
