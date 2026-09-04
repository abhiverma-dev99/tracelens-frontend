import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // <-- Added HttpHeaders

@Injectable({ providedIn: 'root' })
export class TraceLensErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(error: any): void {
    const http = this.injector.get(HttpClient);
    
    const message = error?.message || error?.toString() || 'Unknown Error';
    const stackTrace = error?.stack || 'No stack trace available';
    
    const payload = {
      message: message,
      service: 'tracelens-frontend', 
      stackTrace: stackTrace
    };

    // Attach the API Key
    const headers = new HttpHeaders({
      'Authorization': 'Bearer 80df8997-8564-4018-b818-b5a67fe26d61'
    });

    // Pass headers in the POST request
    http.post('http://localhost:3000/api/incidents', payload, { headers }).subscribe({
      next: () => console.log('✅ [TraceLens SDK]: Incident auto-logged to backend.'),
      error: (err) => console.error('❌ [TraceLens SDK]: Failed to send incident.', err)
    });

    console.error('Caught by TraceLens Global Handler:', error);
  }
}