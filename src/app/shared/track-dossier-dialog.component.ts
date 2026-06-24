import { Component, Input, ViewChild } from '@angular/core';
import { TrackDossierSearchComponent } from './track-dossier-search.component';

@Component({
  selector: 'app-track-dossier-dialog',
  standalone: true,
  imports: [TrackDossierSearchComponent],
  templateUrl: './track-dossier-dialog.component.html',
  styleUrl: './track-dossier-dialog.component.scss'
})
export class TrackDossierDialogComponent {
  @ViewChild(TrackDossierSearchComponent) search?: TrackDossierSearchComponent;

  @Input() showOpenDossierButton = true;
  @Input() readerId = 'track-dossier-qr-reader';

  visible = false;

  open() {
    this.visible = true;
    setTimeout(() => this.search?.reset(), 0);
  }

  close() {
    this.search?.reset();
    this.visible = false;
  }
}
