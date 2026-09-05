import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { Incident } from '../models/incident.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class IncidentService {
  private apiUrl = `${environment.apiUrl}/incidents`;
  private deploymentsUrl = `${environment.apiUrl}/deployments`;
  private socket: Socket;

  constructor(private http: HttpClient) {
    const socketUrl = environment.apiUrl.replace('/api', '');
    this.socket = io(socketUrl);
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${environment.ingestKey}`,
    });
  }

  getIncidents(params: any = {}): Observable<any> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    });

    return this.http.get<any>(this.apiUrl, {
      headers: this.getHeaders(),
      params: httpParams,
    });
  }

  getDeployments(): Observable<{ status: string; data: any[] }> {
    return this.http.get<{ status: string; data: any[] }>(this.deploymentsUrl, {
      headers: this.getHeaders(),
    });
  }

  analyzeIncident(id: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${id}/analyze`,
      {},
      {
        headers: this.getHeaders(),
      },
    );
  }

  resolveIncident(id: string): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/${id}/resolve`,
      {},
      {
        headers: this.getHeaders(),
      },
    );
  }

  onNewIncident(callback: (incident: Incident) => void) {
    this.socket.on('new-incident', callback);
  }

  onNewDeployment(callback: (deployment: any) => void) {
    this.socket.on('new-deployment', callback);
  }
}
