export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  AUDIT: 'AUDIT',
  VALIDATEUR: 'VALIDATEUR',
  IMMATRICULATEUR: 'IMMATRICULATEUR',
  UTILISATEUR: 'UTILISATEUR',
  PUBLIC: 'PUBLIC',
  CITOYEN: 'CITOYEN'
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super administrateur',
  ADMIN: 'Gestionnaire de Centre',
  AUDIT: 'Auditeur',
  VALIDATEUR: 'Validateur',
  IMMATRICULATEUR: 'Immatriculateur',
  UTILISATEUR: 'Utilisateur',
  PUBLIC: 'Public',
  CITOYEN: 'Citoyen'
};

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  SUPER_ADMIN: 'Accès complet à la plateforme et à la configuration système.',
  ADMIN: 'Gère un centre et peut créer des comptes Public, validateurs et immatriculateurs.',
  AUDIT: 'Consultation des dossiers, citoyens, paiements et notifications des centres associés (lecture seule).',
  VALIDATEUR: 'Validation et rejet des dossiers d\'immatriculation.',
  IMMATRICULATEUR: 'Traitement des rendez-vous et immatriculations sur site.',
  UTILISATEUR: 'Consultation opérationnelle : dossiers, citoyens et notifications.',
  PUBLIC: 'Visualisation des statistiques uniquement.',
  CITOYEN: 'Dépôt et suivi des demandes d\'immatriculation.'
};

export const STAFF_ROLES: Role[] = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.AUDIT,
  ROLES.VALIDATEUR,
  ROLES.IMMATRICULATEUR,
  ROLES.UTILISATEUR,
  ROLES.PUBLIC
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

/** Rôles qu'un gestionnaire de centre peut créer. */
export const CENTER_MANAGER_CREATABLE_ROLES: Role[] = [
  ROLES.PUBLIC,
  ROLES.VALIDATEUR,
  ROLES.IMMATRICULATEUR,
  ROLES.UTILISATEUR
];

export function creatableStaffRoles(actorRole?: string | null): Role[] {
  if (actorRole === ROLES.SUPER_ADMIN) {
    return STAFF_ROLES;
  }
  if (actorRole === ROLES.ADMIN) {
    return CENTER_MANAGER_CREATABLE_ROLES;
  }
  return [];
}
