import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ad-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ad-modal.component.html',
  styleUrls: ['./ad-modal.component.css'],
})
export class AdModalComponent implements OnChanges {
  @Input() titulo = '';
  @Input() descripcion = '';
  @Input() imagen = '';
  @Input() enlace = '';

  @Output() closed = new EventEmitter<void>();
  @Output() upgrade = new EventEmitter<void>();

  show = false;
  countdown = 5;
  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['titulo'] && this.titulo) {
      this.show = true;
      this.countdown = 5;
      this.startCountdown();
    }
  }

  private startCountdown(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) this.closeAd();
    }, 1000);
  }

  closeAd(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.show = false;
    this.closed.emit();
  }

  onUpgrade(): void {
    this.closeAd();
    this.upgrade.emit();
  }

  openLink(): void {
    if (this.enlace) window.open(this.enlace, '_blank');
    this.closeAd();
  }
}
