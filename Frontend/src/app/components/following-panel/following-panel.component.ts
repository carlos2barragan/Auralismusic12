import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FollowService } from '../../services/follow.service';
import { CLOUDINARY } from '../../shared/constants';

@Component({
  selector: 'app-following-panel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './following-panel.component.html',
  styleUrls: ['./following-panel.component.css'],
})
export class FollowingPanelComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  following: any[] = [];
  expanded = false;
  readonly defaultAvatar = CLOUDINARY.defaultAvatar;

  constructor(private followService: FollowService) {}

  ngOnInit(): void {
    if (!this.isLoggedIn()) return;
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user?._id) {
      this.followService.getSeguidos(user._id).pipe(takeUntil(this.destroy$)).subscribe({
        next: (data) => { this.following = data || []; },
        error: () => {}
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('user_token');
  }

  toggle(): void {
    this.expanded = !this.expanded;
  }

  getAvatar(user: any): string {
    return user?.avatar || this.defaultAvatar;
  }
}
