import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../core/auth.service';
import { AdminService } from '../core/admin.service';
import { PERMISSIONS } from '../core/permissions';
import { ROLE_LABELS } from '../core/roles';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent implements OnInit {
  auth = inject(AuthService);
  private admin = inject(AdminService);
  private router = inject(Router);
  roleLabels = ROLE_LABELS;
  readonly P = PERMISSIONS;
  pendingClaimsCount = 0;

  ngOnInit() {
    if (this.auth.hasPermission(PERMISSIONS.CITIZENS_VIEW)) {
      this.loadPendingClaimsCount();
      this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
        this.loadPendingClaimsCount();
      });
    }
  }

  private loadPendingClaimsCount() {
    this.admin.getProfileChangeRequestsPendingCount().subscribe({
      next: res => this.pendingClaimsCount = res.data?.count ?? 0,
      error: () => this.pendingClaimsCount = 0
    });
  }

  logout() {
    if (!confirm('Voulez-vous vraiment vous déconnecter ?')) return;
    this.auth.logout();
  }
}
