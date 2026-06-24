export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  VALIDATEUR: 'VALIDATEUR',
  IMMATRICULATEUR: 'IMMATRICULATEUR',
  CITOYEN: 'CITOYEN'
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super administrateur',
  ADMIN: 'Administrateur',
  VALIDATEUR: 'Validateur',
  IMMATRICULATEUR: 'Immatriculateur',
  CITOYEN: 'Citoyen'
};

export const STAFF_ROLES: Role[] = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.VALIDATEUR,
  ROLES.IMMATRICULATEUR
];

export const ADMIN_ROLES: Role[] = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

export function isCitizenRole(role?: string | null): boolean {
  return role === ROLES.CITOYEN;
}

export function isStaffRole(role?: string | null): boolean {
  return !!role && STAFF_ROLES.includes(role as Role);
}

export function isAdminRole(role?: string | null): boolean {
  return !!role && ADMIN_ROLES.includes(role as Role);
}

export function homeRouteForRole(role?: string | null): string {
  return isCitizenRole(role) ? '/tableau-de-bord' : '/administration';
}
