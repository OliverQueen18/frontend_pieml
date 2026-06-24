import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  inject
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Html5Qrcode } from 'html5-qrcode';
import { DossierService } from '../core/dossier.service';
import { DOSSIER_STATUS_LABELS, DossierDto } from '../models';
import { parseDossierReference } from './dossier-reference.util';

type TrackMode = 'manual' | 'scan';

@Component({
  selector: 'app-track-dossier-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  templateUrl: './track-dossier-search.component.html',
  styleUrl: './track-dossier-search.component.scss'
})
export class TrackDossierSearchComponent implements OnDestroy, OnChanges {
  @ViewChild('qrReaderHost') qrReaderHost?: ElementRef<HTMLDivElement>;

  @Input({ required: true }) readerId!: string;
  @Input() initialReference = '';
  @Input() showOpenDossierButton = false;
  @Input() inputId = 'dossier-reference';
  @Output() dossierOpened = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private dossierService = inject(DossierService);
  private router = inject(Router);

  mode: TrackMode = 'manual';
  loading = false;
  error = '';
  scanError = '';
  dossier: DossierDto | null = null;

  form = this.fb.group({ reference: [''] });

  private scanner?: Html5Qrcode;
  private scannerRunning = false;

  ngOnChanges(changes: SimpleChanges) {
    const refChange = changes['initialReference'];
    if (refChange?.currentValue) {
      this.form.patchValue({ reference: refChange.currentValue });
      this.search();
    }
  }

  ngOnDestroy() {
    void this.stopScanner();
  }

  setMode(mode: TrackMode) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.error = '';
    this.scanError = '';
    this.dossier = null;

    if (mode === 'scan') {
      setTimeout(() => void this.startScanner(), 0);
    } else {
      void this.stopScanner();
    }
  }

  search() {
    const reference = parseDossierReference(this.form.value.reference ?? '');
    if (!reference) {
      this.error = 'Veuillez saisir un numéro de dossier.';
      return;
    }
    this.lookup(reference);
  }

  openDossier() {
    if (!this.dossier) return;
    this.router.navigate(['/tableau-de-bord/dossier', this.dossier.id]);
    this.dossierOpened.emit();
  }

  statusLabel(status: string) {
    return DOSSIER_STATUS_LABELS[status] || status;
  }

  reset() {
    void this.stopScanner();
    this.mode = 'manual';
    this.error = '';
    this.scanError = '';
    this.dossier = null;
    this.loading = false;
    this.form.reset({ reference: '' });
  }

  private lookup(reference: string) {
    this.loading = true;
    this.error = '';
    this.dossier = null;
    this.form.patchValue({ reference });

    this.dossierService.trackDossier(reference).subscribe({
      next: res => {
        this.dossier = res.data;
        this.loading = false;
        void this.stopScanner();
      },
      error: err => {
        this.error = err.error?.message || 'Dossier non trouvé';
        this.loading = false;
      }
    });
  }

  private async startScanner() {
    if (!this.qrReaderHost || this.scannerRunning) return;

    this.scanError = '';
    try {
      this.scanner = new Html5Qrcode(this.readerId);
      await this.scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        decoded => this.onQrDecoded(decoded),
        () => undefined
      );
      this.scannerRunning = true;
    } catch {
      this.scanError = 'Impossible d\'accéder à la caméra. Autorisez l\'accès ou saisissez le numéro manuellement.';
      this.mode = 'manual';
      await this.stopScanner();
    }
  }

  private async stopScanner() {
    if (!this.scanner || !this.scannerRunning) {
      this.scanner = undefined;
      this.scannerRunning = false;
      return;
    }

    try {
      await this.scanner.stop();
      this.scanner.clear();
    } catch {
      // Scanner may already be stopped.
    }

    this.scanner = undefined;
    this.scannerRunning = false;
  }

  private onQrDecoded(raw: string) {
    const reference = parseDossierReference(raw);
    if (!reference) {
      this.scanError = 'QR code non reconnu. Utilisez un code contenant le numéro de dossier.';
      return;
    }
    this.scanError = '';
    this.lookup(reference);
  }
}
