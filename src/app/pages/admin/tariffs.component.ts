import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { AdminService } from '../../core/admin.service';
import { AuthService } from '../../core/auth.service';
import { PERMISSIONS } from '../../core/permissions';
import { AdminTariffDto } from '../../models';

@Component({
  selector: 'app-admin-tariffs',
  standalone: true,
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule, FormsModule],
  templateUrl: './tariffs.component.html',
  styleUrl: './tariffs.component.scss'
})
export class AdminTariffsComponent implements OnInit {
  private admin = inject(AdminService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  tariffs: AdminTariffDto[] = [];
  searchQuery = '';
  error = '';
  success = '';
  showForm = false;
  viewingTariff: AdminTariffDto | null = null;
  editingId: number | null = null;
  togglingId: number | null = null;
  removingId: number | null = null;
  readonly canManage = () => this.auth.hasPermission(PERMISSIONS.TARIFFS_MANAGE);

  form = this.fb.group({
    code: ['', Validators.required],
    libelle: ['', Validators.required],
    description: [''],
    amount: [0, [Validators.required, Validators.min(0)]],
    serviceFee: [0, Validators.min(0)],
    ordre: [1, [Validators.required, Validators.min(0)]],
    actif: [true]
  });

  ngOnInit() {
    this.load();
  }

  get filteredTariffs(): AdminTariffDto[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.tariffs;
    return this.tariffs.filter(t =>
      t.code.toLowerCase().includes(q) ||
      t.libelle.toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q)
    );
  }

  load() {
    this.admin.listTariffs().subscribe({
      next: res => this.tariffs = res.data,
      error: err => this.error = err.error?.message || 'Erreur de chargement'
    });
  }

  openCreate() {
    if (!this.canManage()) {
      this.error = 'Vous n\'avez pas la permission de gérer les tarifs.';
      return;
    }
    this.closeView();
    this.editingId = null;
    this.showForm = true;
    this.form.reset({ amount: 0, serviceFee: 0, ordre: this.tariffs.length + 1, actif: true });
    this.form.controls.code.enable();
  }

  openEdit(tariff: AdminTariffDto) {
    if (!this.canManage()) {
      this.error = 'Vous n\'avez pas la permission de gérer les tarifs.';
      return;
    }
    this.closeView();
    this.editingId = tariff.id;
    this.showForm = true;
    this.form.patchValue({
      code: tariff.code,
      libelle: tariff.libelle,
      description: tariff.description || '',
      amount: tariff.amount,
      serviceFee: tariff.serviceFee ?? 0,
      ordre: tariff.ordre,
      actif: tariff.actif
    });
    this.form.controls.code.enable();
  }

  openEditFromView() {
    if (!this.viewingTariff) return;
    this.openEdit(this.viewingTariff);
    this.viewingTariff = null;
  }

  cancelForm() {
    this.showForm = false;
    this.editingId = null;
    this.form.controls.code.enable();
  }

  openView(tariff: AdminTariffDto) {
    this.viewingTariff = tariff;
  }

  closeView() {
    this.viewingTariff = null;
  }

  submit() {
    if (!this.canManage() || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.error = '';
    this.success = '';
    const value = this.form.getRawValue();
    const payload = {
      code: value.code!.trim().toUpperCase(),
      libelle: value.libelle!.trim(),
      description: value.description || '',
      amount: Number(value.amount),
      serviceFee: this.toNonNegativeNumber(value.serviceFee, 0),
      ordre: Number(value.ordre),
      actif: !!value.actif
    };

    const req = this.editingId
      ? this.admin.updateTariff(this.editingId, payload)
      : this.admin.createTariff(payload);

    req.subscribe({
      next: () => {
        this.success = this.editingId ? 'Tarif mis à jour' : 'Tarif créé';
        this.cancelForm();
        this.load();
      },
      error: err => this.error = err.error?.message || 'Enregistrement impossible'
    });
  }

  toggleActive(tariff: AdminTariffDto) {
    if (!this.canManage()) {
      this.error = 'Vous n\'avez pas la permission de gérer les tarifs.';
      return;
    }

    const next = !tariff.actif;
    if (!confirm(`${next ? 'Activer' : 'Désactiver'} le tarif « ${tariff.libelle} » ?`)) return;

    this.togglingId = tariff.id;
    this.error = '';
    this.admin.updateTariff(tariff.id, {
      code: tariff.code,
      libelle: tariff.libelle,
      description: tariff.description || '',
      amount: tariff.amount,
      serviceFee: tariff.serviceFee ?? 0,
      ordre: tariff.ordre,
      actif: next
    }).subscribe({
      next: () => {
        this.success = `Tarif ${next ? 'activé' : 'désactivé'}`;
        this.togglingId = null;
        this.load();
      },
      error: err => {
        this.error = err.error?.message || 'Mise à jour impossible';
        this.togglingId = null;
      }
    });
  }

  remove(tariff: AdminTariffDto) {
    if (!this.canManage()) {
      this.error = 'Vous n\'avez pas la permission de gérer les tarifs.';
      return;
    }
    if (!confirm(`Supprimer le tarif « ${tariff.libelle} » ?`)) return;

    this.removingId = tariff.id;
    this.error = '';
    this.success = '';
    this.admin.deleteTariff(tariff.id).subscribe({
      next: () => {
        this.success = 'Tarif supprimé';
        this.removingId = null;
        if (this.viewingTariff?.id === tariff.id) this.closeView();
        this.load();
      },
      error: err => {
        this.error = err.error?.message || 'Suppression impossible';
        this.removingId = null;
      }
    });
  }

  totalAmount(tariff: AdminTariffDto): number {
    return (tariff.amount ?? 0) + (tariff.serviceFee ?? 0);
  }

  private toNonNegativeNumber(value: unknown, fallback = 0): number {
    if (value === null || value === undefined || value === '') return fallback;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return fallback;
    return n;
  }
}
