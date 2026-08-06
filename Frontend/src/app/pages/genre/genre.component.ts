import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { SongService } from '../../services/song.service';
import { Subscription } from 'rxjs';
import { buildCloudinaryUrl, GENRE_META, DEFAULT_GENRE_META, type GenreMeta } from '../../shared/constants';

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
    return GENRE_META[this.genreSlug.toLowerCase()] || DEFAULT_GENRE_META;
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
