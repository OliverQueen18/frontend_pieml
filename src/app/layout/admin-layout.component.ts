import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { PERMISSIONS } from '../core/permissions';
import { ROLE_LABELS } from '../core/roles';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {
  auth = inject(AuthService);
  roleLabels = ROLE_LABELS;
  readonly P = PERMISSIONS;

  logout() {
    if (!confirm('Voulez-vous vraiment vous déconnecter ?')) return;
    this.auth.logout();
  }
}
