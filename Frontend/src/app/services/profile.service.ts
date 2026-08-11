import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = `${environment.apiUrl}/Api/usuarios`;

  constructor(private http: HttpClient) {}

  getUserProfile(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  editProfilePhoto(userId: string, formData: FormData): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${userId}/avatar`, formData);
  }
}
