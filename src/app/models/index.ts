export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

export interface AuthResponse {
  token: string | null;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  otpVerified: boolean;
  mustChangePassword?: boolean;
  permissions?: string[];
  centerIds?: number[];
  centerNames?: string[];
}

export interface CitizenProfileDto {
  firstName: string;
  lastName: string;
  nina: string;
  phone: string;
  email: string;
  address: string;
  latitude: number;
  longitude: number;
  token?: string | null;
}

export interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface VehicleLookupDto {
  id: number;
  code: string;
  libelle: string;
  description?: string;
  actif: boolean;
  ordre: number;
}

export interface VehicleDto {
  brandId?: number;
  vehicleTypeId?: number;
  brandOther?: string;
  brand: string;
  vehicleType?: string;
  model: string;
  engineCapacity?: string;
  engineNumber?: string;
  chassisNumber: string;
  color: string;
  year: number;
  countryOfOrigin?: string;
}

export interface VehicleCreateRequest {
  brandId: number;
  vehicleTypeId: number;
  brandOther?: string;
  model: string;
  engineCapacity?: string;
  engineNumber?: string;
  chassisNumber: string;
  color: string;
  year: number;
  countryOfOrigin?: string;
}

export interface TypeDocumentDto {
  id: number;
  code: string;
  libelle: string;
  description?: string;
  obligatoire: boolean;
  actif: boolean;
  ordre: number;
}

export interface DocumentDto {
  id: number;
  typeDocument: TypeDocumentDto;
  status: string;
  fileName?: string;
  fileSize?: number;
  contentType?: string;
  uploadedAt?: string;
}

export interface PaymentDto {
  id: number;
  amount: number;
  serviceFee: number;
  totalAmount: number;
  transactionId?: string;
  status: string;
  paymentMethod?: string;
  paymentDate?: string;
}

export interface AppointmentDto {
  id: number;
  centerId: number;
  centerName: string;
  centerCity: string;
  centerAddress?: string;
  centerLatitude?: number | null;
  centerLongitude?: number | null;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
}

export type VehicleDeclarationType = 'STOLEN' | 'LOST' | 'SOLD';

export interface VehicleDeclarationDto {
  id: number;
  declarationType: VehicleDeclarationType;
  fileName: string;
  fileSize?: number;
  contentType?: string;
  declaredAt: string;
}

export interface ProcessingCenterDto {
  id: number;
  name: string;
  city: string;
  address?: string;
}

export interface DossierDto {
  id: number;
  referenceNumber: string;
  status: string;
  rejectionReason?: string;
  vehicle?: VehicleDto;
  documents: DocumentDto[];
  payment?: PaymentDto;
  appointment?: AppointmentDto;
  processingCenter?: ProcessingCenterDto;
  vehicleDeclaration?: VehicleDeclarationDto;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  dossiersEnCours: number;
  dossiersValides: number;
  rendezVous: number;
  immatriculations: number;
  totalDossiers: number;
  totalValides: number;
  totalImmatriculations: number;
  satisfactionRate: number;
}

export interface PublicStats {
  dossiersDeposes: number;
  dossiersValides: number;
  immatriculations: number;
  satisfactionRate: number;
}

export interface CenterDto {
  id: number;
  name: string;
  city: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  dailyCapacity: number;
  active: boolean;
  openingDays?: string[];
  openingTime?: string;
  closingTime?: string;
  processingDelayDays?: number;
}

export interface CenterAvailabilityDto {
  earliestDate: string;
  processingDelayDays: number;
  dailyCapacity: number;
  openingTime: string;
  closingTime: string;
  openingDays: string[];
  availableDays: { date: string; booked: number; remaining: number }[];
}

export interface NotificationDto {
  id: number;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface AdminDashboardStats {
  totalDossiers: number;
  dossiersEnCours: number;
  dossiersValides: number;
  dossiersRejetes: number;
  immatriculations: number;
  totalCitoyens: number;
  totalUtilisateurs: number;
  rendezVousPlanifies: number;
}

export interface DashboardChartPoint {
  label: string;
  value: number;
}

export interface DashboardCenterStat {
  centerId: number;
  centerName: string;
  city: string;
  appointments: number;
  dossiers: number;
}

export interface AdminDashboardCharts {
  period: string;
  dossiersByPeriod: DashboardChartPoint[];
  statsByCenter: DashboardCenterStat[];
  recentNotifications: AdminNotificationDto[];
}

export interface AdminDossierSummary {
  id: number;
  referenceNumber: string;
  status: string;
  citizenName: string;
  citizenEmail: string;
  vehicleLabel?: string;
  chassisNumber?: string;
  uploadedDocuments: number;
  requiredDocuments: number;
  centerName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserDto {
  id: number;
  email: string;
  phone: string;
  role: string;
  enabled: boolean;
  firstName: string;
  lastName: string;
  createdAt: string;
  mustChangePassword?: boolean;
  centerIds?: number[];
  centerNames?: string[];
}

export interface AdminCitizenDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nina: string;
  dossierCount: number;
  createdAt: string;
  enabled?: boolean;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface AdminRoleDto {
  id: number;
  code: string;
  label: string;
  description?: string;
  active: boolean;
  systemRole: boolean;
  userCount: number;
  createdAt: string;
  permissions?: string[];
}

export interface AdminNotificationDto {
  id: number;
  userId: number;
  userEmail: string;
  userName: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface AdminPaymentDto {
  id: number;
  dossierId: number;
  dossierReference: string;
  citizenName: string;
  citizenEmail: string;
  amount: number;
  serviceFee: number;
  totalAmount: number;
  transactionId?: string;
  status: string;
  paymentMethod?: string;
  paymentDate?: string;
}

export interface AdminTariffDto {
  id: number;
  code: string;
  libelle: string;
  description?: string;
  amount: number;
  serviceFee: number;
  actif: boolean;
  ordre: number;
  createdAt: string;
  updatedAt?: string;
}

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  INFO: 'Information',
  SUCCESS: 'Succès',
  WARNING: 'Avertissement',
  DOSSIER: 'Dossier',
  PAYMENT: 'Paiement',
  APPOINTMENT: 'Rendez-vous'
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  PROCESSING: 'En cours',
  COMPLETED: 'Confirmé',
  FAILED: 'Échoué',
  REFUNDED: 'Remboursé'
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CARTE_BANCAIRE: 'Carte bancaire',
  MOBILE_MONEY: 'Mobile Money',
  TRESOR_PAY: 'Trésor Pay'
};


export const DOSSIER_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Soumis',
  IN_REVIEW: 'En cours',
  VALIDATED: 'Validé',
  REJECTED: 'Rejeté',
  PAYMENT_PENDING: 'Paiement en attente',
  PAID: 'Payé',
  APPOINTMENT_SCHEDULED: 'RDV planifié',
  COMPLETED: 'Immatriculé',
  STOLEN: 'Volé',
  LOST: 'Perdu',
  SOLD: 'Vendu'
};

export const VEHICLE_DECLARATION_TYPE_LABELS: Record<VehicleDeclarationType, string> = {
  STOLEN: 'Engin volé',
  LOST: 'Engin perdu',
  SOLD: 'Engin vendu'
};

export const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  UPLOADED: 'Téléversé',
  VALIDATED: 'Validé',
  REJECTED: 'Rejeté'
};
