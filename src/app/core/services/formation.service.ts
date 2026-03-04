import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/environment';
import { Formation } from '../models/formation.model';

@Injectable({
  providedIn: 'root'
})
export class FormationService {
  private apiUrl = `${environment.shopApiUrl}/formation`;

  constructor(private http: HttpClient) {}

  listFormations(): Observable<Formation[]> {
    return this.http.get<Formation[]>(`${this.apiUrl}/listFormations`);
  }

  getFormation(id: number): Observable<Formation> {
    return this.http.get<Formation>(`${this.apiUrl}/getFormation/${id}`);
  }

  addFormation(formation: Formation): Observable<Formation> {
    return this.http.post<Formation>(`${this.apiUrl}/addFormation`, formation);
  }
}
