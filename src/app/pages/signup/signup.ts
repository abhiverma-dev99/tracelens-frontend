import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

import { refreshIcons } from '../../utils/icons';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.html',
})
export class Signup implements AfterViewInit {
  submitting = signal(false);
  errorMessage = signal('');

  form;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
  ) {
    this.form = this.fb.nonNullable.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    });
  }

  ngAfterViewInit(): void {
    refreshIcons();
  }

  submit() {
    this.errorMessage.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Please complete all fields correctly.');
      return;
    }

    const { name, email, password, confirmPassword } = this.form.getRawValue();
    if (password !== confirmPassword) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    this.submitting.set(true);
    this.auth.signup({ name, email, password }).subscribe({
      next: () => {
        void this.router.navigate(['/verify-otp'], { queryParams: { email } });
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        if (err.status === 409 || err.error?.code === 'OTP_REQUIRED') {
          void this.router.navigate(['/verify-otp'], { queryParams: { email } });
          return;
        }
        this.errorMessage.set(err.error?.error || 'Unable to create account.');
      },
    });
  }
}
