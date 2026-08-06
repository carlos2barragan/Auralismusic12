import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PlaylistService } from '../../services/playlist.service';
import { SongService } from '../../services/song.service';
import { AlertService } from '../../services/alert.service';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { PlaylistUserComponent } from '../../components/playlist-user/playlist-user.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';

@Component({
  standalone: true,
  selector: 'app-private-playlist',
  templateUrl: './private-playlist.component.html',
  styleUrls: ['./private-playlist.component.css'],
  imports: [CommonModule, HeaderComponent, PlaylistUserComponent, SidebarComponent]
})
export class PrivatePlaylistComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  playlist: any = null;
  canciones: any[] = [];
  currentSong: any = null;
  isPlaying = false;
  audioPlayer = new Audio();
  showMusicPlayer = false; 

  @Output() songSelected = new EventEmitter<any>();

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

    if (this.currentSong && this.isPlaying) {
      this.audioPlayer.pause();
      this.audioPlayer.currentTime = 0;
    }

    this.currentSong = song;
    this.isPlaying = true;
    this.showMusicPlayer = true; 

    this.audioPlayer.src = song.fileUrl;
    this.audioPlayer.play();

    this.audioPlayer.onended = () => {
      this.isPlaying = false;
    };

    this.songSelected.emit(song);
  }

  pauseSong() {
    if (this.isPlaying) {
      this.audioPlayer.pause();
      this.isPlaying = false;
    }
  }

  stopCurrentSong() {
    this.audioPlayer.pause();
    this.audioPlayer.currentTime = 0;
    this.isPlaying = false;
    this.currentSong = null;
    this.showMusicPlayer = false;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.audioPlayer.pause();
    this.audioPlayer.src = '';
  }

  playSidebarSong(song: any): void {
    this.songService.setCurrentSong(song);
    this.songService.setIsPlaying(true);
  }
}
