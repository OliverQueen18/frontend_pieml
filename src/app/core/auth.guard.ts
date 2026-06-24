import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { homeRouteForRole, isAdminRole, isCitizenRole, isStaffRole } from './roles';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) {
    return true;
  }
  router.navigate(['/connexion']);
  return false;
};

/** Bloque l'accès aux espaces protégés tant que le mot de passe temporaire n'a pas été remplacé. */
export const passwordOkGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    router.navigate(['/connexion']);
    return false;
  }
  if (auth.mustChangePassword()) {
    router.navigate(['/changer-mot-de-passe']);
    return false;
  }
  return true;
};

/** Accès réservé aux utilisateurs devant changer leur mot de passe. */
export const mustChangePasswordGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    router.navigate(['/connexion']);
    return false;
  }
  if (auth.mustChangePassword()) {
    return true;
  }
  router.navigate([homeRouteForRole(auth.role())]);
  return false;
};

export const citizenGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    router.navigate(['/connexion']);
    return false;
  }
  if (auth.mustChangePassword()) {
    router.navigate(['/changer-mot-de-passe']);
    return false;
  }
  if (isCitizenRole(auth.role())) {
    return true;
  }
  router.navigate(['/administration']);
  return false;
};

export const staffGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    router.navigate(['/connexion']);
    return false;
  }
  if (auth.mustChangePassword()) {
    router.navigate(['/changer-mot-de-passe']);
    return false;
  }
  if (isStaffRole(auth.role())) {
    return true;
  }
  router.navigate(['/tableau-de-bord']);
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    router.navigate(['/connexion']);
    return false;
  }
  if (isAdminRole(auth.role())) {
    return true;
  }
  router.navigate(['/administration']);
  return false;
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    return true;
  }
  if (auth.mustChangePassword()) {
    router.navigate(['/changer-mot-de-passe']);
    return false;
  }
  router.navigate([homeRouteForRole(auth.role())]);
  return false;
};

/** Vérifie qu'au moins une permission est accordée. */
export function permissionGuard(...codes: string[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isLoggedIn()) {
      router.navigate(['/connexion']);
      return false;
    }
    if (auth.mustChangePassword()) {
      router.navigate(['/changer-mot-de-passe']);
      return false;
    }
    if (auth.hasAnyPermission(...codes)) {
      return true;
    }
    router.navigate(['/administration']);
    return false;
  };
}
