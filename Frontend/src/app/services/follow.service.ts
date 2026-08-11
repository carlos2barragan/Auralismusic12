import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FollowService {
  private apiUrl = `${environment.apiUrl}/Api/usuarios`;

  constructor(private http: HttpClient) {}

  follow(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${userId}/follow`, {});
  }

  unfollow(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${userId}/follow`);
  }

  getFollowers(userId: string): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/${userId}/followers`);
  }

  isFollowing(userId: string): Observable<{ following: boolean }> {
    return this.http.get<{ following: boolean }>(`${this.apiUrl}/${userId}/is-following`);
  }

  getSeguidos(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${userId}/seguidos`);
  }
}
