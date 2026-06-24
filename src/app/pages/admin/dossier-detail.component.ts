import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/admin.service';
import { AuthService } from '../../core/auth.service';
import {
  DOCUMENT_STATUS_LABELS,
  DOSSIER_STATUS_LABELS,
  DocumentDto,
  DossierDto
} from '../../models';

@Component({
  selector: 'app-admin-dossier-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, FormsModule],
  templateUrl: './dossier-detail.component.html',
  styleUrl: './dossier-detail.component.scss'
})
export class AdminDossierDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private admin = inject(AdminService);
  auth = inject(AuthService);

  dossier: DossierDto | null = null;
  error = '';
  success = '';
  rejectReason = '';
  statusLabels = DOSSIER_STATUS_LABELS;
  documentStatusLabels = DOCUMENT_STATUS_LABELS;

  selectedDocIds = new Set<number>();
  docActionLoading = false;
  dossierActionLoading = false;

  previewDoc: DocumentDto | null = null;
  previewUrl: string | null = null;
  previewLoading = false;
  previewError = '';

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.load(id);
  }

  ngOnDestroy() {
    this.revokePreviewUrl();
  }

  load(id: number) {
    this.admin.getDossier(id).subscribe({
      next: res => {
        this.dossier = res.data;
        this.selectedDocIds.clear();
      },
      error: err => this.error = err.error?.message || 'Dossier introuvable'
    });
  }

  get uploadedDocumentsCount() {
    return this.dossier?.documents.filter(d => this.hasFile(d)).length ?? 0;
  }

  get requiredDocumentsCount() {
    return this.dossier?.documents.length ?? 0;
  }

  get appointmentSummary() {
    if (!this.dossier?.appointment) return null;
    const a = this.dossier.appointment;
    return `${a.centerName} (${a.centerCity}) — ${a.appointmentDate} à ${a.appointmentTime}`;
  }

  canValidate() {
    return this.dossier && ['SUBMITTED', 'IN_REVIEW'].includes(this.dossier.status);
  }

  canManageDocuments() {
    const role = this.auth.role();
    return role === 'VALIDATEUR' || role === 'ADMIN' || role === 'SUPER_ADMIN';
  }

  canDeleteDossier() {
    return this.auth.isAdmin() && this.dossier
      && !['COMPLETED', 'PAID', 'APPOINTMENT_SCHEDULED'].includes(this.dossier.status);
  }

  validate() {
    if (!this.dossier) return;
    this.dossierActionLoading = true;
    this.admin.validateDossier(this.dossier.id).subscribe({
      next: res => {
        this.dossier = res.data;
        this.success = 'Dossier validé avec succès';
        this.dossierActionLoading = false;
      },
      error: err => {
        this.error = err.error?.message || 'Validation impossible';
        this.dossierActionLoading = false;
      }
    });
  }

  reject() {
    if (!this.dossier || !this.rejectReason.trim()) return;
    this.dossierActionLoading = true;
    this.admin.rejectDossier(this.dossier.id, this.rejectReason.trim()).subscribe({
      next: res => {
        this.dossier = res.data;
        this.success = 'Dossier rejeté';
        this.dossierActionLoading = false;
      },
      error: err => {
        this.error = err.error?.message || 'Rejet impossible';
        this.dossierActionLoading = false;
      }
    });
  }

  deleteDossier() {
    if (!this.dossier || !this.canDeleteDossier()) return;
    if (!confirm(`Supprimer définitivement le dossier ${this.dossier.referenceNumber} ?`)) return;

    this.dossierActionLoading = true;
    this.admin.deleteDossier(this.dossier.id).subscribe({
      next: () => {
        this.router.navigate(['/administration/dossiers']);
      },
      error: err => {
        this.error = err.error?.message || 'Suppression impossible';
        this.dossierActionLoading = false;
      }
    });
  }

  isDocSelected(doc: DocumentDto) {
    return this.selectedDocIds.has(doc.id);
  }

  toggleDocSelection(doc: DocumentDto) {
    if (!this.hasFile(doc)) return;
    if (this.selectedDocIds.has(doc.id)) {
      this.selectedDocIds.delete(doc.id);
    } else {
      this.selectedDocIds.add(doc.id);
    }
  }

  selectAllUploaded() {
    if (!this.dossier) return;
    this.dossier.documents.filter(d => this.hasFile(d)).forEach(d => this.selectedDocIds.add(d.id));
  }

  clearDocSelection() {
    this.selectedDocIds.clear();
  }

  validateSelectedDocuments() {
    this.runDocumentBulkAction('validate');
  }

  rejectSelectedDocuments() {
    this.runDocumentBulkAction('reject');
  }

  private runDocumentBulkAction(action: 'validate' | 'reject') {
    if (!this.dossier || !this.selectedDocIds.size) return;
    const ids = Array.from(this.selectedDocIds);
    this.docActionLoading = true;
    const request = action === 'validate'
      ? this.admin.validateDocuments(this.dossier.id, ids)
      : this.admin.rejectDocuments(this.dossier.id, ids);

    request.subscribe({
      next: res => {
        this.dossier = res.data;
        this.selectedDocIds.clear();
        this.success = action === 'validate'
          ? `${ids.length} document(s) validé(s)`
          : `${ids.length} document(s) rejeté(s)`;
        this.docActionLoading = false;
      },
      error: err => {
        this.error = err.error?.message || 'Action impossible sur les documents';
        this.docActionLoading = false;
      }
    });
  }

  deleteDocument(doc: DocumentDto) {
    if (!this.dossier || !this.auth.isAdmin()) return;
    if (!confirm(`Supprimer le fichier « ${doc.typeDocument.libelle} » ?`)) return;

    this.docActionLoading = true;
    this.admin.deleteDocument(this.dossier.id, doc.id).subscribe({
      next: res => {
        this.dossier = res.data;
        this.selectedDocIds.delete(doc.id);
        this.success = 'Document supprimé';
        this.docActionLoading = false;
      },
      error: err => {
        this.error = err.error?.message || 'Suppression impossible';
        this.docActionLoading = false;
      }
    });
  }

  statusClass(status: string) {
    return status.toLowerCase();
  }

  documentStatusClass(status: string) {
    return status.toLowerCase();
  }

  hasFile(doc: DocumentDto) {
    return !!doc.fileName;
  }

  formatFileSize(size?: number) {
    if (!size) return '—';
    if (size < 1024) return `${size} o`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} Ko`;
    return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
  }

  documentIcon(doc: DocumentDto) {
    const name = doc.fileName?.toLowerCase() || '';
    const type = doc.contentType?.toLowerCase() || '';
    if (type.includes('pdf') || name.endsWith('.pdf')) return 'pi-file-pdf';
    if (type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/.test(name)) return 'pi-image';
    return 'pi-file';
  }

  openDocument(doc: DocumentDto) {
    if (!this.dossier || !this.hasFile(doc)) return;

    this.previewDoc = doc;
    this.previewLoading = true;
    this.previewError = '';
    this.revokePreviewUrl();

    this.admin.getDocumentFile(this.dossier.id, doc.id).subscribe({
      next: blob => {
        this.previewUrl = URL.createObjectURL(blob);
        this.previewLoading = false;
      },
      error: () => {
        this.previewError = 'Impossible de charger le document.';
        this.previewLoading = false;
      }
    });
  }

  closePreview() {
    this.revokePreviewUrl();
    this.previewDoc = null;
    this.previewError = '';
    this.previewLoading = false;
  }

  isImagePreview() {
    if (!this.previewDoc) return false;
    const type = this.previewDoc.contentType?.toLowerCase() || '';
    const name = this.previewDoc.fileName?.toLowerCase() || '';
    return type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/.test(name);
  }

  isPdfPreview() {
    if (!this.previewDoc) return false;
    const type = this.previewDoc.contentType?.toLowerCase() || '';
    const name = this.previewDoc.fileName?.toLowerCase() || '';
    return type.includes('pdf') || name.endsWith('.pdf');
  }

  private revokePreviewUrl() {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = null;
    }
  }
}
