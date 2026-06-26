import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/admin.service';
import { AuthService } from '../../core/auth.service';
import { PERMISSIONS } from '../../core/permissions';
import {
  AdminProfileChangeRequestDto,
  PROFILE_CHANGE_FIELD_LABELS,
  PROFILE_CHANGE_STATUS_LABELS,
  ProfileChangeRequestStatus
} from '../../models';

type StatusFilter = 'ALL' | ProfileChangeRequestStatus;

@Component({
  selector: 'app-admin-profile-change-requests',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule],
  templateUrl: './profile-change-requests.component.html',
  styleUrl: './profile-change-requests.component.scss'
})
export class AdminProfileChangeRequestsComponent implements OnInit, OnDestroy {
  private admin = inject(AdminService);
  auth = inject(AuthService);
  readonly P = PERMISSIONS;

  requests: AdminProfileChangeRequestDto[] = [];
  searchQuery = '';
  statusFilter: StatusFilter = 'PENDING';
  error = '';
  success = '';
  loading = false;
  viewingItem: AdminProfileChangeRequestDto | null = null;
  rejectReason = '';
  processingId: number | null = null;
  attachmentPreviewUrl: string | null = null;
  attachmentPreviewLoading = false;
  attachmentPreviewError = '';
  fieldLabels = PROFILE_CHANGE_FIELD_LABELS;
  statusLabels = PROFILE_CHANGE_STATUS_LABELS;

  statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'PENDING', label: 'En attente' },
    { value: 'APPROVED', label: 'Approuvées' },
    { value: 'REJECTED', label: 'Rejetées' },
    { value: 'ALL', label: 'Toutes' }
  ];

  ngOnInit() {
    this.load();
  }

  ngOnDestroy() {
    this.revokeAttachmentPreview();
  }

  get canManage(): boolean {
    return this.auth.hasPermission(PERMISSIONS.CITIZENS_MANAGE);
  }

  get filteredRequests(): AdminProfileChangeRequestDto[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.requests;
    return this.requests.filter(r => {
      const name = `${r.citizenFirstName} ${r.citizenLastName}`.toLowerCase();
      return name.includes(q)
        || r.citizenEmail.toLowerCase().includes(q)
        || r.citizenNina.toLowerCase().includes(q)
        || (this.fieldLabels[r.field] || r.field).toLowerCase().includes(q)
        || r.requestedValue.toLowerCase().includes(q)
        || r.currentValue.toLowerCase().includes(q);
    });
  }

  load() {
    this.loading = true;
    this.error = '';
    const status = this.statusFilter === 'ALL' ? undefined : this.statusFilter;
    this.admin.listProfileChangeRequests(status).subscribe({
      next: res => {
        this.requests = res.data;
        this.loading = false;
      },
      error: err => {
        this.error = err.error?.message || 'Erreur de chargement';
        this.loading = false;
      }
    });
  }

  onStatusFilterChange() {
    this.load();
  }

  citizenName(item: AdminProfileChangeRequestDto): string {
    return `${item.citizenFirstName} ${item.citizenLastName}`;
  }

  statusClass(status: ProfileChangeRequestStatus): string {
    if (status === 'PENDING') return 'badge-orange';
    if (status === 'APPROVED') return 'badge-green';
    return 'badge-red';
  }

  openView(item: AdminProfileChangeRequestDto) {
    this.viewingItem = item;
    this.rejectReason = '';
    this.error = '';
    this.success = '';
    this.loadAttachmentPreview(item);
  }

  closeView() {
    this.revokeAttachmentPreview();
    this.viewingItem = null;
    this.rejectReason = '';
    this.attachmentPreviewError = '';
    this.attachmentPreviewLoading = false;
  }

  isImagePreview(): boolean {
    const name = this.viewingItem?.fileName?.toLowerCase() || '';
    return /\.(jpg|jpeg|png|gif|webp)$/.test(name);
  }

  isPdfPreview(): boolean {
    const name = this.viewingItem?.fileName?.toLowerCase() || '';
    return name.endsWith('.pdf');
  }

  retryAttachmentPreview() {
    if (this.viewingItem) {
      this.loadAttachmentPreview(this.viewingItem);
    }
  }

  downloadFile(item: AdminProfileChangeRequestDto) {
    const download = (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.fileName || 'piece-justificative';
      a.click();
      URL.revokeObjectURL(url);
    };

    if (this.viewingItem?.id === item.id && this.attachmentPreviewUrl) {
      fetch(this.attachmentPreviewUrl).then(r => r.blob()).then(download);
      return;
    }

    this.admin.getProfileChangeRequestFile(item.id).subscribe({
      next: download,
      error: () => this.error = 'Impossible de télécharger la pièce justificative'
    });
  }

  approve(item: AdminProfileChangeRequestDto) {
    if (!confirm(`Approuver la modification « ${this.fieldLabels[item.field]} » pour ${this.citizenName(item)} ?`)) {
      return;
    }
    this.processingId = item.id;
    this.error = '';
    this.success = '';
    this.admin.approveProfileChangeRequest(item.id).subscribe({
      next: () => {
        this.success = 'Réclamation approuvée — le profil citoyen a été mis à jour';
        this.processingId = null;
        this.closeView();
        this.load();
      },
      error: err => {
        this.error = err.error?.message || 'Erreur lors de l\'approbation';
        this.processingId = null;
      }
    });
  }

  reject(item: AdminProfileChangeRequestDto) {
    if (!this.rejectReason.trim()) {
      this.error = 'Indiquez un motif de rejet';
      return;
    }
    if (!confirm(`Rejeter la réclamation de ${this.citizenName(item)} ?`)) {
      return;
    }
    this.processingId = item.id;
    this.error = '';
    this.success = '';
    this.admin.rejectProfileChangeRequest(item.id, this.rejectReason.trim()).subscribe({
      next: () => {
        this.success = 'Réclamation rejetée';
        this.processingId = null;
        this.closeView();
        this.load();
      },
      error: err => {
        this.error = err.error?.message || 'Erreur lors du rejet';
        this.processingId = null;
      }
    });
  }

  private loadAttachmentPreview(item: AdminProfileChangeRequestDto) {
    this.attachmentPreviewLoading = true;
    this.attachmentPreviewError = '';
    this.revokeAttachmentPreview();

    this.admin.getProfileChangeRequestFile(item.id).subscribe({
      next: blob => {
        this.attachmentPreviewUrl = URL.createObjectURL(blob);
        this.attachmentPreviewLoading = false;
      },
      error: () => {
        this.attachmentPreviewError = 'Impossible de charger la pièce justificative.';
        this.attachmentPreviewLoading = false;
      }
    });
  }

  private revokeAttachmentPreview() {
    if (this.attachmentPreviewUrl) {
      URL.revokeObjectURL(this.attachmentPreviewUrl);
      this.attachmentPreviewUrl = null;
    }
  }
}
