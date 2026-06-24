import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AccountService } from '../../core/account.service';

function passwordMatch(group: AbstractControl): ValidationErrors | null {
  const newPassword = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return newPassword === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './security.component.html',
  styleUrl: './security.component.scss'
})
export class SecurityComponent {
  private fb = inject(FormBuilder);
  private account = inject(AccountService);

  saving = false;
  error = '';
  success = '';
  showCurrent = false;
  showNew = false;
  showConfirm = false;

  form = this.fb.group({
    currentPassword: ['', Validators.required],
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
    this.success = '';

    const { currentPassword, newPassword } = this.form.value;
    this.account.changePassword(currentPassword!, newPassword!).subscribe({
      next: res => {
        this.success = res.message || 'Mot de passe modifié avec succès.';
        this.form.reset();
        this.saving = false;
      },
      error: err => {
        this.error = err.error?.message || 'Erreur lors du changement de mot de passe';
        this.saving = false;
      }
    });
  }
}
