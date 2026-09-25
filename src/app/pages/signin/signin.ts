import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

import { refreshIcons } from '../../utils/icons';

export const DEMO_EMAIL = 'demo@tracelens.app';
export const DEMO_PASSWORD = 'TraceLens1';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signin.html',
})
export class Signin implements AfterViewInit {
  submitting = signal(false);
  errorMessage = signal('');

  form;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
  ) {
    this.form = this.fb.nonNullable.group({
      email: [DEMO_EMAIL, [Validators.required, Validators.email]],
      password: [DEMO_PASSWORD, [Validators.required]],
    });
  }

  ngAfterViewInit(): void {
    refreshIcons();
  }

  submit() {
    this.errorMessage.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Enter a valid email and password.');
      return;
    }

    this.submitting.set(true);
    const { email, password } = this.form.getRawValue();
    this.auth.signin({ email, password }).subscribe({
      next: (res) => {
        this.auth.applySession(res.data);
        void this.router.navigate(['/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        if (err.status === 403 && err.error?.code === 'OTP_REQUIRED') {
          void this.router.navigate(['/verify-otp'], { queryParams: { email } });
          return;
        }
        this.errorMessage.set(err.error?.error || 'Unable to sign in.');
      },
    });
  }
}
