import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class TraceLensErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(error: any): void {
    console.error('Caught by TraceLens Global Handler:', error);

    const auth = this.injector.get(AuthService);
    const ingestKey = auth.currentProject()?.ingestKey;
    if (!ingestKey) return;

    const http = this.injector.get(HttpClient);
    const payload = {
      message: error?.message || error?.toString() || 'Unknown Error',
      service: 'tracelens-frontend',
      stackTrace: error?.stack || 'No stack trace available',
    };

    const headers = new HttpHeaders({
      Authorization: `Bearer ${ingestKey}`,
      'X-TraceLens-API-Key': ingestKey,
    });

    http.post(`${environment.apiUrl}/incidents`, payload, { headers }).subscribe({
      next: () => undefined,
      error: () => undefined,
    });
  }
}
