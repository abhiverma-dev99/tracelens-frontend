import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, QueryList, ViewChildren, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './verify-otp.html',
})
export class VerifyOtp implements AfterViewInit {
  email = '';
  digits = ['', '', '', '', '', ''];
  submitting = signal(false);
  resending = signal(false);
  errorMessage = signal('');
  infoMessage = signal(
    "We've sent a verification code to your email. If SMTP is not set up locally, the code is printed in the API server terminal.",
  );
  cooldown = signal(0);
  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
  ) {
    this.email = this.route.snapshot.queryParamMap.get('email') || '';
    if (!this.email) {
      void this.router.navigate(['/signup']);
    }
    this.startCooldown(60);
  }

  ngAfterViewInit(): void {
    this.otpInputs.first?.nativeElement.focus();
  }

  onInput(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '').slice(-1);
    this.digits[index] = value;
    input.value = value;
    if (value && index < 5) {
      this.otpInputs.get(index + 1)?.nativeElement.focus();
    }
  }

  onKeydown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace' && !this.digits[index] && index > 0) {
      this.otpInputs.get(index - 1)?.nativeElement.focus();
    }
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasted = (event.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    pasted.split('').forEach((digit, i) => {
      this.digits[i] = digit;
      const el = this.otpInputs.get(i)?.nativeElement;
      if (el) el.value = digit;
    });
    this.otpInputs.get(Math.min(pasted.length, 5))?.nativeElement.focus();
  }

  verify() {
    this.errorMessage.set('');
    const otp = this.digits.join('');
    if (otp.length !== 6) {
      this.errorMessage.set('Enter the 6-digit verification code.');
      return;
    }

    this.submitting.set(true);
    this.auth.verifyOtp({ email: this.email, otp }).subscribe({
      next: (res) => {
        this.auth.applySession(res.data);
        void this.router.navigate(['/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.error || 'Unable to verify code.');
      },
    });
  }

  resend() {
    if (this.cooldown() > 0 || this.resending()) return;
    this.resending.set(true);
    this.auth.resendOtp(this.email).subscribe({
      next: () => {
        this.resending.set(false);
        this.infoMessage.set(
          res.data?.message || 'A new verification code was sent. Check email or the API terminal.',
        );
        this.startCooldown(60);
      },
      error: (err: HttpErrorResponse) => {
        this.resending.set(false);
        this.errorMessage.set(err.error?.error || 'Unable to resend code.');
        if (err.status === 429) this.startCooldown(60);
      },
    });
  }

  private startCooldown(seconds: number) {
    this.cooldown.set(seconds);
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.cooldownTimer = setInterval(() => {
      const next = this.cooldown() - 1;
      this.cooldown.set(next);
      if (next <= 0 && this.cooldownTimer) {
        clearInterval(this.cooldownTimer);
        this.cooldownTimer = null;
      }
    }, 1000);
  }
}
