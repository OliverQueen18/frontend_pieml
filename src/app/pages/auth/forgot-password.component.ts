import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { PiemlLogoComponent } from '../../shared/pieml-logo.component';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('newPassword')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PiemlLogoComponent],
  template: `
    <div class="auth-page">
      <div class="auth-card card">
        <a routerLink="/" class="auth-logo">
          <app-pieml-logo [height]="120" />
        </a>
        <a routerLink="/connexion" class="back">← Retour à la connexion</a>
        <h1>Mot de passe oublié</h1>
        <p class="subtitle">
          @if (step === 1) {
            Saisissez votre email ou téléphone pour recevoir un code de réinitialisation.
          } @else {
            Entrez le code reçu par email et choisissez un nouveau mot de passe.
          }
        </p>

        @if (error) { <div class="alert alert-error">{{ error }}</div> }
        @if (success) { <div class="alert alert-success">{{ success }}</div> }

        @if (step === 1) {
          <form [formGroup]="requestForm" (ngSubmit)="requestCode()">
            <div class="form-group">
              <label>Email ou téléphone</label>
              <input type="text" formControlName="identifier" placeholder="email@exemple.ml ou +22370123456" autocomplete="username">
            </div>
            <button type="submit" class="btn btn-primary btn-block" [disabled]="loading || requestForm.invalid">
              {{ loading ? 'Envoi...' : 'Envoyer le code' }}
            </button>
          </form>
        } @else {
          <div class="alert alert-info">Mode développement : utilisez le code <strong>123456</strong> si l'email n'est pas configuré.</div>
          <form [formGroup]="resetForm" (ngSubmit)="resetPassword()">
            <div class="form-group">
              <label>Code OTP</label>
              <input formControlName="otp" placeholder="123456" maxlength="6" autocomplete="one-time-code">
            </div>
            <div class="form-group">
              <label>Nouveau mot de passe</label>
              <input type="password" formControlName="newPassword" placeholder="Min. 8 caractères" autocomplete="new-password">
            </div>
            <div class="form-group">
              <label>Confirmer le mot de passe</label>
              <input type="password" formControlName="confirmPassword" placeholder="••••••••" autocomplete="new-password">
            </div>
            @if (resetForm.hasError('passwordMismatch') && resetForm.get('confirmPassword')?.touched) {
              <div class="alert alert-error">Les mots de passe ne correspondent pas.</div>
            }
            <button type="submit" class="btn btn-primary btn-block" [disabled]="loading || resetForm.invalid">
              {{ loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe' }}
            </button>
          </form>
        }

        @if (step === 2) {
          <p class="footer-link">
            <a href="#" (click)="backToRequest($event)">Renvoyer un code</a>
          </p>
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1e3a5f, #152a45); padding: 2rem; }
    .auth-card { width: 100%; max-width: 420px; }
    .auth-logo { display: flex; justify-content: center; margin-bottom: 0.75rem; }
    .back { color: var(--pie-muted); font-size: 0.9rem; }
    h1 { margin: 1rem 0 0.25rem; color: var(--pie-primary); }
    .subtitle { color: var(--pie-muted); margin-bottom: 1.5rem; line-height: 1.5; }
    .btn-block { width: 100%; margin-top: 0.5rem; }
    .footer-link { text-align: center; margin-top: 1.5rem; font-size: 0.9rem; a { color: var(--pie-accent); font-weight: 600; } }
    .alert-success { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.9rem; }
    .alert-info { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.85rem; }
  `]
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  step = 1;
  loading = false;
  error = '';
  success = '';
  identifier = '';

  requestForm = this.fb.group({
    identifier: ['', Validators.required]
  });

  resetForm = this.fb.group({
    otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  }, { validators: passwordsMatch });

  requestCode() {
    if (this.requestForm.invalid) return;
    this.loading = true;
    this.error = '';
    this.success = '';
    this.identifier = this.requestForm.value.identifier!.trim();

    this.auth.forgotPassword(this.identifier).subscribe({
      next: res => {
        this.success = res.message || 'Un code a été envoyé à votre adresse email.';
        this.step = 2;
        this.loading = false;
      },
      error: err => {
        this.error = err.error?.message || 'Erreur lors de l\'envoi du code';
        this.loading = false;
      }
    });
  }

  resetPassword() {
    if (this.resetForm.invalid) return;
    this.loading = true;
    this.error = '';
    this.success = '';
    const { otp, newPassword } = this.resetForm.value;

    this.auth.resetPassword(this.identifier, otp!, newPassword!).subscribe({
      next: res => {
        this.success = res.message || 'Mot de passe réinitialisé.';
        setTimeout(() => this.router.navigate(['/connexion']), 1500);
        this.loading = false;
      },
      error: err => {
        this.error = err.error?.message || 'Code invalide ou expiré';
        this.loading = false;
      }
    });
  }

  backToRequest(event: Event) {
    event.preventDefault();
    this.step = 1;
    this.error = '';
    this.success = '';
    this.resetForm.reset();
  }
}
