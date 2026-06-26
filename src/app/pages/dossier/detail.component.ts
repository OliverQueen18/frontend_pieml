import { Component, OnDestroy, OnInit, inject } from '@angular/core';

import { ActivatedRoute, RouterLink } from '@angular/router';

import { CommonModule, DatePipe } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { DossierService } from '../../core/dossier.service';

import {

  DOCUMENT_STATUS_LABELS,

  DOSSIER_STATUS_LABELS,

  VEHICLE_DECLARATION_TYPE_LABELS,

  AppointmentDto,

  DocumentDto,

  DossierDto,

  VehicleDeclarationType

} from '../../models';

import { DossierQrComponent } from '../../shared/dossier-qr.component';

import { OsmMapViewComponent } from '../../shared/osm-map-view.component';



@Component({

  selector: 'app-dossier-detail',

  standalone: true,

  imports: [CommonModule, RouterLink, DatePipe, FormsModule, DossierQrComponent, OsmMapViewComponent],

  templateUrl: './detail.component.html',

  styleUrl: './detail.component.scss'

})

export class DossierDetailComponent implements OnInit, OnDestroy {

  private route = inject(ActivatedRoute);

  private dossierService = inject(DossierService);



  dossier: DossierDto | null = null;

  documentStatusLabels = DOCUMENT_STATUS_LABELS;

  declarationTypeLabels = VEHICLE_DECLARATION_TYPE_LABELS;

  declarationTypes: VehicleDeclarationType[] = ['STOLEN', 'LOST', 'SOLD'];



  selectedDeclarationType: VehicleDeclarationType | null = null;

  declarationFile: File | null = null;

  declareLoading = false;

  declareError = '';



  previewDoc: DocumentDto | null = null;

  previewUrl: string | null = null;

  previewLoading = false;

  previewError = '';

  previewIsDeclaration = false;
  previewIsPlateDelivery = false;
  previewPlateContentType = '';

  previewDeclarationContentType = '';



  ngOnInit() {

    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.loadDossier(id);

  }



  ngOnDestroy() {

    this.revokePreviewUrl();

  }



  loadDossier(id: number) {

    this.dossierService.getDossier(id).subscribe(res => this.dossier = res.data);

  }



  statusLabel(s: string) { return DOSSIER_STATUS_LABELS[s] || s; }



  canDeclare(): boolean {

    return this.dossier?.status === 'COMPLETED' && !this.dossier.vehicleDeclaration;

  }



  hasDeclaration(): boolean {

    return !!this.dossier?.vehicleDeclaration;

  }



  declarationLabel(type: VehicleDeclarationType): string {

    return this.declarationTypeLabels[type];

  }



  onDeclarationFileSelected(event: Event) {

    const input = event.target as HTMLInputElement;

    this.declarationFile = input.files?.[0] ?? null;

    this.declareError = '';

  }



  submitDeclaration() {

    if (!this.dossier || !this.selectedDeclarationType) {

      this.declareError = 'Veuillez sélectionner un type de déclaration';

      return;

    }

    if (!this.declarationFile) {

      this.declareError = 'La pièce justificative est obligatoire';

      return;

    }



    this.declareLoading = true;

    this.declareError = '';

    this.dossierService.declareVehicle(

      this.dossier.id,

      this.selectedDeclarationType,

      this.declarationFile

    ).subscribe({

      next: res => {

        this.dossier = res.data;

        this.selectedDeclarationType = null;

        this.declarationFile = null;

        this.declareLoading = false;

      },

      error: err => {

        this.declareError = err.error?.message || 'Impossible d\'enregistrer la déclaration';

        this.declareLoading = false;

      }

    });

  }



  centerMapQuery(appt: AppointmentDto): string {

    return [appt.centerAddress, appt.centerCity, appt.centerName, 'Mali'].filter(Boolean).join(', ');

  }



  centerMapLink(appt: AppointmentDto): string | null {

    if (appt.centerLatitude != null && appt.centerLongitude != null) {

      const lat = appt.centerLatitude;

      const lng = appt.centerLongitude;

      return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;

    }

    const query = this.centerMapQuery(appt);

    if (!query) return null;

    return `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`;

  }



  hasFile(doc: DocumentDto) {

    return !!doc.fileName;

  }



  documentIcon(doc: DocumentDto) {

    const name = doc.fileName?.toLowerCase() || '';

    const type = doc.contentType?.toLowerCase() || '';

    if (type.includes('pdf') || name.endsWith('.pdf')) return 'pi-file-pdf';

    if (type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/.test(name)) return 'pi-image';

    return 'pi-file';

  }



  documentStatusClass(status: string) {

    switch (status) {

      case 'UPLOADED': return 'uploaded';

      case 'VALIDATED': return 'validated';

      case 'REJECTED': return 'rejected';

      default: return 'pending';

    }

  }



