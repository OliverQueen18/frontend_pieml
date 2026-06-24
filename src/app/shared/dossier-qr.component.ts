import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import QRCode from 'qrcode';
import { buildDossierTrackUrl } from './dossier-reference.util';

@Component({
  selector: 'app-dossier-qr',
  standalone: true,
  template: `
    <div class="dossier-qr" [class.compact]="compact">
      <canvas #canvas class="qr-canvas" [attr.aria-label]="'QR code dossier ' + reference"></canvas>
      @if (showReference) {
        <p class="qr-ref"><strong>{{ reference }}</strong></p>
      }
      @if (showHint) {
        <p class="qr-hint">Scannez ce code pour suivre votre dossier</p>
      }
      @if (showDownload) {
        <button type="button" class="qr-download-btn" (click)="download()">
          <i class="pi pi-download"></i> Télécharger le QR code
        </button>
      }
    </div>
  `,
  styles: [`
    .dossier-qr {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      text-align: center;
    }
    .qr-canvas {
      border: 1px solid var(--pie-border, #e5e7eb);
      border-radius: 10px;
      padding: 8px;
      background: white;
    }
    .qr-ref {
      font-size: 1rem;
      color: var(--pie-navy, #1e3a5f);
      letter-spacing: 0.5px;
    }
    .qr-hint {
      font-size: 0.82rem;
      color: var(--pie-muted, #6b7280);
      max-width: 220px;
      line-height: 1.4;
    }
    .compact .qr-canvas { max-width: 140px; max-height: 140px; }
    .compact .qr-hint { font-size: 0.75rem; }
    .qr-download-btn {
      margin-top: 0.25rem;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.45rem 0.85rem;
      border: 1px solid var(--pie-border, #e5e7eb);
      border-radius: 8px;
      background: white;
      color: var(--pie-navy, #1e3a5f);
      font-size: 0.82rem;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.2s, border-color 0.2s;
    }
    .qr-download-btn:hover {
      background: #f0fdf4;
      border-color: rgba(26, 171, 75, 0.45);
    }
  `]
})
export class DossierQrComponent implements AfterViewInit, OnChanges {
  @Input({ required: true }) reference = '';
  @Input() size = 200;
  @Input() compact = false;
  @Input() showReference = true;
  @Input() showHint = true;
  @Input() showDownload = false;

  @ViewChild('canvas') canvasRef?: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit() {
    void this.render();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['reference'] && this.canvasRef) {
      void this.render();
    }
  }

  private async render() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.reference) return;

    const url = buildDossierTrackUrl(this.reference);
    try {
      await QRCode.toCanvas(canvas, url, {
        width: this.size,
        margin: 2,
        color: { dark: '#1e3a5f', light: '#ffffff' }
      });
    } catch {
      // Canvas may be destroyed during navigation.
    }
  }

  download() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.reference) return;

    const link = document.createElement('a');
    link.download = `qr-dossier-${this.reference.replace(/[^\w/-]+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
}
