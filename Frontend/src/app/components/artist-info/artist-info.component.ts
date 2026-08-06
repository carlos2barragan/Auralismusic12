import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { CLOUDINARY } from '../../shared/constants';

@Component({
  selector: 'app-artist-info',
  templateUrl: './artist-info.component.html',
  styleUrls: ['./artist-info.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class ArtistInfoComponent {
  @Input() name: string = 'Desconocido';
  @Input() image: string | null = null;
  @Input() bio: string = 'No hay biografía disponible';

  get avatarUrl(): string {
    return this.image?.trim() ? this.image : CLOUDINARY.defaultAvatar;
  }
  
}
