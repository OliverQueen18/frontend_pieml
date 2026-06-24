export const PERMISSIONS = {
  ADMIN_DASHBOARD_VIEW: 'ADMIN_DASHBOARD_VIEW',
  DOSSIERS_VIEW: 'DOSSIERS_VIEW',
  DOSSIERS_VALIDATE: 'DOSSIERS_VALIDATE',
  DOSSIERS_REJECT: 'DOSSIERS_REJECT',
  CITIZENS_VIEW: 'CITIZENS_VIEW',
  CITIZENS_MANAGE: 'CITIZENS_MANAGE',
  USERS_VIEW: 'USERS_VIEW',
  USERS_MANAGE: 'USERS_MANAGE',
  CENTERS_VIEW: 'CENTERS_VIEW',
  CENTERS_MANAGE: 'CENTERS_MANAGE',
  TYPE_DOCUMENTS_VIEW: 'TYPE_DOCUMENTS_VIEW',
  TYPE_DOCUMENTS_MANAGE: 'TYPE_DOCUMENTS_MANAGE',
  VEHICLE_BRANDS_VIEW: 'VEHICLE_BRANDS_VIEW',
  VEHICLE_BRANDS_MANAGE: 'VEHICLE_BRANDS_MANAGE',
  VEHICLE_TYPES_VIEW: 'VEHICLE_TYPES_VIEW',
  VEHICLE_TYPES_MANAGE: 'VEHICLE_TYPES_MANAGE',
  ROLES_VIEW: 'ROLES_VIEW',
  ROLES_MANAGE: 'ROLES_MANAGE',
  NOTIFICATIONS_VIEW: 'NOTIFICATIONS_VIEW',
  NOTIFICATIONS_MANAGE: 'NOTIFICATIONS_MANAGE',
  PAYMENTS_VIEW: 'PAYMENTS_VIEW',
  PAYMENTS_MANAGE: 'PAYMENTS_MANAGE',
  TARIFFS_VIEW: 'TARIFFS_VIEW',
  TARIFFS_MANAGE: 'TARIFFS_MANAGE',
  APPOINTMENTS_MANAGE: 'APPOINTMENTS_MANAGE',
  IMMATRICULATION_PROCESS: 'IMMATRICULATION_PROCESS'
} as const;

export type PermissionCode = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export interface PermissionDto {
  code: string;
  label: string;
  category: string;
}

export const PERMISSION_CATEGORY_ORDER = [
  'Administration',
  'Dossiers',
  'Utilisateurs',
  'Configuration',
  'Immatriculation'
];

export function groupPermissionsByCategory(permissions: PermissionDto[]): { category: string; items: PermissionDto[] }[] {
  const map = new Map<string, PermissionDto[]>();
  for (const p of permissions) {
    const list = map.get(p.category) || [];
    list.push(p);
    map.set(p.category, list);
  }
  return PERMISSION_CATEGORY_ORDER
    .filter(cat => map.has(cat))
    .map(category => ({ category, items: map.get(category)! }));
}
