import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/admin.service';
import { AuthService } from '../../core/auth.service';
import {
  DOCUMENT_STATUS_LABELS,
  DOSSIER_STATUS_LABELS,
  CenterAvailabilityDto,
  CenterDto,
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
  cancelReason = '';
  registrationNumber = '';
  statusLabels = DOSSIER_STATUS_LABELS;
  documentStatusLabels = DOCUMENT_STATUS_LABELS;

  selectedDocIds = new Set<number>();
  docActionLoading = false;
  dossierActionLoading = false;

  previewDoc: DocumentDto | null = null;
  previewUrl: string | null = null;
  previewLoading = false;
  previewError = '';

  plateForm = {
    plateNumber: '',
    deliveryDate: '',
    collectorFirstName: '',
    collectorLastName: '',
    collectorPhone: '',
    collectorAddress: ''
  };
  plateAttachment: File | null = null;
  plateSaving = false;
  platePreviewLoading = false;
  platePreviewUrl: string | null = null;
  platePreviewError = '';

  centers: CenterDto[] = [];
  availability: CenterAvailabilityDto | null = null;
  loadingCenters = false;
  loadingAvailability = false;
  appointmentForm = {
    centerId: null as number | null,
    appointmentDate: '',
    appointmentTime: ''
  };

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.load(id);
  }

  ngOnDestroy() {
    this.revokePreviewUrl();
    this.revokePlatePreviewUrl();
  }

  load(id: number) {
    this.admin.getDossier(id).subscribe({
      next: res => {
        this.dossier = res.data;
        this.selectedDocIds.clear();
        this.patchPlateForm();
        this.patchAppointmentForm();
        if (this.canConfirmAppointment()) {
          this.loadCenters();
        }
      },
      error: err => this.error = err.error?.message || 'Dossier introuvable'
    });
  }

  private patchPlateForm() {
    const p = this.dossier?.plateDelivery;
    const registrationNumber = this.dossier?.vehicle?.registrationNumber?.trim() || '';
    if (!p) {
      this.plateForm = {
        plateNumber: registrationNumber,
        deliveryDate: '',
        collectorFirstName: '',
        collectorLastName: '',
        collectorPhone: '',
        collectorAddress: ''
      };
      return;
    }
    this.plateForm = {
      plateNumber: p.plateNumber,
      deliveryDate: p.deliveryDate,
      collectorFirstName: p.collectorFirstName,
      collectorLastName: p.collectorLastName,
      collectorPhone: p.collectorPhone,
      collectorAddress: p.collectorAddress
    };
  }

  private patchAppointmentForm() {
    const d = this.dossier;
    if (!d) return;

    const centerId = d.appointment?.centerId
      ?? d.processingCenter?.id
      ?? d.payment?.centerId
      ?? null;

    this.appointmentForm = {
      centerId,
      appointmentDate: d.appointment?.appointmentDate?.split('T')[0] ?? '',
      appointmentTime: d.appointment?.appointmentTime ?? ''
    };

    if (centerId) {
      this.loadAvailability(centerId);
    }
  }

  get uploadedDocumentsCount() {
    return this.dossier?.documents.filter(d => this.hasFile(d)).length ?? 0;
  }

  get appointmentSummary() {
    if (!this.dossier?.appointment) return null;
    const a = this.dossier.appointment;
    return `${a.centerName} (${a.centerCity}) — ${a.appointmentDate} à ${a.appointmentTime}`;
  }

  get validatedRequiredDocumentsCount() {
    return this.dossier?.documents.filter(d =>
      d.typeDocument.obligatoire && d.status === 'VALIDATED'
    ).length ?? 0;
  }

  get requiredDocumentsCount() {
    return this.dossier?.documents.filter(d => d.typeDocument.obligatoire).length ?? 0;
  }

  get allRequiredDocumentsValidated() {
    const required = this.dossier?.documents.filter(d => d.typeDocument.obligatoire) ?? [];
    return required.length > 0
      && required.every(d => this.hasFile(d) && d.status === 'VALIDATED');
  }

  canTreatAsValidator() {
    const role = this.auth.role();
    return role === 'VALIDATEUR' || role === 'ADMIN' || role === 'SUPER_ADMIN';
  }

  canManageDocuments() {
    return this.canTreatAsValidator() && this.dossier?.status === 'PAID';
  }

  canValidateDossier() {
    return this.canTreatAsValidator()
      && this.dossier?.status === 'PAID'
      && this.allRequiredDocumentsValidated;
  }

  canRejectBeforeImmatriculation() {
    return this.canTreatAsValidator()
      && !!this.dossier
      && ['PAID', 'VALIDATED', 'APPOINTMENT_SCHEDULED'].includes(this.dossier.status);
  }

  canRejectDossier() {
    return this.canRejectBeforeImmatriculation();
  }

  canConfirmAppointment() {
    return this.canTreatAsValidator() && this.dossier?.status === 'VALIDATED';
  }

  canStartImmatriculation() {
    const role = this.auth.role();
    const canAct = role === 'VALIDATEUR' || role === 'ADMIN' || role === 'SUPER_ADMIN'
      || role === 'IMMATRICULATEUR';
    return canAct && this.dossier?.status === 'APPOINTMENT_SCHEDULED';
  }

  canCompleteImmatriculation() {
    const role = this.auth.role();
    const canAct = role === 'VALIDATEUR' || role === 'ADMIN' || role === 'SUPER_ADMIN'
      || role === 'IMMATRICULATEUR';
    return canAct && this.dossier?.status === 'IMMATRICULATION_IN_PROGRESS';
  }

  canCancelImmatriculation() {
    return this.canCompleteImmatriculation();
  }

  canDeleteDossier() {
    return this.auth.isAdmin() && this.dossier
      && !['COMPLETED', 'PAID', 'VALIDATED', 'APPOINTMENT_SCHEDULED', 'IMMATRICULATION_IN_PROGRESS'].includes(this.dossier.status);
  }

  canManagePlateDelivery() {
    const role = this.auth.role();
    return !!this.dossier && (role === 'IMMATRICULATEUR' || this.auth.isAdmin())
      && this.dossier.status === 'COMPLETED';
  }

  loadCenters() {
    this.loadingCenters = true;
    this.admin.listCenters().subscribe({
      next: res => {
        this.centers = (res.data || []).filter(c => c.active);
        this.loadingCenters = false;
      },
      error: () => {
        this.error = 'Impossible de charger les centres';
        this.loadingCenters = false;
      }
    });
  }

  onAppointmentCenterChange() {
    const centerId = this.appointmentForm.centerId;
    this.appointmentForm.appointmentDate = '';
    this.appointmentForm.appointmentTime = '';
    this.availability = null;
    if (centerId) {
      this.loadAvailability(centerId);
    }
  }

  onAppointmentDateChange() {
    this.appointmentForm.appointmentTime = '';
  }

  private loadAvailability(centerId: number) {
    this.loadingAvailability = true;
    this.admin.getCenterAvailability(centerId).subscribe({
      next: res => {
        this.availability = res.data;
        this.loadingAvailability = false;
      },
      error: () => {
        this.availability = null;
        this.loadingAvailability = false;
      }
    });
  }

  get availableAppointmentDates() {
    return this.availability?.availableDays ?? [];
  }

  get appointmentTimeOptions(): string[] {
    if (!this.availability || !this.appointmentForm.appointmentDate) return [];
    const opening = this.availability.openingTime;
    const closing = this.availability.closingTime;
    const slots: string[] = [];
    const [openH, openM] = opening.split(':').map(Number);
    const [closeH, closeM] = closing.split(':').map(Number);
    let minutes = openH * 60 + openM;
    const end = closeH * 60 + closeM;
    while (minutes <= end) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      minutes += 30;
    }
    return slots;
  }

  onPlateAttachmentSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.plateAttachment = input.files?.[0] ?? null;
  }

  savePlateDelivery() {
    if (!this.dossier) return;
    const f = this.plateForm;
    if (!f.plateNumber.trim() || !f.deliveryDate || !f.collectorFirstName.trim()
      || !f.collectorLastName.trim() || !f.collectorPhone.trim() || !f.collectorAddress.trim()) {
      this.error = 'Tous les champs de remise de plaque sont obligatoires.';
      return;
    }
    if (!this.dossier.plateDelivery && !this.plateAttachment) {
      this.error = 'La pièce justificative est obligatoire.';
      return;
    }

    const fd = new FormData();
    fd.append('plateNumber', f.plateNumber.trim());
    fd.append('deliveryDate', f.deliveryDate);
    fd.append('collectorFirstName', f.collectorFirstName.trim());
    fd.append('collectorLastName', f.collectorLastName.trim());
    fd.append('collectorPhone', f.collectorPhone.trim());
    fd.append('collectorAddress', f.collectorAddress.trim());
    if (this.plateAttachment) {
      fd.append('file', this.plateAttachment);
    }

    this.plateSaving = true;
    this.error = '';
    this.admin.savePlateDelivery(this.dossier.id, fd).subscribe({
      next: res => {
        this.dossier = res.data;
        this.plateAttachment = null;
        this.patchPlateForm();
        this.success = 'Remise de plaque enregistrée';
        this.plateSaving = false;
      },
      error: err => {
        this.error = err.error?.message || 'Enregistrement impossible';
        this.plateSaving = false;
      }
    });
  }

  openPlateAttachment() {
    if (!this.dossier?.plateDelivery?.fileName) return;
    this.platePreviewLoading = true;
    this.platePreviewError = '';
    this.revokePlatePreviewUrl();
    this.admin.getPlateDeliveryFile(this.dossier.id).subscribe({
      next: blob => {
        this.platePreviewUrl = URL.createObjectURL(blob);
        this.platePreviewLoading = false;
      },
      error: () => {
        this.platePreviewError = 'Impossible de charger la pièce justificative.';
        this.platePreviewLoading = false;
      }
    });
  }

  closePlatePreview() {
    this.revokePlatePreviewUrl();
    this.platePreviewError = '';
    this.platePreviewLoading = false;
  }

  isPlateImagePreview() {
    const contentType = this.dossier?.plateDelivery?.contentType?.toLowerCase() || '';
    const name = this.dossier?.plateDelivery?.fileName?.toLowerCase() || '';
    return contentType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/.test(name);
  }

  isPlatePdfPreview() {
    const contentType = this.dossier?.plateDelivery?.contentType?.toLowerCase() || '';
    const name = this.dossier?.plateDelivery?.fileName?.toLowerCase() || '';
    return contentType.includes('pdf') || name.endsWith('.pdf');
  }

  private revokePlatePreviewUrl() {
    if (this.platePreviewUrl) {
      URL.revokeObjectURL(this.platePreviewUrl);
      this.platePreviewUrl = null;
    }
  }

  validate() {
    if (!this.dossier || !this.canValidateDossier()) return;
    if (!confirm(`Valider le dossier ${this.dossier.referenceNumber} ?`)) return;
    this.dossierActionLoading = true;
    this.admin.validateDossier(this.dossier.id).subscribe({
      next: res => {
        this.dossier = res.data;
        this.success = 'Dossier validé — confirmez le rendez-vous de contrôle physique';
        this.dossierActionLoading = false;
        this.patchAppointmentForm();
        this.loadCenters();
      },
      error: err => {
        this.error = err.error?.message || 'Validation impossible';
        this.dossierActionLoading = false;
      }
    });
  }

  confirmAppointment() {
    if (!this.dossier || !this.canConfirmAppointment()) return;
    const f = this.appointmentForm;
    if (!f.centerId || !f.appointmentDate || !f.appointmentTime) {
      this.error = 'Centre, date et heure sont obligatoires';
      return;
    }
    this.dossierActionLoading = true;
    this.error = '';
    this.admin.confirmAppointment(this.dossier.id, {
      centerId: f.centerId,
      appointmentDate: f.appointmentDate,
      appointmentTime: f.appointmentTime
    }).subscribe({
      next: res => {
        this.dossier = res.data;
        this.success = 'Rendez-vous de contrôle physique confirmé';
        this.dossierActionLoading = false;
      },
      error: err => {
        this.error = err.error?.message || 'Confirmation impossible';
        this.dossierActionLoading = false;
      }
    });
  }

  startImmatriculation() {
    if (!this.dossier || !this.canStartImmatriculation()) return;
    if (!confirm(`Démarrer l'immatriculation pour ${this.dossier.referenceNumber} ?`)) return;
    this.dossierActionLoading = true;
    this.admin.startImmatriculation(this.dossier.id).subscribe({
      next: res => {
        this.dossier = res.data;
        this.success = 'Immatriculation démarrée — saisissez le numéro d\'immatriculation pour finaliser';
        this.dossierActionLoading = false;
      },
      error: err => {
        this.error = err.error?.message || 'Action impossible';
        this.dossierActionLoading = false;
      }
    });
  }

  completeImmatriculation() {
    if (!this.dossier || !this.canCompleteImmatriculation()) return;
    const number = this.registrationNumber.trim();
    if (!number) {
      this.error = 'Le numéro d\'immatriculation est obligatoire';
      return;
    }
    this.dossierActionLoading = true;
    this.error = '';
    this.admin.completeImmatriculation(this.dossier.id, number).subscribe({
      next: res => {
        this.dossier = res.data;
        this.registrationNumber = '';
        this.patchPlateForm();
        this.success = 'Dossier immatriculé avec succès';
        this.dossierActionLoading = false;
      },
      error: err => {
        this.error = err.error?.message || 'Finalisation impossible';
        this.dossierActionLoading = false;
      }
    });
  }

  cancelImmatriculation() {
    if (!this.dossier || !this.canCancelImmatriculation() || !this.cancelReason.trim()) return;
    this.dossierActionLoading = true;
    this.admin.cancelImmatriculation(this.dossier.id, this.cancelReason.trim()).subscribe({
      next: res => {
        this.dossier = res.data;
        this.cancelReason = '';
        this.success = 'Immatriculation annulée';
        this.dossierActionLoading = false;
      },
      error: err => {
        this.error = err.error?.message || 'Annulation impossible';
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

  validateDocument(doc: DocumentDto) {
    if (!this.dossier || !this.canManageDocuments() || !this.hasFile(doc)) return;
    this.runDocumentAction('validate', [doc.id]);
  }

  rejectDocument(doc: DocumentDto) {
    if (!this.dossier || !this.canManageDocuments() || !this.hasFile(doc)) return;
    this.runDocumentAction('reject', [doc.id]);
  }

  private runDocumentAction(action: 'validate' | 'reject', ids: number[]) {
    if (!this.dossier) return;
    this.docActionLoading = true;
    const request = action === 'validate'
      ? this.admin.validateDocuments(this.dossier.id, ids)
      : this.admin.rejectDocuments(this.dossier.id, ids);

    request.subscribe({
      next: res => {
        this.dossier = res.data;
        ids.forEach(id => this.selectedDocIds.delete(id));
        this.success = action === 'validate' ? 'Document validé' : 'Document rejeté';
        this.docActionLoading = false;
      },
      error: err => {
        this.error = err.error?.message || 'Action impossible sur le document';
        this.docActionLoading = false;
      }
    });
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
