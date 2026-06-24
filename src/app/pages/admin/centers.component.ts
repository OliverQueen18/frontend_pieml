import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { AdminService } from '../../core/admin.service';
import { CenterDto } from '../../models';
import { GeoCoordinates, OsmLocationPickerComponent } from '../../shared/osm-location-picker.component';

const DEFAULT_OPENING_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

export const CENTER_WEEK_DAYS = [
  { value: 'MONDAY', label: 'Lun' },
  { value: 'TUESDAY', label: 'Mar' },
  { value: 'WEDNESDAY', label: 'Mer' },
  { value: 'THURSDAY', label: 'Jeu' },
  { value: 'FRIDAY', label: 'Ven' },
  { value: 'SATURDAY', label: 'Sam' },
  { value: 'SUNDAY', label: 'Dim' }
] as const;

@Component({
  selector: 'app-admin-centers',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, OsmLocationPickerComponent],
  templateUrl: './centers.component.html',
  styleUrl: './centers.component.scss'
})
export class AdminCentersComponent implements OnInit {
  private admin = inject(AdminService);
  private fb = inject(FormBuilder);

  readonly weekDays = CENTER_WEEK_DAYS;

  centers: CenterDto[] = [];
  searchQuery = '';
  error = '';
  success = '';
  geoError = '';
  scheduleError = '';
  showForm = false;
  viewingCenter: CenterDto | null = null;
  editingId: number | null = null;
  togglingId: number | null = null;
  mapInitialLat: number | null = null;
  mapInitialLng: number | null = null;

  form = this.fb.group({
    name: ['', Validators.required],
    city: ['', Validators.required],
    address: [''],
    latitude: [null as number | null, Validators.required],
    longitude: [null as number | null, Validators.required],
    dailyCapacity: [50, [Validators.required, Validators.min(1)]],
    active: [true],
    openingDays: [DEFAULT_OPENING_DAYS, Validators.required],
    openingTime: ['08:00', Validators.required],
    closingTime: ['17:00', Validators.required],
    processingDelayDays: [3, [Validators.required, Validators.min(0)]]
  });

  ngOnInit() {
    this.load();
  }

