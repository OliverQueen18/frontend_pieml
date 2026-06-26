import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import {
  AdminCitizenDto,
  AdminDashboardCharts,
  AdminDashboardStats,
  AdminDossierSummary,
  AdminNotificationDto,
  AdminPaymentDto,
  AdminProfileChangeRequestDto,
  AdminRoleDto,
  AdminTariffDto,
  AdminUserDto,
  CenterDto,
  DossierDto,
  TypeDocumentDto,
  VehicleLookupDto,
  CenterAvailabilityDto
} from '../models';
import { PermissionDto } from './permissions';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private api = inject(ApiService);

  getDashboard() {
    return this.api.get<AdminDashboardStats>('/admin/dashboard');
  }

  getDashboardCharts(period: '7d' | '30d' | '6m' = '30d') {
    return this.api.get<AdminDashboardCharts>(`/admin/dashboard/charts?period=${period}`);
  }

  listDossiers(filters?: {
    status?: string;
    reference?: string;
    citizen?: string;
    chassis?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.reference?.trim()) params.set('reference', filters.reference.trim());
    if (filters?.citizen?.trim()) params.set('citizen', filters.citizen.trim());
    if (filters?.chassis?.trim()) params.set('chassis', filters.chassis.trim());
    const query = params.toString();
    return this.api.get<AdminDossierSummary[]>(`/admin/dossiers${query ? `?${query}` : ''}`);
  }

  getDossier(id: number) {
    return this.api.get<DossierDto>(`/admin/dossiers/${id}`);
  }

  getDocumentFile(dossierId: number, documentId: number) {
    return this.api.getBlob(`/admin/dossiers/${dossierId}/documents/${documentId}/file`);
  }

  validateDossier(id: number) {
    return this.api.post<DossierDto>(`/admin/dossiers/${id}/validate`, {});
  }

  confirmAppointment(id: number, data: { centerId: number; appointmentDate: string; appointmentTime: string }) {
    return this.api.post<DossierDto>(`/admin/dossiers/${id}/confirm-appointment`, data);
  }

  startImmatriculation(id: number) {
    return this.api.post<DossierDto>(`/admin/dossiers/${id}/start-immatriculation`, {});
  }

  completeImmatriculation(id: number, registrationNumber: string) {
    return this.api.post<DossierDto>(`/admin/dossiers/${id}/complete-immatriculation`, { registrationNumber });
  }

  cancelImmatriculation(id: number, reason: string) {
    return this.api.post<DossierDto>(`/admin/dossiers/${id}/cancel-immatriculation`, { reason });
  }

  getCenterAvailability(centerId: number) {
    return this.api.get<CenterAvailabilityDto>(`/admin/centers/${centerId}/availability`);
  }

  rejectDossier(id: number, reason: string) {
    return this.api.post<DossierDto>(`/admin/dossiers/${id}/reject`, { reason });
  }

  validateDossiersBulk(dossierIds: number[]) {
    return this.api.post<DossierDto[]>('/admin/dossiers/bulk/validate', { dossierIds });
  }

  rejectDossiersBulk(dossierIds: number[], reason: string) {
    return this.api.post<DossierDto[]>('/admin/dossiers/bulk/reject', { dossierIds, reason });
  }

  deleteDossier(id: number) {
    return this.api.delete<void>(`/admin/dossiers/${id}`);
  }

  validateDocuments(dossierId: number, documentIds: number[]) {
    return this.api.post<DossierDto>(`/admin/dossiers/${dossierId}/documents/validate`, { documentIds });
  }

  rejectDocuments(dossierId: number, documentIds: number[]) {
    return this.api.post<DossierDto>(`/admin/dossiers/${dossierId}/documents/reject`, { documentIds });
  }

  deleteDocument(dossierId: number, documentId: number) {
    return this.api.delete<DossierDto>(`/admin/dossiers/${dossierId}/documents/${documentId}`);
  }

  savePlateDelivery(dossierId: number, formData: FormData) {
    return this.api.upload<DossierDto>(`/admin/dossiers/${dossierId}/remise-plaque`, formData);
  }

  getPlateDeliveryFile(dossierId: number) {
    return this.api.getBlob(`/admin/dossiers/${dossierId}/remise-plaque/file`);
  }

  listCitizens() {
    return this.api.get<AdminCitizenDto[]>(`/admin/citizens`);
  }

  deleteCitizen(id: number) {
    return this.api.delete<void>(`/admin/citizens/${id}`);
  }

  listProfileChangeRequests(status?: string) {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.api.get<AdminProfileChangeRequestDto[]>(`/admin/profile-change-requests${query}`);
  }

  getProfileChangeRequestsPendingCount() {
    return this.api.get<{ count: number }>('/admin/profile-change-requests/pending-count');
  }

  getProfileChangeRequestFile(id: number) {
    return this.api.getBlob(`/admin/profile-change-requests/${id}/file`);
  }

  approveProfileChangeRequest(id: number) {
    return this.api.post<AdminProfileChangeRequestDto>(`/admin/profile-change-requests/${id}/approve`, {});
  }

  rejectProfileChangeRequest(id: number, reason?: string) {
    return this.api.post<AdminProfileChangeRequestDto>(`/admin/profile-change-requests/${id}/reject`, { reason });
  }

  listUsers() {
    return this.api.get<AdminUserDto[]>(`/admin/users`);
  }

  createUser(data: { email: string; phone: string; password: string; role: string; centerIds?: number[] }) {
    const payload: Record<string, unknown> = {
      email: data.email,
      phone: data.phone,
      password: data.password,
      role: data.role
    };
    if (data.centerIds?.length) {
      payload['centerIds'] = data.centerIds;
    }
    return this.api.post<AdminUserDto>('/admin/users', payload);
  }

  updateUser(id: number, data: Partial<{ phone: string; role: string; enabled: boolean; password: string; centerIds: number[] }>) {
    return this.api.put<AdminUserDto>(`/admin/users/${id}`, data);
  }

  deleteUser(id: number) {
    return this.api.delete<void>(`/admin/users/${id}`);
  }

  resetUserPassword(id: number) {
    return this.api.post<void>(`/admin/users/${id}/reset-password`, {});
  }

  listCenters() {
    return this.api.get<CenterDto[]>('/admin/centers');
  }

  createCenter(data: Partial<CenterDto> & { name: string; city: string }) {
    return this.api.post<CenterDto>('/admin/centers', data);
  }

  updateCenter(id: number, data: Partial<CenterDto> & { name: string; city: string }) {
    return this.api.put<CenterDto>(`/admin/centers/${id}`, data);
  }

  deleteCenter(id: number) {
    return this.api.delete<void>(`/admin/centers/${id}`);
  }

  listTypeDocuments() {
    return this.api.get<TypeDocumentDto[]>('/admin/type-documents');
  }

  createTypeDocument(data: Partial<TypeDocumentDto>) {
    return this.api.post<TypeDocumentDto>('/admin/type-documents', data);
  }

  updateTypeDocument(id: number, data: Partial<TypeDocumentDto>) {
    return this.api.put<TypeDocumentDto>(`/admin/type-documents/${id}`, data);
  }

  deleteTypeDocument(id: number) {
    return this.api.delete<void>(`/admin/type-documents/${id}`);
  }

  listVehicleBrands() {
    return this.api.get<VehicleLookupDto[]>('/admin/vehicle-brands');
  }

  createVehicleBrand(data: Partial<VehicleLookupDto>) {
    return this.api.post<VehicleLookupDto>('/admin/vehicle-brands', data);
  }

  updateVehicleBrand(id: number, data: Partial<VehicleLookupDto>) {
    return this.api.put<VehicleLookupDto>(`/admin/vehicle-brands/${id}`, data);
  }

  deleteVehicleBrand(id: number) {
    return this.api.delete<void>(`/admin/vehicle-brands/${id}`);
  }

  listVehicleTypes() {
    return this.api.get<VehicleLookupDto[]>('/admin/vehicle-types');
  }

  createVehicleType(data: Partial<VehicleLookupDto>) {
    return this.api.post<VehicleLookupDto>('/admin/vehicle-types', data);
  }

  updateVehicleType(id: number, data: Partial<VehicleLookupDto>) {
    return this.api.put<VehicleLookupDto>(`/admin/vehicle-types/${id}`, data);
  }

  deleteVehicleType(id: number) {
    return this.api.delete<void>(`/admin/vehicle-types/${id}`);
  }

  listRoles() {
    return this.api.get<AdminRoleDto[]>('/admin/roles');
  }

  createRole(data: { code: string; label: string; description?: string; active?: boolean }) {
    return this.api.post<AdminRoleDto>('/admin/roles', data);
  }

  updateRole(id: number, data: Partial<{ code: string; label: string; description?: string; active?: boolean }>) {
    return this.api.put<AdminRoleDto>(`/admin/roles/${id}`, data);
  }

  deleteRole(id: number) {
    return this.api.delete<void>(`/admin/roles/${id}`);
  }

  listPermissionsCatalog() {
    return this.api.get<PermissionDto[]>('/admin/permissions');
  }

  updateRolePermissions(id: number, permissions: string[]) {
    return this.api.put<AdminRoleDto>(`/admin/roles/${id}/permissions`, { permissions });
  }

  listNotifications() {
    return this.api.get<AdminNotificationDto[]>('/admin/notifications');
  }

  createNotification(data: {
    userEmail: string;
    message: string;
    type: string;
    sendEmail?: boolean;
  }) {
    return this.api.post<AdminNotificationDto>('/admin/notifications', data);
  }

  updateNotification(id: number, data: Partial<{ message: string; type: string; read: boolean }>) {
    return this.api.put<AdminNotificationDto>(`/admin/notifications/${id}`, data);
  }

  deleteNotification(id: number) {
    return this.api.delete<void>(`/admin/notifications/${id}`);
  }

  listPayments() {
    return this.api.get<AdminPaymentDto[]>('/admin/payments');
  }

  getPayment(id: number) {
    return this.api.get<AdminPaymentDto>(`/admin/payments/${id}`);
  }

  updatePayment(id: number, data: { status: string; paymentMethod?: string; transactionId?: string }) {
    return this.api.put<AdminPaymentDto>(`/admin/payments/${id}`, data);
  }

  deletePayment(id: number) {
    return this.api.delete<void>(`/admin/payments/${id}`);
  }

  listTariffs() {
    return this.api.get<AdminTariffDto[]>('/admin/tariffs');
  }

  createTariff(data: {
    code: string;
    libelle: string;
    description?: string;
    amount: number;
    serviceFee: number;
    actif?: boolean;
    ordre?: number;
  }) {
    return this.api.post<AdminTariffDto>('/admin/tariffs', data);
  }

  updateTariff(id: number, data: {
    code: string;
    libelle: string;
    description?: string;
    amount: number;
    serviceFee: number;
    actif?: boolean;
    ordre?: number;
  }) {
    return this.api.put<AdminTariffDto>(`/admin/tariffs/${id}`, data);
  }

  deleteTariff(id: number) {
    return this.api.delete<void>(`/admin/tariffs/${id}`);
  }
}
