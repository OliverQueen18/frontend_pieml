import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AccountService } from '../../core/account.service';
import {
  PROFILE_CHANGE_FIELD_LABELS,
  PROFILE_CHANGE_STATUS_LABELS,
  ProfileChangeField,
  ProfileChangeRequestDto
} from '../../models';
import { GeoCoordinates, OsmLocationPickerComponent } from '../../shared/osm-location-picker.component';

const CHANGE_FIELDS: ProfileChangeField[] = [
  'FIRST_NAME',
  'LAST_NAME',
  'NINA',
  'PHONE',
  'EMAIL',
  'ADDRESS'
];

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, OsmLocationPickerComponent, DatePipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private account = inject(AccountService);

  loading = true;
  submitting = false;
  error = '';
  success = '';
  claimError = '';
  claimSuccess = '';
  geoError = '';
  attachment: File | null = null;

  readonly fieldOptions = CHANGE_FIELDS;
  readonly fieldLabels = PROFILE_CHANGE_FIELD_LABELS;
  readonly statusLabels = PROFILE_CHANGE_STATUS_LABELS;
  readonly emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  requests: ProfileChangeRequestDto[] = [];

  profileForm = this.fb.group({
    firstName: [{ value: '', disabled: true }],
    lastName: [{ value: '', disabled: true }],
    nina: [{ value: '', disabled: true }],
    phone: [{ value: '', disabled: true }],
    email: [{ value: '', disabled: true }],
    address: [{ value: '', disabled: true }],
    latitude: [{ value: null as number | null, disabled: true }],
    longitude: [{ value: null as number | null, disabled: true }]
  });

  claimForm = this.fb.group({
    field: ['' as ProfileChangeField | '', Validators.required],
    requestedValue: ['', Validators.required],
    reason: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
    latitude: [null as number | null],
    longitude: [null as number | null]
  });

  ngOnInit() {
    this.loadProfile();
    this.loadRequests();
  }

  get selectedField(): ProfileChangeField | '' {
    return this.claimForm.controls.field.value ?? '';
  }

  get isAddressField(): boolean {
    return this.selectedField === 'ADDRESS';
  }

  get mapAddress(): string {
    return this.isAddressField ? (this.claimForm.controls.requestedValue.value ?? '') : '';
  }

  loadProfile() {
    this.account.getProfile().subscribe({
      next: res => {
        const p = res.data;
        this.profileForm.patchValue({
          firstName: p.firstName,
          lastName: p.lastName,
          nina: p.nina,
          phone: p.phone,
          email: p.email,
          address: p.address,
          latitude: p.latitude,
          longitude: p.longitude
        });
        this.loading = false;
      },
      error: err => {
        this.error = err.error?.message || 'Impossible de charger le profil';
        this.loading = false;
      }
    });
  }

  loadRequests() {
    this.account.listProfileChangeRequests().subscribe({
      next: res => this.requests = res.data,
      error: () => { /* optional list */ }
    });
  }

  onFieldChange() {
    this.claimForm.patchValue({
      requestedValue: '',
      latitude: null,
      longitude: null
    });
    this.geoError = '';
    this.attachment = null;
    this.updateValueValidators();
  }

  onAttachmentSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.attachment = input.files?.[0] ?? null;
  }

  onClaimLocationSelected(coords: GeoCoordinates | null) {
    this.geoError = '';
    if (!coords) {
      this.claimForm.patchValue({ latitude: null, longitude: null });
      return;
    }
    this.claimForm.patchValue({
      latitude: coords.latitude,
      longitude: coords.longitude
    });
  }

  submitClaim() {
    this.claimForm.markAllAsTouched();
    this.claimError = '';
    this.claimSuccess = '';
    this.geoError = '';

    if (!this.attachment) {
      this.claimError = 'La pièce justificative est obligatoire.';
      return;
    }

    if (this.isAddressField) {
      const lat = this.claimForm.controls.latitude.value;
      const lng = this.claimForm.controls.longitude.value;
      if (lat == null || lng == null) {
        this.geoError = 'Veuillez indiquer la nouvelle adresse sur la carte.';
        return;
      }
    }

    if (this.claimForm.invalid) return;

    const value = this.claimForm.getRawValue();
    this.submitting = true;

    this.account.submitProfileChangeRequest({
      field: value.field as ProfileChangeField,
      requestedValue: this.normalizeRequestedValue(value.field as ProfileChangeField, value.requestedValue!),
      requestedLatitude: this.isAddressField ? value.latitude : null,
      requestedLongitude: this.isAddressField ? value.longitude : null,
      reason: value.reason!.trim(),
      file: this.attachment
    }).subscribe({
      next: res => {
        this.claimSuccess = res.message || 'Réclamation enregistrée. Elle sera traitée par l\'administration.';
        this.claimForm.reset({ field: '', requestedValue: '', reason: '', latitude: null, longitude: null });
        this.attachment = null;
        this.submitting = false;
        this.loadRequests();
      },
      error: err => {
        this.claimError = err.error?.message || 'Impossible d\'enregistrer la réclamation';
        this.submitting = false;
      }
    });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      default: return 'status-pending';
    }
  }

  private normalizeRequestedValue(field: ProfileChangeField, value: string): string {
    const trimmed = value.trim();
    if (field === 'FIRST_NAME' || field === 'LAST_NAME' || field === 'NINA') return trimmed.toUpperCase();
    if (field === 'EMAIL') return trimmed.toLowerCase();
    return trimmed;
  }

  private updateValueValidators() {
    const control = this.claimForm.controls.requestedValue;
    control.clearValidators();
    control.addValidators(Validators.required);

    switch (this.selectedField) {
      case 'NINA':
        control.addValidators([
          Validators.minLength(15),
          Validators.maxLength(15),
          Validators.pattern(/^[A-Za-z0-9]{15}$/)
        ]);
        break;
      case 'PHONE':
        control.addValidators(Validators.pattern(/^\+?[0-9]{8,15}$/));
        break;
      case 'EMAIL':
        control.addValidators(Validators.pattern(this.emailPattern));
        break;
      case 'ADDRESS':
        control.addValidators(Validators.maxLength(500));
        break;
      default:
        break;
    }
    control.updateValueAndValidity();
  }
}