  get filteredCenters(): CenterDto[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.centers;
    return this.centers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      (c.address || '').toLowerCase().includes(q)
    );
  }

  get mapAddress(): string {
    const parts = [this.form.controls.address.value, this.form.controls.city.value]
      .filter(v => (v || '').trim());
    return parts.join(', ');
  }

  load() {
    this.admin.listCenters().subscribe({
      next: res => this.centers = res.data,
      error: err => this.error = err.error?.message || 'Erreur de chargement'
    });
  }

  openCreate() {
    this.editingId = null;
    this.mapInitialLat = null;
    this.mapInitialLng = null;
    this.geoError = '';
    this.scheduleError = '';
    this.showForm = true;
    this.form.reset({
      dailyCapacity: 50,
      latitude: null,
      longitude: null,
      active: true,
      openingDays: [...DEFAULT_OPENING_DAYS],
      openingTime: '08:00',
      closingTime: '17:00',
      processingDelayDays: 3
    });
  }

  openEdit(center: CenterDto) {
    this.closeView();
    this.editingId = center.id;
    this.mapInitialLat = center.latitude ?? null;
    this.mapInitialLng = center.longitude ?? null;
    this.geoError = '';
    this.scheduleError = '';
    this.showForm = true;
    this.form.patchValue({
      name: center.name,
      city: center.city,
      address: center.address || '',
      latitude: center.latitude ?? null,
      longitude: center.longitude ?? null,
      dailyCapacity: center.dailyCapacity,
      active: center.active,
      openingDays: center.openingDays?.length ? [...center.openingDays] : [...DEFAULT_OPENING_DAYS],
      openingTime: this.toTimeInput(center.openingTime ?? '08:00'),
      closingTime: this.toTimeInput(center.closingTime ?? '17:00'),
      processingDelayDays: center.processingDelayDays ?? 3
    });
  }

  cancelForm() {
    this.showForm = false;
    this.editingId = null;
    this.geoError = '';
    this.scheduleError = '';
  }

  openView(center: CenterDto) {
    this.viewingCenter = center;
  }

  closeView() {
    this.viewingCenter = null;
  }

  openEditFromView() {
    if (!this.viewingCenter) return;
    const center = this.viewingCenter;
    this.closeView();
    this.openEdit(center);
  }

  get viewMapAddress(): string {
    if (!this.viewingCenter) return '';
    const parts = [this.viewingCenter.address, this.viewingCenter.city].filter(v => (v || '').trim());
    return parts.join(', ');
  }

  formatOpeningDays(center: CenterDto): string {
    if (!center.openingDays?.length) return 'Lun – Ven';
    return center.openingDays
      .map(d => this.weekDays.find(w => w.value === d)?.label ?? d)
      .join(', ');
  }

  isDaySelected(day: string): boolean {
    return (this.form.controls.openingDays.value ?? []).includes(day);
  }

  toggleDay(day: string) {
    const current = [...(this.form.controls.openingDays.value ?? [])];
    const idx = current.indexOf(day);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(day);
    this.form.controls.openingDays.setValue(current);
    this.form.controls.openingDays.markAsTouched();
  }

  onLocationSelected(coords: GeoCoordinates | null) {
    this.geoError = '';
    if (coords) {
      this.form.patchValue({ latitude: coords.latitude, longitude: coords.longitude });
    } else {
      this.form.patchValue({ latitude: null, longitude: null });
    }
  }

  formatCoords(center: CenterDto): string {
    if (center.latitude == null || center.longitude == null) return '—';
    return `${center.latitude.toFixed(4)}, ${center.longitude.toFixed(4)}`;
  }

  formatSchedule(center: CenterDto): string {
    const days = center.openingDays?.length
      ? center.openingDays.map(d => this.weekDays.find(w => w.value === d)?.label ?? d).join(', ')
      : 'Lun–Ven';
    const open = this.toTimeInput(center.openingTime ?? '08:00');
    const close = this.toTimeInput(center.closingTime ?? '17:00');
    const delay = center.processingDelayDays ?? 3;
    return `${days} · ${open}–${close} · ${delay} j`;
  }

  toTimeInput(value: string): string {
    return value.length >= 5 ? value.substring(0, 5) : value;
  }

  toApiTime(value: string): string {
    return value.length === 5 ? `${value}:00` : value;
  }

  private buildPayload(value: ReturnType<typeof this.form.getRawValue>) {
    return {
      name: value.name!,
      city: value.city!,
      address: value.address || '',
      latitude: Number(value.latitude),
      longitude: Number(value.longitude),
      dailyCapacity: Number(value.dailyCapacity),
      active: !!value.active,
      openingDays: value.openingDays ?? [],
      openingTime: this.toApiTime(value.openingTime!),
      closingTime: this.toApiTime(value.closingTime!),
      processingDelayDays: Number(value.processingDelayDays)
    };
  }

  centerToPayload(center: CenterDto, overrides: Partial<ReturnType<typeof this.buildPayload>> = {}) {
    return {
      name: center.name,
      city: center.city,
      address: center.address || '',
      latitude: center.latitude!,
      longitude: center.longitude!,
      dailyCapacity: center.dailyCapacity,
      active: center.active,
      openingDays: center.openingDays?.length ? center.openingDays : DEFAULT_OPENING_DAYS,
      openingTime: this.toApiTime(this.toTimeInput(center.openingTime ?? '08:00')),
      closingTime: this.toApiTime(this.toTimeInput(center.closingTime ?? '17:00')),
      processingDelayDays: center.processingDelayDays ?? 3,
      ...overrides
    };
  }

  submit() {
    this.scheduleError = '';
    if (!this.form.controls.openingDays.value?.length) {
      this.scheduleError = 'Sélectionnez au moins un jour d\'ouverture.';
      return;
    }
    const open = this.form.controls.openingTime.value!;
    const close = this.form.controls.closingTime.value!;
    if (open >= close) {
      this.scheduleError = 'L\'heure de fermeture doit être après l\'heure d\'ouverture.';
      return;
    }
    if (this.form.invalid) {
      if (!this.form.controls.latitude.value || !this.form.controls.longitude.value) {
        this.geoError = 'Veuillez indiquer la position du centre sur la carte.';
      }
      return;
    }
    const payload = this.buildPayload(this.form.getRawValue());

    const req = this.editingId
      ? this.admin.updateCenter(this.editingId, payload)
      : this.admin.createCenter(payload);

    req.subscribe({
      next: () => {
        this.success = this.editingId ? 'Centre mis à jour' : 'Centre créé';
        this.cancelForm();
        this.load();
      },
      error: err => this.error = err.error?.message || 'Enregistrement impossible'
    });
  }

  toggleActive(center: CenterDto) {
    if (center.latitude == null || center.longitude == null) {
      this.error = 'Complétez les coordonnées du centre avant de modifier son statut.';
      return;
    }

    const nextActive = !center.active;
    const label = nextActive ? 'activer' : 'désactiver';
    if (!confirm(`${nextActive ? 'Activer' : 'Désactiver'} le centre « ${center.name} » ?`)) return;

    this.togglingId = center.id;
    this.error = '';
    this.admin.updateCenter(center.id, this.centerToPayload(center, { active: nextActive })).subscribe({
      next: () => {
        this.success = `Centre ${nextActive ? 'activé' : 'désactivé'}`;
        this.togglingId = null;
        this.load();
      },
      error: err => {
        this.error = err.error?.message || `Impossible de ${label} ce centre`;
        this.togglingId = null;
      }
    });
  }

  remove(center: CenterDto) {
    if (!confirm(`Supprimer le centre « ${center.name} » ?\nS'il a des rendez-vous, il sera seulement désactivé.`)) return;

    this.error = '';
    this.admin.deleteCenter(center.id).subscribe({
      next: () => {
        this.success = 'Centre supprimé ou désactivé';
        if (this.editingId === center.id) this.cancelForm();
        this.load();
      },
      error: err => this.error = err.error?.message || 'Suppression impossible'
    });
  }
}
