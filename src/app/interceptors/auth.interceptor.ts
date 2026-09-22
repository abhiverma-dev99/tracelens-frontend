import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth';

const isAuthUrl = (url: string) =>
  url.includes('/auth/refresh') ||
  url.includes('/auth/signin') ||
  url.includes('/auth/signup') ||
  url.includes('/auth/verify-otp') ||
  url.includes('/auth/resend-otp') ||
  url.includes('/auth/logout');

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.accessToken();

  let cloned = req.clone({ withCredentials: true });
  if (token && !req.url.includes('/auth/refresh')) {
    cloned = cloned.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || isAuthUrl(req.url)) {
        return throwError(() => error);
      }

      return from(auth.refresh()).pipe(
        switchMap((ok) => {
          const nextToken = auth.accessToken();
          if (!ok || !nextToken) {
            void router.navigate(['/signin']);
            return throwError(() => error);
          }

          return next(
            req.clone({
              withCredentials: true,
              setHeaders: { Authorization: `Bearer ${nextToken}` },
            }),
          );
        }),
      );
    }),
  );
};
