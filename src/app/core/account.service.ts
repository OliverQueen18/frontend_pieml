import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { CitizenProfileDto, ContactPayload, ProfileChangeField, ProfileChangeRequestDto } from '../models';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private api = inject(ApiService);

  getProfile() {
    return this.api.get<CitizenProfileDto>('/citizen/profile');
  }

  updateProfile(data: Omit<CitizenProfileDto, 'nina' | 'token'>) {
    return this.api.put<CitizenProfileDto>('/citizen/profile', data);
  }

  listProfileChangeRequests() {
    return this.api.get<ProfileChangeRequestDto[]>('/citizen/profile/change-requests');
  }

  submitProfileChangeRequest(payload: {
    field: ProfileChangeField;
    requestedValue: string;
    requestedLatitude?: number | null;
    requestedLongitude?: number | null;
    reason: string;
    file: File;
  }) {
    const formData = new FormData();
    formData.append('field', payload.field);
    formData.append('requestedValue', payload.requestedValue);
    formData.append('reason', payload.reason);
    formData.append('file', payload.file);
    if (payload.requestedLatitude != null) {
      formData.append('requestedLatitude', String(payload.requestedLatitude));
    }
    if (payload.requestedLongitude != null) {
      formData.append('requestedLongitude', String(payload.requestedLongitude));
    }
    return this.api.upload<ProfileChangeRequestDto>('/citizen/profile/change-requests', formData);
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.api.put<void>('/citizen/security/password', { currentPassword, newPassword });
  }

  sendContact(data: ContactPayload) {
    return this.api.post<void>('/citizen/contact', data);
  }

  sendPublicContact(data: ContactPayload) {
    return this.api.postPublic<void>('/public/contact', data);
  }
}
