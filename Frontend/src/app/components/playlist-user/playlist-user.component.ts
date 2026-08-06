import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PlaylistService } from '../../services/playlist.service';
import { SongService } from '../../services/song.service';
import { AlertService } from '../../services/alert.service';
import { CommonModule } from '@angular/common';
import { PlaylistSongsComponent } from '../../components/playlist-songs/playlist-songs.component';

@Component({
  selector: 'app-playlist-user',
  templateUrl: './playlist-user.component.html',
  styleUrls: ['./playlist-user.component.css'],
  standalone: true,
  imports: [CommonModule, PlaylistSongsComponent]
})
export class PlaylistUserComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @Input() playlist: any = null;
  canciones: any[] = [];
  currentSong: any = null;
  showMusicPlayer = false;

  constructor(
    private route: ActivatedRoute,
    private songService: SongService,
    private playlistService: PlaylistService,
    private alert: AlertService
  ) {}

  ngOnInit(): void {
    const playlistId = this.route.snapshot.paramMap.get('id');
    if (playlistId) {
      this.cargarPlaylist(playlistId);
    }
  }

  cargarPlaylist(id: string) {
    this.playlistService.getPlaylist(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        if (!data || typeof data !== 'object') return;
        this.playlist = data;
        this.canciones = Array.isArray(data.canciones) ? data.canciones : [];
      },
      error: () => { this.alert.error('Error', 'No se pudo cargar la playlist.'); }
    });
  }

  playSong(song: any) {
    if (!song?.fileUrl) return;
    this.currentSong = song;
    this.showMusicPlayer = true;
    this.songService.setCurrentSong(song);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