  formatFileSize(size?: number) {

    if (!size) return '';

    if (size < 1024) return `${size} o`;

    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} Ko`;

    return `${(size / (1024 * 1024)).toFixed(1)} Mo`;

  }



  openDocument(doc: DocumentDto) {

    if (!this.dossier || !this.hasFile(doc)) return;

    this.previewIsDeclaration = false;
    this.previewIsPlateDelivery = false;

    this.previewDoc = doc;

    this.loadPreviewBlob(this.dossierService.getDocumentFile(this.dossier.id, doc.id), doc.contentType);

  }



  openDeclarationFile() {

    if (!this.dossier?.vehicleDeclaration) return;

    const decl = this.dossier.vehicleDeclaration;

    this.previewIsDeclaration = true;
    this.previewIsPlateDelivery = false;

    this.previewDoc = null;

    this.previewDeclarationContentType = decl.contentType || '';

    this.loadPreviewBlob(this.dossierService.getDeclarationFile(this.dossier.id), decl.contentType);

  }



  openPlateDeliveryFile() {
    if (!this.dossier?.plateDelivery) return;
    const pd = this.dossier.plateDelivery;
    this.previewIsDeclaration = false;
    this.previewIsPlateDelivery = true;
    this.previewDoc = null;
    this.previewPlateContentType = pd.contentType || '';
    this.loadPreviewBlob(this.dossierService.getPlateDeliveryFile(this.dossier.id), pd.contentType);
  }

  private loadPreviewBlob(

    request$: ReturnType<DossierService['getDocumentFile']>,

    contentType?: string

  ) {

    this.previewLoading = true;

    this.previewError = '';

    this.revokePreviewUrl();



    request$.subscribe({

      next: async blob => {

        if (blob.type.includes('json')) {

          try {

            const parsed = JSON.parse(await blob.text());

            this.previewError = parsed?.message || 'Impossible de charger le document.';

          } catch {

            this.previewError = 'Impossible de charger le document.';

          }

          this.previewLoading = false;

          return;

        }

        this.previewUrl = URL.createObjectURL(blob);

        if (this.previewIsDeclaration) {
          this.previewDeclarationContentType = contentType || blob.type;
        } else if (this.previewIsPlateDelivery) {
          this.previewPlateContentType = contentType || blob.type;
        } else if (this.previewDoc && !this.previewDoc.contentType && blob.type) {

          this.previewDoc.contentType = blob.type;

        }

        this.previewLoading = false;

      },

      error: async err => {

        let message = 'Impossible de charger le document.';

        const body = err?.error;

        if (body instanceof Blob && body.type.includes('json')) {

          try {

            const parsed = JSON.parse(await body.text());

            if (parsed?.message) message = parsed.message;

          } catch { /* ignore */ }

        }

        this.previewError = message;

        this.previewLoading = false;

      }

    });

  }



  closePreview() {

    this.revokePreviewUrl();

    this.previewDoc = null;

    this.previewError = '';

    this.previewLoading = false;

    this.previewIsDeclaration = false;
    this.previewIsPlateDelivery = false;
    this.previewDeclarationContentType = '';
    this.previewPlateContentType = '';
  }

  isImagePreview() {
    if (this.previewIsPlateDelivery) {
      const type = this.previewPlateContentType.toLowerCase();
      const name = (this.dossier?.plateDelivery?.fileName || '').toLowerCase();
      return type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/.test(name);
    }

    if (this.previewIsDeclaration) {

      const type = this.previewDeclarationContentType.toLowerCase();

      const name = (this.dossier?.vehicleDeclaration?.fileName || '').toLowerCase();

      return type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/.test(name);

    }

    if (!this.previewDoc) return false;

    const type = this.previewDoc.contentType?.toLowerCase() || '';

    const name = this.previewDoc.fileName?.toLowerCase() || '';

    return type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/.test(name);

  }



  isPdfPreview() {
    if (this.previewIsPlateDelivery) {
      const type = this.previewPlateContentType.toLowerCase();
      const name = (this.dossier?.plateDelivery?.fileName || '').toLowerCase();
      return type.includes('pdf') || name.endsWith('.pdf');
    }

    if (this.previewIsDeclaration) {

      const type = this.previewDeclarationContentType.toLowerCase();

      const name = (this.dossier?.vehicleDeclaration?.fileName || '').toLowerCase();

      return type.includes('pdf') || name.endsWith('.pdf');

    }

    if (!this.previewDoc) return false;

    const type = this.previewDoc.contentType?.toLowerCase() || '';

    const name = this.previewDoc.fileName?.toLowerCase() || '';

    return type.includes('pdf') || name.endsWith('.pdf');

  }



  previewTitle(): string {
    if (this.previewIsPlateDelivery) {
      return 'Pièce justificative — remise de plaque';
    }

    if (this.previewIsDeclaration && this.dossier?.vehicleDeclaration) {

      return this.declarationLabel(this.dossier.vehicleDeclaration.declarationType);

    }

    return this.previewDoc?.typeDocument.libelle || 'Document';

  }



  previewFileName(): string {
    if (this.previewIsPlateDelivery && this.dossier?.plateDelivery) {
      return this.dossier.plateDelivery.fileName || '';
    }

    if (this.previewIsDeclaration && this.dossier?.vehicleDeclaration) {

      return this.dossier.vehicleDeclaration.fileName;

    }

    return this.previewDoc?.fileName || '';

  }



  private revokePreviewUrl() {

    if (this.previewUrl) {

      URL.revokeObjectURL(this.previewUrl);

      this.previewUrl = null;

    }

  }

}

