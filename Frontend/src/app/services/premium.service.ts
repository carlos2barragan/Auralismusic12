import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PremiumService {
  private apiUrl = `${environment.apiUrl}/Api/usuarios`;

  constructor(private http: HttpClient) {}

  upgradeToPremium(userId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${userId}/premium`, {});
  }

  getUserPlan(): string | null {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      return user?.plan || 'free';
    } catch { return 'free'; }
  }

  isPremium(): boolean {
    return this.getUserPlan() === 'premium';
  }
}
