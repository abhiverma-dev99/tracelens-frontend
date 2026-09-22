import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthProject, AuthSession, AuthUser } from '../models/auth.model';

interface ApiEnvelope<T> {
  status: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  readonly currentUser = signal<AuthUser | null>(null);
  readonly currentProject = signal<AuthProject | null>(null);
  readonly accessToken = signal<string | null>(null);
  readonly isAuthenticated = computed(() => Boolean(this.accessToken()));
  readonly ready = signal(false);

  private refreshInFlight: Promise<boolean> | null = null;
  private readyPromise: Promise<void>;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    this.readyPromise = this.restoreSession();
  }

  ensureReady() {
    return this.readyPromise;
  }

  signup(payload: { name: string; email: string; password: string }) {
    return this.http.post<ApiEnvelope<{ message: string; email: string }>>(
      `${this.apiUrl}/signup`,
      payload,
      { withCredentials: true },
    );
  }

  verifyOtp(payload: { email: string; otp: string }) {
    return this.http.post<ApiEnvelope<AuthSession>>(`${this.apiUrl}/verify-otp`, payload, {
      withCredentials: true,
    });
  }

  resendOtp(email: string) {
    return this.http.post<ApiEnvelope<{ message: string }>>(
      `${this.apiUrl}/resend-otp`,
      { email },
      { withCredentials: true },
    );
  }

  signin(payload: { email: string; password: string }) {
    return this.http.post<ApiEnvelope<AuthSession>>(`${this.apiUrl}/signin`, payload, {
      withCredentials: true,
    });
  }

  applySession(session: AuthSession) {
    this.accessToken.set(session.accessToken);
    this.currentUser.set(session.user);
    this.currentProject.set(session.project);
  }

  clearSession() {
    this.accessToken.set(null);
    this.currentUser.set(null);
    this.currentProject.set(null);
  }

  async refresh(): Promise<boolean> {
    if (this.refreshInFlight) return this.refreshInFlight;

    this.refreshInFlight = firstValueFrom(
      this.http.post<ApiEnvelope<AuthSession>>(
        `${this.apiUrl}/refresh`,
        {},
        { withCredentials: true },
      ),
    )
      .then((res) => {
        this.applySession(res.data);
        return true;
      })
      .catch(() => {
        this.clearSession();
        return false;
      })
      .finally(() => {
        this.refreshInFlight = null;
      });

    return this.refreshInFlight;
  }

  async logout() {
    try {
      await firstValueFrom(
        this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }),
      );
    } catch {
      // Continue local logout even if the API call fails.
    }
    this.clearSession();
    await this.router.navigate(['/signin']);
  }

  private async restoreSession() {
    await this.refresh();
    this.ready.set(true);
  }
}
