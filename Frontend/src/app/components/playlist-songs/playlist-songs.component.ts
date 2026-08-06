import { ActivatedRoute } from '@angular/router';
import { SongService } from '../../services/song.service';
import { PlaylistService } from '../../services/playlist.service';
import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-playlist-songs',
  templateUrl: './playlist-songs.component.html',
  styleUrls: ['./playlist-songs.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class PlaylistSongsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  playlist: any = null;
  canciones: any[] = [];

  @Output() songSelected = new EventEmitter<any>();

  constructor(
    private route: ActivatedRoute,
    private songService: SongService,
    private playlistService: PlaylistService
  ) {}

  ngOnInit(): void {
    const playlistId = this.route.snapshot.paramMap.get('id');
    if (playlistId) {
      this.cargarPlaylist(playlistId);
    }
  }

  cargarPlaylist(id: string): void {
    this.playlistService.getPlaylist(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        if (!data || typeof data !== 'object') return;

        this.playlist = data;

        if (Array.isArray(data.canciones) && data.canciones.length > 0) {
          if (typeof data.canciones[0] === 'string') {
            this.obtenerDetallesCanciones(data.canciones);
          } else {
            this.canciones = [...data.canciones];
          }
        } else {
          this.canciones = [];
        }
      },
      error: () => {}
    });
  }

  obtenerDetallesCanciones(cancionIds: string[]): void {
    if (!cancionIds.length) return;

    const requests = cancionIds.map(id => this.songService.getCancionById(id));

    forkJoin(requests).pipe(takeUntil(this.destroy$)).subscribe({
      next: (songsData) => { this.canciones = songsData; },
      error: () => {}
    });
  }

  seleccionarCancion(song: any): void {
    if (!song?.fileUrl) return;
    this.songSelected.emit(song);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
