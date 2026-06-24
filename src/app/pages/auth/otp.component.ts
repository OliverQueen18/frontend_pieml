import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { PiemlLogoComponent } from '../../shared/pieml-logo.component';

const OTP_EXPIRATION_MINUTES = 10;
const OTP_SENT_AT_KEY = 'pendingOtpSentAt';
const PENDING_EMAIL_KEY = 'pendingEmail';

@Component({
  selector: 'app-otp',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PiemlLogoComponent],
  template: `
    <div class="auth-page">
      <div class="auth-card card">
        <a routerLink="/" class="auth-logo">
          <app-pieml-logo [height]="120" />
        </a>
        <h1>Vérification OTP</h1>
        <p class="subtitle">Entrez le code reçu par email</p>
        <p class="otp-hint">Un code à 6 chiffres a été envoyé à votre adresse email. Pensez à vérifier vos spams.</p>

        @if (error) { <div class="alert alert-error">{{ error }}</div> }
        @if (info) { <div class="alert alert-info">{{ info }}</div> }
        @if (resendSuccess) { <div class="alert alert-success">{{ resendSuccess }}</div> }

        @if (registrationCancelled) {
          <div class="alert alert-warning">
            Votre inscription a été annulée car le code OTP n'a pas été validé à temps.
          </div>
          <a routerLink="/inscription" class="btn btn-primary btn-block">Recommencer l'inscription</a>
        } @else {
          @if (expired) {
            <div class="alert alert-warning">
              Votre code a expiré. L'inscription sera annulée si vous ne validez pas le code.
            </div>
          } @else if (remainingSeconds > 0) {
            <p class="otp-timer">
              Code valide pendant <strong>{{ formattedRemaining }}</strong>
            </p>
          }

          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="form-group">
              <label>Email</label>
              <input type="email" formControlName="email" readonly>
            </div>
            <div class="form-group">
              <label>Code OTP</label>
              <input formControlName="otp" placeholder="123456" maxlength="6" inputmode="numeric">
            </div>
            <button type="submit" class="btn btn-primary btn-block" [disabled]="loading || form.invalid || cancelling">
              {{ loading ? 'Vérification...' : 'Vérifier' }}
            </button>
          </form>

          <button
            type="button"
            class="btn btn-outline btn-block resend-btn"
            (click)="resend()"
            [disabled]="resending || !expired || cancelling">
            {{ resending ? 'Envoi en cours...' : 'Renvoyer le code' }}
          </button>

          <button
            type="button"
            class="btn btn-outline btn-block cancel-btn"
            (click)="cancelRegistration()"
            [disabled]="cancelling || loading">
            {{ cancelling ? 'Annulation…' : 'Annuler l\'inscription' }}
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1e3a5f, #152a45); padding: 2rem; }
    .auth-card { width: 100%; max-width: 420px; }
    .auth-logo { display: flex; justify-content: center; margin-bottom: 0.75rem; }
    h1 { color: var(--pie-primary); margin-bottom: 0.25rem; }
    .subtitle { color: var(--pie-muted); margin-bottom: 0.75rem; }
    .otp-hint {
      font-size: 0.85rem;
      color: var(--pie-muted);
      margin-bottom: 1.25rem;
      line-height: 1.45;
    }
    .btn-block { width: 100%; }
    .otp-timer {
      font-size: 0.88rem;
      color: var(--pie-muted);
      margin-bottom: 1rem;
      text-align: center;
    }
    .otp-timer strong { color: var(--pie-primary); }
    .resend-btn { margin-top: 0.75rem; }
    .cancel-btn {
      margin-top: 0.5rem;
      color: #b91c1c;
      border-color: #fecaca;
    }
    .alert-success {
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
    }
    .alert-warning {
      background: #fffbeb;
      color: #b45309;
      border: 1px solid #fcd34d;
    }
    .alert-info {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }
  `]
})
export class OtpComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = false;
  resending = false;
  cancelling = false;
  error = '';
  info = '';
  resendSuccess = '';
  expired = false;
  registrationCancelled = false;
  remainingSeconds = 0;

  private timerId?: ReturnType<typeof setInterval>;
  private sentAt = 0;
  private verified = false;
  private cancellationHandled = false;
  private expiryCancellationStarted = false;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    otp: ['', [Validators.required, Validators.minLength(6)]]
  });

  get formattedRemaining(): string {
    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  ngOnInit() {
    const email = sessionStorage.getItem(PENDING_EMAIL_KEY) || '';
    if (!email) {
      this.router.navigate(['/inscription']);
      return;
    }
    this.form.patchValue({ email });

    const storedSentAt = sessionStorage.getItem(OTP_SENT_AT_KEY);
    this.sentAt = storedSentAt ? Number(storedSentAt) : Date.now();
    if (!storedSentAt) {
      sessionStorage.setItem(OTP_SENT_AT_KEY, String(this.sentAt));
    }

    this.updateRemaining();
    this.timerId = setInterval(() => this.updateRemaining(), 1000);
  }

  ngOnDestroy() {
    if (this.timerId) clearInterval(this.timerId);
    if (!this.verified && !this.cancellationHandled) {
      this.abandonRegistration(false);
    }
  }

  submit() {
    if (this.form.invalid || this.registrationCancelled) return;
    this.loading = true;
    this.error = '';
    this.resendSuccess = '';
    this.info = '';
    const { email, otp } = this.form.value;
    this.auth.verifyOtp(email!, otp!).subscribe({
      next: () => {
        this.verified = true;
        this.clearPendingSession();
        this.auth.navigateHome();
      },
      error: err => {
        const message = err.error?.message || 'Code OTP invalide';
        this.error = message;
        if (message.toLowerCase().includes('expir')) {
          this.expired = true;
          this.remainingSeconds = 0;
        }
        this.loading = false;
      },
      complete: () => this.loading = false
    });
  }

  resend() {
    const email = this.form.value.email;
    if (!email || this.resending || this.registrationCancelled) return;

    this.resending = true;
    this.error = '';
    this.resendSuccess = '';
    this.info = '';

    this.auth.resendOtp(email).subscribe({
      next: res => {
        this.sentAt = Date.now();
        sessionStorage.setItem(OTP_SENT_AT_KEY, String(this.sentAt));
        this.expired = false;
        this.expiryCancellationStarted = false;
        this.form.patchValue({ otp: '' });
        this.updateRemaining();
        this.resendSuccess = res.message || 'Un nouveau code a été envoyé par email.';
        this.resending = false;
      },
      error: err => {
        this.error = err.error?.message || 'Impossible de renvoyer le code';
        this.resending = false;
      }
    });
  }

  cancelRegistration() {
    if (this.cancellationHandled || this.registrationCancelled) return;
    if (!confirm('Annuler votre inscription ?\nVotre compte non vérifié sera supprimé.')) return;

    this.cancelling = true;
    this.error = '';
    this.abandonRegistration(true, () => {
      this.cancelling = false;
      this.router.navigate(['/inscription']);
    });
  }

  private updateRemaining() {
    const elapsedSeconds = Math.floor((Date.now() - this.sentAt) / 1000);
    const totalSeconds = OTP_EXPIRATION_MINUTES * 60;
    const remaining = totalSeconds - elapsedSeconds;

    if (remaining <= 0) {
      this.remainingSeconds = 0;
      this.expired = true;
      if (!this.expiryCancellationStarted && !this.verified && !this.cancellationHandled) {
        this.expiryCancellationStarted = true;
        this.abandonRegistration(true);
      }
      return;
    }

    this.remainingSeconds = remaining;
    this.expired = false;
  }

  private abandonRegistration(showCancelledState: boolean, onDone?: () => void) {
    if (this.cancellationHandled || this.verified) {
      onDone?.();
      return;
    }

    const email = this.form.value.email?.trim();
    if (!email) {
      this.clearPendingSession();
      onDone?.();
      return;
    }

    this.cancellationHandled = true;
    this.auth.cancelPendingRegistration(email).subscribe({
      next: () => {
        this.clearPendingSession();
        if (showCancelledState) {
          this.registrationCancelled = true;
          this.info = 'Inscription annulée. Vous pouvez recommencer une nouvelle inscription.';
        }
        onDone?.();
      },
      error: () => {
        this.clearPendingSession();
        onDone?.();
      }
    });
  }

  private clearPendingSession() {
    sessionStorage.removeItem(PENDING_EMAIL_KEY);
    sessionStorage.removeItem(OTP_SENT_AT_KEY);
  }
}
