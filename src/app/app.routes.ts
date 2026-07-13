import { Routes } from '@angular/router';

import { authGuard, adminGuard, citizenGuard, guestGuard, mustChangePasswordGuard, passwordOkGuard, permissionGuard, staffGuard } from './core/auth.guard';
import { PERMISSIONS } from './core/permissions';



export const routes: Routes = [

  { path: '', loadComponent: () => import('./pages/landing/landing.component').then(m => m.LandingComponent) },

  { path: 'connexion', loadComponent: () => import('./pages/auth/login.component').then(m => m.LoginComponent), canActivate: [guestGuard] },

  { path: 'mot-de-passe-oublie', loadComponent: () => import('./pages/auth/forgot-password.component').then(m => m.ForgotPasswordComponent), canActivate: [guestGuard] },

  { path: 'inscription', loadComponent: () => import('./pages/auth/register.component').then(m => m.RegisterComponent), canActivate: [guestGuard] },

  { path: 'verification-otp', loadComponent: () => import('./pages/auth/otp.component').then(m => m.OtpComponent), canActivate: [guestGuard] },

  { path: 'changer-mot-de-passe', loadComponent: () => import('./pages/auth/force-password-change.component').then(m => m.ForcePasswordChangeComponent), canActivate: [authGuard, mustChangePasswordGuard] },

  { path: 'suivre-dossier', loadComponent: () => import('./pages/track/track.component').then(m => m.TrackComponent) },

  {

    path: 'tableau-de-bord',

    canActivate: [authGuard, passwordOkGuard, citizenGuard],

    loadComponent: () => import('./layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),

    children: [

      { path: '', loadComponent: () => import('./pages/dashboard/home.component').then(m => m.DashboardHomeComponent) },

      { path: 'nouvelle-demande/:dossierId', loadComponent: () => import('./pages/dossier/wizard.component').then(m => m.DossierWizardComponent) },
      { path: 'nouvelle-demande', loadComponent: () => import('./pages/dossier/wizard.component').then(m => m.DossierWizardComponent) },

      { path: 'dossier/:id', loadComponent: () => import('./pages/dossier/detail.component').then(m => m.DossierDetailComponent) },

      { path: 'profil', loadComponent: () => import('./pages/account/profile.component').then(m => m.ProfileComponent) },

      { path: 'securite', loadComponent: () => import('./pages/account/security.component').then(m => m.SecurityComponent) },

      { path: 'faq', loadComponent: () => import('./pages/account/faq.component').then(m => m.FaqComponent) },

      { path: 'contact', loadComponent: () => import('./pages/account/contact.component').then(m => m.ContactComponent) }

    ]

  },

  {

    path: 'administration',

    canActivate: [authGuard, passwordOkGuard, staffGuard],

    loadComponent: () => import('./layout/admin-layout.component').then(m => m.AdminLayoutComponent),

    children: [

      { path: '', loadComponent: () => import('./pages/admin/home.component').then(m => m.AdminHomeComponent) },

      { path: 'dossiers', canActivate: [permissionGuard(PERMISSIONS.DOSSIERS_VIEW)], loadComponent: () => import('./pages/admin/dossiers.component').then(m => m.AdminDossiersComponent) },

      { path: 'dossiers/:id', canActivate: [permissionGuard(PERMISSIONS.DOSSIERS_VIEW)], loadComponent: () => import('./pages/admin/dossier-detail.component').then(m => m.AdminDossierDetailComponent) },

      { path: 'citoyens', canActivate: [permissionGuard(PERMISSIONS.CITIZENS_VIEW)], loadComponent: () => import('./pages/admin/citizens.component').then(m => m.AdminCitizensComponent) },

      { path: 'reclamations-profil', canActivate: [permissionGuard(PERMISSIONS.CITIZENS_VIEW)], loadComponent: () => import('./pages/admin/profile-change-requests.component').then(m => m.AdminProfileChangeRequestsComponent) },

      { path: 'utilisateurs', canActivate: [permissionGuard(PERMISSIONS.USERS_VIEW)], loadComponent: () => import('./pages/admin/users.component').then(m => m.AdminUsersComponent) },

      { path: 'centres', canActivate: [permissionGuard(PERMISSIONS.CENTERS_VIEW)], loadComponent: () => import('./pages/admin/centers.component').then(m => m.AdminCentersComponent) },

      { path: 'types-documents', canActivate: [permissionGuard(PERMISSIONS.TYPE_DOCUMENTS_VIEW)], loadComponent: () => import('./pages/admin/type-documents.component').then(m => m.AdminTypeDocumentsComponent) },

      { path: 'marques', canActivate: [permissionGuard(PERMISSIONS.VEHICLE_BRANDS_VIEW)], loadComponent: () => import('./pages/admin/vehicle-brands.component').then(m => m.AdminVehicleBrandsComponent) },

      { path: 'types-engins', canActivate: [permissionGuard(PERMISSIONS.VEHICLE_TYPES_VIEW)], loadComponent: () => import('./pages/admin/vehicle-types.component').then(m => m.AdminVehicleTypesComponent) },

      { path: 'roles', canActivate: [permissionGuard(PERMISSIONS.ROLES_VIEW)], loadComponent: () => import('./pages/admin/roles.component').then(m => m.AdminRolesComponent) },

      { path: 'notifications', canActivate: [permissionGuard(PERMISSIONS.NOTIFICATIONS_VIEW)], loadComponent: () => import('./pages/admin/notifications.component').then(m => m.AdminNotificationsComponent) },

      { path: 'paiements', canActivate: [permissionGuard(PERMISSIONS.PAYMENTS_VIEW)], loadComponent: () => import('./pages/admin/payments.component').then(m => m.AdminPaymentsComponent) },

      { path: 'situation-recettes', canActivate: [permissionGuard(PERMISSIONS.PAYMENTS_VIEW)], loadComponent: () => import('./pages/admin/revenue-dashboard.component').then(m => m.AdminRevenueDashboardComponent) },

      { path: 'tarifs', canActivate: [permissionGuard(PERMISSIONS.TARIFFS_VIEW)], loadComponent: () => import('./pages/admin/tariffs.component').then(m => m.AdminTariffsComponent) }

    ]

  },

  { path: '**', redirectTo: '' }

];


