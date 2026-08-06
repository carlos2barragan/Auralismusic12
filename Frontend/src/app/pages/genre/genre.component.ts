import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { SongService } from '../../services/song.service';
import { Subscription } from 'rxjs';
import { buildCloudinaryUrl } from '../../shared/constants';

interface GenreMeta { icon: string; gradient: string; accent: string; }

@Component({
  selector: 'app-genre',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, SidebarComponent],
  templateUrl: './genre.component.html',
  styleUrls: ['./genre.component.css']
})
export class GenreComponent implements OnInit, OnDestroy {
  genreName = '';
  genreSlug = '';
  songs: any[] = [];
  loading = true;
  currentSong: any = null;

  private subs = new Subscription();

  private readonly metaMap: Record<string, GenreMeta> = {
    'reggaeton':   { icon: '🎤', gradient: 'linear-gradient(135deg,#7C3AED 0%,#4C1D95 100%)', accent: '#7C3AED' },
    'pop':         { icon: '🌟', gradient: 'linear-gradient(135deg,#DB2777 0%,#831843 100%)', accent: '#DB2777' },
    'r&b':         { icon: '🎷', gradient: 'linear-gradient(135deg,#DC2626 0%,#7F1D1D 100%)', accent: '#DC2626' },
    'hip-hop':     { icon: '🎧', gradient: 'linear-gradient(135deg,#D97706 0%,#78350F 100%)', accent: '#D97706' },
    'alternative': { icon: '🎸', gradient: 'linear-gradient(135deg,#059669 0%,#064E3B 100%)', accent: '#059669' },
    'indie':       { icon: '🎵', gradient: 'linear-gradient(135deg,#0284C7 0%,#0C4A6E 100%)', accent: '#0284C7' },
    'indie pop':   { icon: '🎵', gradient: 'linear-gradient(135deg,#0EA5E9 0%,#0C4A6E 100%)', accent: '#0EA5E9' },
    'latin urban': { icon: '🎺', gradient: 'linear-gradient(135deg,#B2A179 0%,#78683A 100%)', accent: '#B2A179' },
    'latin':       { icon: '🪘', gradient: 'linear-gradient(135deg,#F59E0B 0%,#92400E 100%)', accent: '#F59E0B' },
    'rock':        { icon: '🎸', gradient: 'linear-gradient(135deg,#6B7280 0%,#1F2937 100%)', accent: '#9CA3AF' },
    'electronic':  { icon: '⚡', gradient: 'linear-gradient(135deg,#6366F1 0%,#3730A3 100%)', accent: '#6366F1' },
    'dance':       { icon: '💃', gradient: 'linear-gradient(135deg,#06B6D4 0%,#0E7490 100%)', accent: '#06B6D4' },
    'trap':        { icon: '🔊', gradient: 'linear-gradient(135deg,#8B5CF6 0%,#4C1D95 100%)', accent: '#8B5CF6' },
    'soul':        { icon: '❤️', gradient: 'linear-gradient(135deg,#EF4444 0%,#7F1D1D 100%)', accent: '#EF4444' },
  };
  private readonly defaultMeta: GenreMeta = {
    icon: '🎶',
    gradient: 'linear-gradient(135deg,#374151 0%,#111827 100%)',
    accent: '#9CA3AF'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private songService: SongService
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.route.paramMap.subscribe(params => {
        this.genreSlug = params.get('name') || '';
        this.genreName = this.genreSlug.replace(/\b\w/g, c => c.toUpperCase());
        this.loadSongs();
      })
    );
    this.subs.add(this.songService.currentSong$.subscribe(s => this.currentSong = s));
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  get meta(): GenreMeta {
    return this.metaMap[this.genreSlug.toLowerCase()] || this.defaultMeta;
  }

  loadSongs(): void {
    this.loading = true;
    this.songService.getCanciones().subscribe({
      next: songs => {
        this.songs = songs.filter((s: any) =>
          s.genero?.toLowerCase().trim() === this.genreSlug.toLowerCase().trim()
        );
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  playSong(song: any): void {
    this.songService.setCurrentSong(song);
    this.songService.setIsPlaying(true);
  }

  isCurrentSong(song: any): boolean {
    return this.currentSong?._id === song._id;
  }

  getImageUrl(song: any): string {
    return buildCloudinaryUrl(song?.imagen);
  }

  goToArtist(song: any, e: Event): void {
    e.stopPropagation();
    const id = song?.cantante?._id;
    if (id) this.router.navigate(['/artist', id]);
  }
}
