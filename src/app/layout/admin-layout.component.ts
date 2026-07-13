import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { AdminService } from '../core/admin.service';
import { PERMISSIONS } from '../core/permissions';
import { ROLE_LABELS } from '../core/roles';
import { PiemlChatbotComponent } from '../shared/chatbot/pieml-chatbot.component';
import { VersionFooterComponent } from '../shared/version-footer.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, PiemlChatbotComponent, VersionFooterComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private admin = inject(AdminService);
  private router = inject(Router);
  roleLabels = ROLE_LABELS;
  readonly P = PERMISSIONS;
  pendingClaimsCount = 0;
  pendingDossiersCount = 0;
  menuOpen = false;
  profileMenuOpen = false;
  private navSub?: Subscription;

  ngOnInit() {
    this.navSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this.closeMenu();
        this.closeProfileMenu();
        this.refreshCounters();
      });

    this.refreshCounters();
  }

  ngOnDestroy() {
    this.navSub?.unsubscribe();
    document.body.style.overflow = '';
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.closeProfileMenu();
  }

  toggleMenu() {
    this.closeProfileMenu();
    this.menuOpen = !this.menuOpen;
    this.syncBodyScroll();
  }

  closeMenu() {
    if (!this.menuOpen) return;
    this.menuOpen = false;
    this.syncBodyScroll();
  }

  toggleProfileMenu(event: Event) {
    event.stopPropagation();
    this.closeMenu();
    this.profileMenuOpen = !this.profileMenuOpen;
  }

  closeProfileMenu() {
    this.profileMenuOpen = false;
  }

  onNavClick(event: Event) {
    const target = event.target as HTMLElement | null;
    if (target?.closest('a')) {
      this.closeMenu();
    }
  }

  private syncBodyScroll() {
    document.body.style.overflow = this.menuOpen ? 'hidden' : '';
  }

  private refreshCounters() {
    if (this.auth.hasPermission(PERMISSIONS.DOSSIERS_VIEW)) {
      this.loadPendingDossiersCount();
    }
    if (this.auth.hasPermission(PERMISSIONS.CITIZENS_VIEW)) {
      this.loadPendingClaimsCount();
    }
  }

  private loadPendingDossiersCount() {
    this.admin.getDashboard().subscribe({
      next: res => this.pendingDossiersCount = res.data?.dossiersEnCours ?? 0,
      error: () => this.pendingDossiersCount = 0
    });
  }

  private loadPendingClaimsCount() {
    this.admin.getProfileChangeRequestsPendingCount().subscribe({
      next: res => {
        const count = res.data?.count;
        this.pendingClaimsCount = typeof count === 'number' ? count : Number(count ?? 0);
      },
      error: () => {
        // Fallback : compter les réclamations PENDING si le endpoint count échoue
        this.admin.listProfileChangeRequests('PENDING').subscribe({
          next: listRes => this.pendingClaimsCount = listRes.data?.length ?? 0,
          error: () => this.pendingClaimsCount = 0
        });
      }
    });
  }

  logout() {
    if (!confirm('Voulez-vous vraiment vous déconnecter ?')) return;
    this.closeMenu();
    this.closeProfileMenu();
    this.auth.logout();
  }
}
