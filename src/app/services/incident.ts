import { Injectable, effect } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { Incident } from '../models/incident.model';
import { environment } from '../../environments/environment';
import { AuthService } from './auth';

export type AnalysisStreamEvent =
  | { type: 'chunk'; section: 'rootCause' | 'solution'; text: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

@Injectable({ providedIn: 'root' })
export class IncidentService {
  private apiUrl = `${environment.apiUrl}/incidents`;
  private deploymentsUrl = `${environment.apiUrl}/deployments`;
  private socket: Socket | null = null;
  private analysisAbort: AbortController | null = null;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
  ) {
    effect(() => {
      const token = this.auth.accessToken();
      if (token) {
        this.connectSocket(token);
      } else {
        this.disconnectSocket();
      }
    });
  }

  getIncidents(params: Record<string, string | number | undefined> = {}): Observable<any> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        httpParams = httpParams.set(key, String(params[key]));
      }
    });

    return this.http.get<any>(this.apiUrl, { params: httpParams });
  }

  getDeployments(): Observable<{ status: string; data: any[] }> {
    return this.http.get<{ status: string; data: any[] }>(this.deploymentsUrl);
  }

  analyzeIncident(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/analyze`, {});
  }

  streamAnalysis(id: string): Observable<AnalysisStreamEvent> {
    this.stopAnalysis();
    const abort = new AbortController();
    this.analysisAbort = abort;

    return new Observable<AnalysisStreamEvent>((subscriber) => {
      const token = this.auth.accessToken();
      const run = async () => {
        try {
          const response = await fetch(`${this.apiUrl}/${id}/analyze/stream`, {
            method: 'GET',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            credentials: 'include',
            signal: abort.signal,
          });

          if (!response.ok || !response.body) {
            throw new Error('Unable to start AI analysis stream');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split('\n\n');
            buffer = parts.pop() || '';
            for (const part of parts) {
              const line = part
                .split('\n')
                .find((entry) => entry.startsWith('data: '));
              if (!line) continue;
              const event = JSON.parse(line.slice(6)) as AnalysisStreamEvent;
              subscriber.next(event);
              if (event.type === 'done' || event.type === 'error') {
                subscriber.complete();
                return;
              }
            }
          }

          subscriber.complete();
        } catch (error) {
          if (abort.signal.aborted) {
            subscriber.complete();
            return;
          }
          subscriber.error(error);
        }
      };

      void run();
      return () => abort.abort();
    });
  }

  stopAnalysis() {
    this.analysisAbort?.abort();
    this.analysisAbort = null;
  }

  resolveIncident(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/resolve`, {});
  }

  onNewIncident(callback: (incident: Incident) => void) {
    this.ensureSocket()?.on('new-incident', callback);
  }

  onNewDeployment(callback: (deployment: any) => void) {
    this.ensureSocket()?.on('new-deployment', callback);
  }

  private connectSocket(token: string) {
    const socketUrl = environment.apiUrl.replace('/api', '');
    if (this.socket) {
      this.socket.auth = { token };
      if (!this.socket.connected) this.socket.connect();
      return;
    }

    this.socket = io(socketUrl, {
      auth: { token },
      withCredentials: true,
    });
  }

  private disconnectSocket() {
    this.socket?.disconnect();
    this.socket = null;
  }

  private ensureSocket() {
    const token = this.auth.accessToken();
    if (token && !this.socket) this.connectSocket(token);
    return this.socket;
  }
}
