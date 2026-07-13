import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { ApiService } from './api.service';
import { AuthResponse } from '../models';
import { homeRouteForRole, isAdminRole, isCitizenRole, isStaffRole, ROLES } from './roles';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  private userSignal = signal<AuthResponse | null>(this.loadUser());

  user = this.userSignal.asReadonly();
  isLoggedIn = computed(() => !!this.userSignal()?.token);
  role = computed(() => this.userSignal()?.role ?? null);
  mustChangePassword = computed(() => !!this.userSignal()?.mustChangePassword);
  permissions = computed(() => this.userSignal()?.permissions ?? []);
  isCitizen = computed(() => isCitizenRole(this.role()));
  isStaff = computed(() => isStaffRole(this.role()));
  isAdmin = computed(() => isAdminRole(this.role()));
  fullName = computed(() => {
    const u = this.userSignal();
    if (!u) return '';
    const name = `${u.firstName || ''} ${u.lastName || ''}`.trim();
    return name || u.email;
  });

  homeRoute = computed(() => homeRouteForRole(this.role()));

  dashboardLabel = computed(() =>
    isCitizenRole(this.role()) ? 'Mon tableau de bord' : 'Administration'
  );

  centerIds = computed(() => this.userSignal()?.centerIds ?? []);
  centerNames = computed(() => this.userSignal()?.centerNames ?? []);
  hasCenterScope = computed(() => {
    const role = this.role();
    if (role === ROLES.SUPER_ADMIN) return false;
    return this.centerIds().length > 0;
  });

  hasPermission(code: string): boolean {
    if (this.role() === ROLES.SUPER_ADMIN) return true;
    return this.permissions().includes(code);
  }

  hasAnyPermission(...codes: string[]): boolean {
    return codes.some(code => this.hasPermission(code));
  }

  navigateHome() {
    if (this.mustChangePassword()) {
      this.router.navigate(['/changer-mot-de-passe']);
      return;
    }
    this.router.navigate([this.homeRoute()]);
  }

  completeRequiredPasswordChange(newPassword: string) {
    return this.api.post<AuthResponse>('/account/password/required', { newPassword }).pipe(
      tap(res => this.setSession(res.data))
    );
  }

  register(data: Record<string, string | number>) {
    return this.api.postPublic<AuthResponse>('/auth/register', data);
  }

  verifyOtp(email: string, otp: string) {
    return this.api.postPublic<AuthResponse>('/auth/verify-otp', { email, otp }).pipe(
      tap(res => {
        if (res.data.token) this.setSession(res.data);
      })
    );
  }

  resendOtp(email: string) {
    return this.api.postPublic<void>('/auth/resend-otp', { email });
  }

  cancelPendingRegistration(email: string) {
    return this.api.postPublic<void>('/auth/cancel-registration', { email });
  }

  login(identifier: string, password: string) {
    const id = identifier.trim();
    const pwd = password.trim();
    return this.api.postPublic<AuthResponse>('/auth/login', {
      identifier: id,
      email: id,
      password: pwd
    }).pipe(
      tap(res => this.setSession(res.data))
    );
  }

  forgotPassword(identifier: string) {
    return this.api.postPublic<void>('/auth/forgot-password', { identifier });
  }

  resetPassword(identifier: string, otp: string, newPassword: string) {
    return this.api.postPublic<void>('/auth/reset-password', { identifier, otp, newPassword });
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.userSignal.set(null);
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  updateSession(partial: Partial<AuthResponse>) {
    const current = this.userSignal();
    if (!current) return;
    const updated = { ...current, ...partial };
    if (partial.token) {
      localStorage.setItem('token', partial.token);
    }
    localStorage.setItem('user', JSON.stringify(updated));
    this.userSignal.set(updated);
  }

  private setSession(data: AuthResponse) {
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    localStorage.setItem('user', JSON.stringify(data));
    this.userSignal.set(data);
  }

  private loadUser(): AuthResponse | null {
    const raw = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (raw && token) {
      return JSON.parse(raw);
    }
    return null;
  }
}
