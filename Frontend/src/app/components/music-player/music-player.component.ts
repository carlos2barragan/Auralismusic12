import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Howl, Howler } from 'howler';
import { Subscription } from 'rxjs';
import { SongService } from '../../services/song.service';
import { Cancion } from '../../models/cancion.model';
import { CommonModule } from '@angular/common';
import { take } from 'rxjs/operators';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-music-player',
  standalone: true,
  templateUrl: './music-player.component.html',
  styleUrls: ['./music-player.component.css'],
  imports: [CommonModule]
})
export class MusicPlayerComponent implements OnInit, OnDestroy {
  @Input() currentSong: Cancion | null = null;
  @Input() isPlaying: boolean = false;
  @Output() isPlayingChange = new EventEmitter<boolean>();

  private sound: Howl | null = null;
  private songSubscription!: Subscription;
  private interval: any;
  private history: Cancion[] = [];
  private currentSongIndex: number = -1;

  volume: number = 0.7;
  private lastVolume: number = 0.7;
  currentTime: number = 0;
  duration: number = 0;
  liked = false;
  shuffleOn = false;
  repeatOn = false;

  private userServiceSub: Subscription | null = null;

  constructor(
    private songService: SongService,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.songSubscription = this.songService.currentSong$.subscribe(song => {
      if (song) {
        this.destroySound();
        this.currentSong = song;
        this.playCurrentSong();
      }
    });
  }

  ngOnDestroy() {
    this.songSubscription?.unsubscribe();
    if (this.userServiceSub) this.userServiceSub.unsubscribe();
    this.destroySound();
    clearInterval(this.interval);
  }

  get progress(): number {
    if (!this.duration || isNaN(this.duration) || this.duration === 0) return 0;
    return Math.min(100, (this.currentTime / this.duration) * 100);
  }

  private playCurrentSong() {
    if (!this.currentSong?.fileUrl) return;

    this.sound = new Howl({
      src: [this.currentSong.fileUrl],
      html5: true,
      volume: this.volume,
      onplay: () => {
        this.isPlaying = true;
        this.isPlayingChange.emit(true);
        this.trackProgress();
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (user?._id && this.currentSong) {
          this.userServiceSub = this.userService.registerPlay(user._id, {
            cancionId: (this.currentSong as any)._id || '',
            titulo: this.currentSong.titulo || '',
            cantante: (this.currentSong.cantante as any)?.cantante || '',
            genero: (this.currentSong as any).genero || ''
          }).subscribe();
        }
        // Save full song object to recently played in localStorage
        try {
          const recent: any[] = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');
          const filtered = recent.filter((s: any) => s._id !== (this.currentSong as any)?._id);
          filtered.unshift(this.currentSong);
          localStorage.setItem('recentlyPlayed', JSON.stringify(filtered.slice(0, 15)));
        } catch { /* ignorar errores de parse */ }
      },
      onend: () => {
        if (this.repeatOn) {
          this.sound?.play();
        } else {
          this.nextSong();
        }
      }
    });

    this.sound.play();
  }

  togglePlay() {
    if (!this.sound) return;
    if (this.sound.playing()) {
      this.sound.pause();
      this.isPlaying = false;
    } else {
      this.sound.play();
      this.isPlaying = true;
      this.trackProgress();
    }
    this.isPlayingChange.emit(this.isPlaying);
    this.songService.setIsPlaying(this.isPlaying);
  }

  toggleLike() { this.liked = !this.liked; }
  toggleShuffle() { this.shuffleOn = !this.shuffleOn; }
  toggleRepeat() { this.repeatOn = !this.repeatOn; }

  toggleMute() {
    if (this.volume > 0) {
      this.lastVolume = this.volume;
      this.volume = 0;
    } else {
      this.volume = this.lastVolume || 0.7;
    }
    Howler.volume(this.volume);
  }

  seekClick(e: MouseEvent) {
    const track = e.currentTarget as HTMLElement;
    const rect = track.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const seekTime = pct * this.duration;
    if (this.sound) {
      this.sound.seek(seekTime);
      this.currentTime = seekTime;
    }
  }

  seekVolume(e: MouseEvent) {
    const track = e.currentTarget as HTMLElement;
    const rect = track.getBoundingClientRect();
    this.volume = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    Howler.volume(this.volume);
  }

  private trackProgress() {
    clearInterval(this.interval);
    this.interval = setInterval(() => {
      if (this.sound?.playing()) {
        this.currentTime = this.sound.seek() as number;
        this.duration = this.sound.duration() as number;
      }
    }, 500);
  }

  nextSong() {
    this.destroySound();
    this.songService.getCanciones().pipe(take(1)).subscribe(canciones => {
      if (!canciones.length) return;
      let next: Cancion;
      do {
        next = canciones[Math.floor(Math.random() * canciones.length)];
      } while (this.currentSong && (next as any)._id === (this.currentSong as any)._id && canciones.length > 1);

      if (this.currentSong) {
        this.history.push(this.currentSong);
        this.currentSongIndex = this.history.length - 1;
      }

      this.currentSong = next;
      this.songService.setCurrentSong(next);
      this.playCurrentSong();
    });
  }

  prevSong() {
    if (this.history.length > 0 && this.currentSongIndex >= 0) {
      this.destroySound();
      this.currentSong = this.history[this.currentSongIndex];
      this.currentSongIndex = Math.max(this.currentSongIndex - 1, 0);
      this.songService.setCurrentSong(this.currentSong);
      this.playCurrentSong();
    }
  }

  goToArtist() {
    const cantanteId = (this.currentSong?.cantante as any)?._id;
    if (cantanteId) this.router.navigate(['/artist', cantanteId]);
  }

  private destroySound() {
    if (this.sound) {
      if (this.sound.playing()) this.sound.stop();
      this.sound.unload();
      this.sound = null;
    }
    Howler.stop();
    clearInterval(this.interval);
    this.currentTime = 0;
    this.duration = 0;
  }

  formatTime(time: number): string {
    if (isNaN(time) || time < 0) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }
}
