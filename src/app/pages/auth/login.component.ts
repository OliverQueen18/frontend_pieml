import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

const REMEMBER_KEY = 'pieml_remember_identifier';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = false;
  error = '';
  showPassword = false;

  form = this.fb.group({
    identifier: ['', Validators.required],
    password: ['', Validators.required],
    rememberMe: [false]
  });

  ngOnInit() {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      this.form.patchValue({ identifier: saved, rememberMe: true });
    }
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const { identifier, password, rememberMe } = this.form.value;
    const id = identifier!.trim();

    if (rememberMe) {
      localStorage.setItem(REMEMBER_KEY, id);
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }

    this.auth.login(id, password!.trim()).subscribe({
      next: () => this.auth.navigateHome(),
      error: err => {
        const body = err?.error;
        this.error = (typeof body === 'object' && body?.message)
          || (typeof body === 'string' ? body : null)
          || 'Email ou mot de passe incorrect';
        this.loading = false;
      },
      complete: () => this.loading = false
    });
  }
}
