import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AccountService } from '../../core/account.service';
import { AuthService } from '../../core/auth.service';
import { GeoCoordinates, OsmLocationPickerComponent } from '../../shared/osm-location-picker.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, OsmLocationPickerComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private account = inject(AccountService);
  private auth = inject(AuthService);

  loading = true;
  saving = false;
  error = '';
  success = '';
  geoError = '';

  readonly emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    nina: [{ value: '', disabled: true }],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{8,15}$/)]],
    email: ['', [Validators.required, Validators.pattern(this.emailPattern)]],
    address: ['', [Validators.required, Validators.maxLength(500)]],
    latitude: [null as number | null, Validators.required],
    longitude: [null as number | null, Validators.required]
  });

  ngOnInit() {
    this.account.getProfile().subscribe({
      next: res => {
        const p = res.data;
        this.form.patchValue({
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

  toUppercase(field: 'firstName' | 'lastName') {
    const control = this.form.get(field);
    const value = (control?.value ?? '').toString().toUpperCase();
    if (control?.value !== value) {
      control?.setValue(value, { emitEvent: false });
    }
  }

  onLocationSelected(coords: GeoCoordinates | null) {
    this.geoError = '';
    if (!coords) {
      this.form.patchValue({ latitude: null, longitude: null });
      return;
    }
    this.form.patchValue({
      latitude: coords.latitude,
      longitude: coords.longitude
    });
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      if (!this.form.controls.latitude.value || !this.form.controls.longitude.value) {
        this.geoError = 'Veuillez indiquer une adresse valide ou sélectionner un point sur la carte.';
      }
      return;
    }

    this.saving = true;
    this.error = '';
    this.success = '';
    this.geoError = '';

    const value = this.form.getRawValue();
    this.account.updateProfile({
      firstName: value.firstName!.trim().toUpperCase(),
      lastName: value.lastName!.trim().toUpperCase(),
      phone: value.phone!.trim(),
      email: value.email!.trim().toLowerCase(),
      address: value.address!.trim(),
      latitude: Number(value.latitude),
      longitude: Number(value.longitude)
    }).subscribe({
      next: res => {
        const profile = res.data;
        this.auth.updateSession({
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          ...(profile.token ? { token: profile.token } : {})
        });
        this.success = res.message || 'Profil mis à jour avec succès.';
        this.saving = false;
      },
      error: err => {
        this.error = err.error?.message || 'Erreur lors de la mise à jour';
        this.saving = false;
      }
    });
  }
}
