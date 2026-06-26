import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/admin.service';
import { AuthService } from '../../core/auth.service';
import { AdminDossierSummary, CenterDto, DOSSIER_STATUS_LABELS } from '../../models';

type DialogMode = 'reject' | 'complete' | 'cancel';
type FilterScope = 'all' | 'custom' | 'none';

const DOSSIER_FILTER_STATUSES = [
  'SUBMITTED',
  'IN_REVIEW',
  'PAYMENT_PENDING',
  'PAID',
  'VALIDATED',
  'APPOINTMENT_SCHEDULED',
  'IMMATRICULATION_IN_PROGRESS',
  'COMPLETED',
  'REJECTED'
] as const;

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

  allDossiers: AdminDossierSummary[] = [];
  dossiers: AdminDossierSummary[] = [];
  userCenters: CenterDto[] = [];

  referenceFilter = '';
  citizenFilter = '';
  chassisFilter = '';
  createdFrom = '';
  createdTo = '';
  appointmentFrom = '';
  appointmentTo = '';
  error = '';
  success = '';
  statusLabels = DOSSIER_STATUS_LABELS;

  readonly filterStatusOptions = DOSSIER_FILTER_STATUSES;

  statusScope: FilterScope = 'all';
  centersScope: FilterScope = 'all';
  selectedStatuses = new Set<string>();
  selectedCenterIds = new Set<number>();

  actionLoadingId: number | null = null;
  dialogMode: DialogMode | null = null;
  dialogTarget: AdminDossierSummary | null = null;
  dialogReason = '';
  dialogRegistrationNumber = '';

  ngOnInit() {
    this.loadUserCenters();
    this.load();
  }

  load() {
    this.error = '';
    this.admin.listDossiers({
      reference: this.referenceFilter,
      citizen: this.citizenFilter,
      chassis: this.chassisFilter
    }).subscribe({
      next: res => {
        this.allDossiers = res.data;
        this.applyFilters();
      },
      error: err => this.error = err.error?.message || 'Erreur de chargement'
    });
  }

  loadUserCenters() {
    const attachedIds = this.auth.centerIds();
    if (!attachedIds.length) {
      this.userCenters = [];
      return;
    }

    this.admin.listCenters().subscribe({
      next: res => {
        const active = (res.data || []).filter(c => c.active);
        const matched = active.filter(c => attachedIds.includes(c.id));
        this.userCenters = matched.length ? matched : this.centersFromAuth(attachedIds);
      },
      error: () => {
        this.userCenters = this.centersFromAuth(attachedIds);
      }
    });
  }

  get showCenterFilter(): boolean {
    return this.userCenters.length > 0 || this.auth.centerIds().length > 0;
  }

  private centersFromAuth(attachedIds: number[]): CenterDto[] {
    const names = this.auth.centerNames();
    return attachedIds.map((id, index) => {
      const label = names[index] ?? '';
      const cityMatch = label.match(/\(([^)]+)\)\s*$/);
      const city = cityMatch?.[1] ?? '';
      const name = cityMatch ? label.slice(0, cityMatch.index).trim() : (label || `Centre ${id}`);
      return {
        id,
        name,
        city,
        dailyCapacity: 0,
        active: true
      };
    });
  }

  applyFilters() {
    this.dossiers = this.allDossiers.filter(d => this.matchesFilters(d));
  }

  private matchesFilters(d: AdminDossierSummary): boolean {
    if (this.statusScope === 'none') return false;
    if (this.statusScope === 'custom' && !this.selectedStatuses.has(d.status)) return false;

    if (this.userCenters.length > 0) {
      if (this.centersScope === 'none') return false;
      if (this.centersScope === 'custom') {
        if (d.centerId == null || !this.selectedCenterIds.has(d.centerId)) return false;
      }
    }

    if (!this.matchesDateRange(d.createdAt, this.createdFrom, this.createdTo)) return false;
    if (!this.matchesDateRange(d.appointmentDate, this.appointmentFrom, this.appointmentTo)) return false;

    return true;
  }

  private matchesDateRange(value: string | undefined, from: string, to: string): boolean {
    if (!from && !to) return true;
    if (!value) return false;
    const datePart = value.split('T')[0];
    if (from && datePart < from) return false;
    if (to && datePart > to) return false;
    return true;
  }

  onCreatedDateChange() {
    if (this.createdFrom && this.createdTo && this.createdFrom > this.createdTo) {
      this.createdTo = this.createdFrom;
    }
    this.applyFilters();
  }

  onAppointmentDateChange() {
    if (this.appointmentFrom && this.appointmentTo && this.appointmentFrom > this.appointmentTo) {
      this.appointmentTo = this.appointmentFrom;
    }
    this.applyFilters();
  }

  get allStatusesSelected(): boolean {
    return this.statusScope === 'all';
  }

  get allCentersSelected(): boolean {
    return this.centersScope === 'all';
  }

  isStatusSelected(status: string): boolean {
    if (this.statusScope === 'all') return true;
    if (this.statusScope === 'none') return false;
    return this.selectedStatuses.has(status);
  }

  isCenterSelected(centerId: number): boolean {
    if (this.centersScope === 'all') return true;
    if (this.centersScope === 'none') return false;
    return this.selectedCenterIds.has(centerId);
  }

  onAllStatusesChange(checked: boolean) {
    if (checked) {
      this.statusScope = 'all';
      this.selectedStatuses.clear();
    } else {
      this.statusScope = 'custom';
      this.selectedStatuses.clear();
      this.filterStatusOptions.forEach(s => this.selectedStatuses.add(s));
    }
    this.applyFilters();
  }

  onStatusChange(status: string, checked: boolean) {
    if (this.statusScope === 'all') return;
    if (checked) {
      this.selectedStatuses.add(status);
      this.statusScope = 'custom';
    } else {
      this.selectedStatuses.delete(status);
      if (this.selectedStatuses.size === 0) {
        this.statusScope = 'none';
      }
    }
    this.applyFilters();
  }

  clearStatusFilters() {
    this.statusScope = 'none';
    this.selectedStatuses.clear();
    this.applyFilters();
  }

  onAllCentersChange(checked: boolean) {
    if (checked) {
      this.centersScope = 'all';
      this.selectedCenterIds.clear();
    } else {
      this.centersScope = 'custom';
      this.selectedCenterIds.clear();
      this.userCenters.forEach(c => this.selectedCenterIds.add(c.id));
    }
    this.applyFilters();
  }

  onCenterChange(centerId: number, checked: boolean) {
    if (this.centersScope === 'all') return;
    if (checked) {
      this.selectedCenterIds.add(centerId);
      this.centersScope = 'custom';
    } else {
      this.selectedCenterIds.delete(centerId);
      if (this.selectedCenterIds.size === 0) {
        this.centersScope = 'none';
      }
    }
    this.applyFilters();
  }

  clearCenterFilters() {
    this.centersScope = 'none';
    this.selectedCenterIds.clear();
    this.applyFilters();
  }

  resetFilters() {
    this.referenceFilter = '';
    this.citizenFilter = '';
    this.chassisFilter = '';
    this.createdFrom = '';
    this.createdTo = '';
    this.appointmentFrom = '';
    this.appointmentTo = '';
    this.statusScope = 'all';
    this.centersScope = 'all';
    this.selectedStatuses.clear();
    this.selectedCenterIds.clear();
    this.load();
  }

  private canActAsStaff() {
    const role = this.auth.role();
    return role === 'VALIDATEUR' || role === 'ADMIN' || role === 'SUPER_ADMIN'
      || role === 'IMMATRICULATEUR';
  }

  canTreat(d: AdminDossierSummary): boolean {
    if (!this.canActAsStaff()) return false;
    return ['PAID', 'VALIDATED', 'APPOINTMENT_SCHEDULED', 'IMMATRICULATION_IN_PROGRESS'].includes(d.status);
  }

  canRejectBeforeImmatriculation(d: AdminDossierSummary): boolean {
    const role = this.auth.role();
    const canValidate = role === 'VALIDATEUR' || role === 'ADMIN' || role === 'SUPER_ADMIN';
    return canValidate && ['PAID', 'VALIDATED', 'APPOINTMENT_SCHEDULED'].includes(d.status);
  }

  canStartImmatriculation(d: AdminDossierSummary): boolean {
    return this.canActAsStaff() && d.status === 'APPOINTMENT_SCHEDULED';
  }

  canCompleteImmatriculation(d: AdminDossierSummary): boolean {
    return this.canActAsStaff() && d.status === 'IMMATRICULATION_IN_PROGRESS';
  }

  canCancelImmatriculation(d: AdminDossierSummary): boolean {
    return this.canCompleteImmatriculation(d);
  }

  treatmentHint(d: AdminDossierSummary): string {
    switch (d.status) {
      case 'PAID': return 'Valider les documents';
      case 'VALIDATED': return 'Confirmer le RDV';
      case 'APPOINTMENT_SCHEDULED': return 'Démarrer l\'immatriculation';
      case 'IMMATRICULATION_IN_PROGRESS': return 'Finaliser l\'immatriculation';
      default: return '';
    }
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

  startImmatriculation(d: AdminDossierSummary) {
    if (!this.canStartImmatriculation(d)) return;
    if (!confirm(`Démarrer l'immatriculation pour ${d.referenceNumber} ?`)) return;
    this.actionLoadingId = d.id;
    this.error = '';
    this.admin.startImmatriculation(d.id).subscribe({
      next: () => {
        this.success = `Immatriculation démarrée — ${d.referenceNumber}`;
        this.actionLoadingId = null;
        this.load();
      },
      error: err => {
        this.error = err.error?.message || 'Action impossible';
        this.actionLoadingId = null;
      }
    });
  }

  openReject(d: AdminDossierSummary) {
    this.dialogMode = 'reject';
    this.dialogTarget = d;
    this.dialogReason = '';
  }

  openComplete(d: AdminDossierSummary) {
    this.dialogMode = 'complete';
    this.dialogTarget = d;
    this.dialogRegistrationNumber = '';
  }

  openCancel(d: AdminDossierSummary) {
    this.dialogMode = 'cancel';
    this.dialogTarget = d;
    this.dialogReason = '';
  }

  closeDialog() {
    this.dialogMode = null;
    this.dialogTarget = null;
    this.dialogReason = '';
    this.dialogRegistrationNumber = '';
  }

  confirmDialog() {
    if (!this.dialogTarget || !this.dialogMode) return;

    if (this.dialogMode === 'complete') {
      const number = this.dialogRegistrationNumber.trim();
      if (!number) return;
      this.actionLoadingId = this.dialogTarget.id;
      this.error = '';
      this.admin.completeImmatriculation(this.dialogTarget.id, number).subscribe({
        next: () => {
          this.success = `Dossier ${this.dialogTarget!.referenceNumber} immatriculé`;
          this.actionLoadingId = null;
          this.closeDialog();
          this.load();
        },
        error: err => {
          this.error = err.error?.message || 'Finalisation impossible';
          this.actionLoadingId = null;
        }
      });
      return;
    }

    const reason = this.dialogReason.trim();
    if (!reason) return;
    this.actionLoadingId = this.dialogTarget.id;
    this.error = '';

    const request = this.dialogMode === 'cancel'
      ? this.admin.cancelImmatriculation(this.dialogTarget.id, reason)
      : this.admin.rejectDossier(this.dialogTarget.id, reason);

    request.subscribe({
      next: () => {
        this.success = this.dialogMode === 'cancel'
          ? `Immatriculation annulée — ${this.dialogTarget!.referenceNumber}`
          : `Dossier ${this.dialogTarget!.referenceNumber} rejeté`;
        this.actionLoadingId = null;
        this.closeDialog();
        this.load();
      },
      error: err => {
        this.error = err.error?.message || 'Action impossible';
        this.actionLoadingId = null;
      }
    });
  }
}
