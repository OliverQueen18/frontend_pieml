import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';

function passwordMatch(group: AbstractControl): ValidationErrors | null {
  const newPassword = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return newPassword === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-force-password-change',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './force-password-change.component.html',
  styleUrl: './force-password-change.component.scss'
})
export class ForcePasswordChangeComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  saving = false;
  error = '';
  showNew = false;
  showConfirm = false;

  form = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  }, { validators: passwordMatch });

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = '';
    const { newPassword } = this.form.value;

    this.auth.completeRequiredPasswordChange(newPassword!).subscribe({
      next: () => this.auth.navigateHome(),
      error: err => {
        this.error = err.error?.message || 'Impossible de définir le mot de passe';
        this.saving = false;
      },
      complete: () => this.saving = false
    });
  }
}
