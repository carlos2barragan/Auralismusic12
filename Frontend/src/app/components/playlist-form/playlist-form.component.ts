import { Component, Output, EventEmitter } from '@angular/core';
import { PlaylistService } from '../../services/playlist.service';
import { AlertService } from '../../services/alert.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-playlist-form',
  templateUrl: './playlist-form.component.html',
  styleUrls: ['./playlist-form.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class PlaylistFormComponent {
  newPlaylistName: string = '';

  @Output() playlistCreated = new EventEmitter<any>();

  constructor(private playlistService: PlaylistService, private alert: AlertService) {}

  createPlaylist() {
    if (!this.newPlaylistName.trim()) return;

    this.playlistService.createPlaylist({ name: this.newPlaylistName }).subscribe({
      next: (response) => {
        this.playlistCreated.emit(response);
        this.newPlaylistName = '';
      },
      error: () => { this.alert.error('Error', 'No se pudo crear la playlist.'); }
    });
  }
}
