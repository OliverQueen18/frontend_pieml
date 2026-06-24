import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { CitizenProfileDto, ContactPayload } from '../models';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private api = inject(ApiService);

  getProfile() {
    return this.api.get<CitizenProfileDto>('/citizen/profile');
  }

  updateProfile(data: Omit<CitizenProfileDto, 'nina' | 'token'>) {
    return this.api.put<CitizenProfileDto>('/citizen/profile', data);
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
