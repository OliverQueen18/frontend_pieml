import { Component, ViewChild, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { TrackDossierDialogComponent } from '../shared/track-dossier-dialog.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TrackDossierDialogComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.scss'
})
export class DashboardLayoutComponent {
  @ViewChild(TrackDossierDialogComponent) trackDialog?: TrackDossierDialogComponent;

  auth = inject(AuthService);

  openTrackDialog() {
    this.trackDialog?.open();
  }

  logout() {
    if (!confirm('Voulez-vous vraiment vous déconnecter ?')) return;
    this.auth.logout();
  }
}
