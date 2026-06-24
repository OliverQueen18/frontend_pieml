import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import {
  CenterDto,
  DashboardStats,
  DossierDto,
  NotificationDto,
  PublicStats,
  AdminTariffDto,
  TypeDocumentDto,
  VehicleDto,
  VehicleCreateRequest,
  VehicleLookupDto,
  CenterAvailabilityDto
} from '../models';

@Injectable({ providedIn: 'root' })
export class DossierService {
  private api = inject(ApiService);

  getPublicStats() {
    return this.api.getPublic<PublicStats>('/public/stats');
  }

  getPublicTariffs() {
    return this.api.getPublic<AdminTariffDto[]>('/public/tariffs');
  }

  getTypeDocuments() {
    return this.api.getPublic<TypeDocumentDto[]>('/public/type-documents');
  }

  getVehicleBrands() {
    return this.api.getPublic<VehicleLookupDto[]>('/public/vehicle-brands');
  }

  getVehicleTypes() {
    return this.api.getPublic<VehicleLookupDto[]>('/public/vehicle-types');
  }

  getDashboard() {
    return this.api.get<DashboardStats>('/citizen/dashboard');
  }

  getDossiers() {
    return this.api.get<DossierDto[]>('/citizen/dossiers');
  }

  getDossier(id: number) {
    return this.api.get<DossierDto>(`/citizen/dossiers/${id}`);
  }

  deleteDraftDossier(id: number) {
    return this.api.delete<void>(`/citizen/dossiers/${id}`);
  }

  createDossier(vehicle: VehicleCreateRequest) {
    return this.api.post<DossierDto>('/citizen/dossiers', vehicle);
  }

  submitDossier(id: number) {
    return this.api.post<DossierDto>(`/citizen/dossiers/${id}/submit`, {});
  }

  uploadDocument(dossierId: number, typeDocumentId: number, file: File) {
    const fd = new FormData();
    fd.append('typeDocumentId', String(typeDocumentId));
    fd.append('file', file);
    return this.api.upload<DossierDto>(`/citizen/dossiers/${dossierId}/documents`, fd);
  }

  getDocumentFile(dossierId: number, documentId: number) {
    return this.api.getBlob(`/citizen/dossiers/${dossierId}/documents/${documentId}/file`);
  }

  initiatePayment(dossierId: number, paymentMethod: string, centerId: number) {
    return this.api.post<DossierDto>(`/citizen/dossiers/${dossierId}/payment`, { paymentMethod, centerId });
  }

  confirmPayment(dossierId: number) {
    return this.api.post<DossierDto>(`/citizen/dossiers/${dossierId}/payment/confirm`, {});
  }

  getCenters() {
    return this.api.get<CenterDto[]>('/citizen/centers');
  }

  getCenterAvailability(centerId: number) {
    return this.api.get<CenterAvailabilityDto>(`/citizen/centers/${centerId}/availability`);
  }

  scheduleAppointment(dossierId: number, data: { centerId: number; appointmentDate: string; appointmentTime: string }) {
    return this.api.post<DossierDto>(`/citizen/dossiers/${dossierId}/appointment`, data);
  }

  getDeclarationFile(dossierId: number) {
    return this.api.getBlob(`/citizen/dossiers/${dossierId}/declaration/file`);
  }

  declareVehicle(dossierId: number, declarationType: string, file: File) {
    const fd = new FormData();
    fd.append('declarationType', declarationType);
    fd.append('file', file);
    return this.api.upload<DossierDto>(`/citizen/dossiers/${dossierId}/declaration`, fd);
  }

  trackDossier(reference: string) {
    const params = new URLSearchParams({ reference });
    return this.api.getPublic<DossierDto>(`/citizen/track?${params}`);
  }

  getNotifications() {
    return this.api.get<NotificationDto[]>('/citizen/notifications');
  }
}
