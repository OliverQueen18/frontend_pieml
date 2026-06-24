import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/admin.service';
import { AuthService } from '../../core/auth.service';
import { AdminDossierSummary, DOSSIER_STATUS_LABELS } from '../../models';

@Component({
  selector: 'app-admin-dossiers',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule],
  templateUrl: './dossiers.component.html',
  styleUrl: './dossiers.component.scss'
})
export class AdminDossiersComponent implements OnInit {
  private admin = inject(AdminService);
  auth = inject(AuthService);

  dossiers: AdminDossierSummary[] = [];
  statusFilter = '';
  referenceFilter = '';
  citizenFilter = '';
  chassisFilter = '';
  error = '';
  success = '';
  actionLoadingId: number | null = null;
  bulkLoading = false;
  rejectTarget: AdminDossierSummary | null = null;
  bulkRejectMode = false;
  rejectReason = '';
  selectedIds = new Set<number>();
  statusLabels = DOSSIER_STATUS_LABELS;

  readonly statusOptions = Object.keys(DOSSIER_STATUS_LABELS);

  ngOnInit() {
    this.load();
  }

  load() {
    this.error = '';
    this.selectedIds.clear();
    this.admin.listDossiers({
      status: this.statusFilter || undefined,
      reference: this.referenceFilter,
      citizen: this.citizenFilter,
      chassis: this.chassisFilter
    }).subscribe({
      next: res => this.dossiers = res.data,
      error: err => this.error = err.error?.message || 'Erreur de chargement'
    });
  }

  resetFilters() {
    this.statusFilter = '';
    this.referenceFilter = '';
    this.citizenFilter = '';
    this.chassisFilter = '';
    this.load();
  }

  canTreat(d: AdminDossierSummary): boolean {
    const role = this.auth.role();
    const canValidate = role === 'VALIDATEUR' || role === 'ADMIN' || role === 'SUPER_ADMIN';
    return canValidate && ['SUBMITTED', 'IN_REVIEW'].includes(d.status);
  }

  get treatableDossiers() {
    return this.dossiers.filter(d => this.canTreat(d));
  }

  get allTreatableSelected() {
    const treatable = this.treatableDossiers;
    return treatable.length > 0 && treatable.every(d => this.selectedIds.has(d.id));
  }

  isSelected(d: AdminDossierSummary) {
    return this.selectedIds.has(d.id);
  }

  toggleSelect(d: AdminDossierSummary) {
    if (!this.canTreat(d)) return;
    if (this.selectedIds.has(d.id)) {
      this.selectedIds.delete(d.id);
    } else {
      this.selectedIds.add(d.id);
    }
  }

  toggleSelectAll() {
    if (this.allTreatableSelected) {
      this.treatableDossiers.forEach(d => this.selectedIds.delete(d.id));
    } else {
      this.treatableDossiers.forEach(d => this.selectedIds.add(d.id));
    }
  }

  clearSelection() {
    this.selectedIds.clear();
  }

  validate(d: AdminDossierSummary) {
    if (!confirm(`Valider le dossier ${d.referenceNumber} ?`)) return;
    this.actionLoadingId = d.id;
    this.error = '';
    this.success = '';
    this.admin.validateDossier(d.id).subscribe({
      next: res => {
        this.updateRow(d.id, res.data.status);
        this.success = `Dossier ${d.referenceNumber} validé.`;
        this.actionLoadingId = null;
      },
      error: err => {
        this.error = err.error?.message || 'Validation impossible';
        this.actionLoadingId = null;
      }
    });
  }

  validateSelected() {
    const ids = Array.from(this.selectedIds);
    if (!ids.length) return;
    if (!confirm(`Valider ${ids.length} dossier(s) sélectionné(s) ?`)) return;

    this.bulkLoading = true;
    this.error = '';
    this.success = '';
    this.admin.validateDossiersBulk(ids).subscribe({
      next: res => {
        res.data.forEach(d => this.updateRow(d.id, d.status));
        this.success = `${ids.length} dossier(s) validé(s).`;
        this.selectedIds.clear();
        this.bulkLoading = false;
      },
      error: err => {
        this.error = err.error?.message || 'Validation groupée impossible';
        this.bulkLoading = false;
      }
    });
  }

  openReject(d: AdminDossierSummary) {
    this.bulkRejectMode = false;
    this.rejectTarget = d;
    this.rejectReason = '';
    this.error = '';
  }

  openBulkReject() {
    if (!this.selectedIds.size) return;
    this.bulkRejectMode = true;
    this.rejectTarget = { id: 0, referenceNumber: `${this.selectedIds.size} dossier(s)` } as AdminDossierSummary;
    this.rejectReason = '';
    this.error = '';
  }

  closeReject() {
    this.rejectTarget = null;
    this.bulkRejectMode = false;
    this.rejectReason = '';
  }

  confirmReject() {
    if (!this.rejectTarget || !this.rejectReason.trim()) return;

    if (this.bulkRejectMode) {
      const ids = Array.from(this.selectedIds);
      this.bulkLoading = true;
      this.error = '';
      this.success = '';
      this.admin.rejectDossiersBulk(ids, this.rejectReason.trim()).subscribe({
        next: res => {
          res.data.forEach(d => this.updateRow(d.id, d.status));
          this.success = `${ids.length} dossier(s) rejeté(s).`;
          this.selectedIds.clear();
          this.closeReject();
          this.bulkLoading = false;
        },
        error: err => {
          this.error = err.error?.message || 'Rejet groupé impossible';
          this.bulkLoading = false;
        }
      });
      return;
    }

    const d = this.rejectTarget;
    this.actionLoadingId = d.id;
    this.error = '';
    this.success = '';
    this.admin.rejectDossier(d.id, this.rejectReason.trim()).subscribe({
      next: () => {
        this.updateRow(d.id, 'REJECTED');
        this.success = `Dossier ${d.referenceNumber} rejeté.`;
        this.closeReject();
        this.actionLoadingId = null;
      },
      error: err => {
        this.error = err.error?.message || 'Rejet impossible';
        this.actionLoadingId = null;
      }
    });
  }

  documentsLabel(d: AdminDossierSummary) {
    return `${d.uploadedDocuments ?? 0}/${d.requiredDocuments ?? 0}`;
  }

  appointmentLabel(d: AdminDossierSummary) {
    if (!d.appointmentDate) return '—';
    const date = d.appointmentDate.split('T')[0];
    const parts = date.split('-');
    const formatted = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d.appointmentDate;
    return d.appointmentTime ? `${formatted} ${d.appointmentTime}` : formatted;
  }

  statusClass(status: string) {
    return status.toLowerCase();
  }

  private updateRow(id: number, status: string) {
    this.dossiers = this.dossiers.map(d => d.id === id ? { ...d, status } : d);
  }
}
