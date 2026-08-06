import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SongService } from '../../services/song.service';
import { UIStateService } from '../../services/ui-state.service';
import { catchError, of, Subscription } from 'rxjs';
import { CLOUDINARY, GENRE_META, DEFAULT_GENRE_META } from '../../shared/constants';

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
          const meta = GENRE_META[key] || DEFAULT_GENRE_META;
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
