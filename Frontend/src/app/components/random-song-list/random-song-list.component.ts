import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SongService } from '../../services/song.service';
import { PlaylistService } from '../../services/playlist.service';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../services/alert.service';
import { Router } from '@angular/router';
import { buildCloudinaryUrl } from '../../shared/constants';

@Component({
  selector: 'app-random-song-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './random-song-list.component.html',
  styleUrls: ['./random-song-list.component.css']
})
export class RandomSongListComponent implements OnInit {
  @Output() songSelected = new EventEmitter<any>();

  songs: any[] = [];
  playlists: any[] = [];
  showModal = false;
  newPlaylistName = '';
  selectedPlaylistSong: any = null;
  user: any = null;

  constructor(
    private songService: SongService,
    private playlistService: PlaylistService,
    private alert: AlertService,
    private router: Router
  ) {}

  ngOnInit() {
    this.fetchSongs();
    this.fetchPlaylists();
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

  fetchSongs() {
    this.songService.getCanciones().subscribe({
      next: (data) => { this.songs = data.filter(song => song.fileUrl); },
      error: () => { this.alert.error('Error', 'No se pudieron cargar las canciones.'); }
    });
  }

  fetchPlaylists() {
    this.playlistService.getPlaylists().subscribe({
      next: (data) => { this.playlists = data || []; },
      error: () => { console.error('Error al cargar playlists'); }
    });
  }

  selectSong(song: any) {
    this.songSelected.emit(song);
  }

  addToPlaylist(song: any) {
    if (!this.user || !this.user._id) {
      this.alert.warning('Inicia sesión', 'Debes iniciar sesión para agregar canciones.');
      return;
    }
    this.selectedPlaylistSong = song;
    this.showModal = true;
  }

  confirmAddToPlaylist(playlistId: string) {
    if (!playlistId || !this.selectedPlaylistSong) return;

    this.playlistService.addSongToPlaylist(playlistId, this.selectedPlaylistSong).subscribe({
      next: () => {
        this.alert.notify('success', 'Canción agregada a la playlist');
        this.closeModal();
      },
      error: () => { this.alert.error('Error', 'No se pudo agregar la canción.'); }
    });
  }

  createNewPlaylist() {
    if (!this.newPlaylistName.trim()) {
      this.alert.warning('Nombre vacío', 'Debes escribir un nombre para la playlist.');
      return;
    }
    if (!this.user || !this.user._id) {
      this.alert.error('No autorizado', 'Debes iniciar sesión para crear una playlist.');
      return;
    }

    const newPlaylist = {
      nombre: this.newPlaylistName.trim(),
      creadoPor: this.user._id,
      canciones: [this.selectedPlaylistSong._id]
    };

    this.playlistService.createPlaylist(newPlaylist).subscribe({
      next: () => {
        this.alert.notify('success', 'Playlist creada con éxito');
        this.fetchPlaylists();
        this.closeModal();
      },
      error: () => { this.alert.error('Error', 'No se pudo crear la playlist.'); }
    });
  }

  songImageUrl(song: any): string { return buildCloudinaryUrl(song?.imagen); }

  goToArtist(song: any, e: Event): void {
    e.stopPropagation();
    const id = song.cantante?._id;
    if (id) this.router.navigate(['/artist', id]);
  }

  closeModal() {
    this.showModal = false;
    this.selectedPlaylistSong = null;
    this.newPlaylistName = '';
  }
}
