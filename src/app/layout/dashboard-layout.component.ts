import { Component, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { TrackDossierDialogComponent } from '../shared/track-dossier-dialog.component';
import { PiemlChatbotComponent } from '../shared/chatbot/pieml-chatbot.component';
import { VersionFooterComponent } from '../shared/version-footer.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TrackDossierDialogComponent, PiemlChatbotComponent, VersionFooterComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.scss'
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  @ViewChild(TrackDossierDialogComponent) trackDialog?: TrackDossierDialogComponent;

  auth = inject(AuthService);
  private router = inject(Router);
  menuOpen = false;
  profileMenuOpen = false;
  private navSub?: Subscription;

  ngOnInit() {
    this.navSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this.closeMenu();
        this.closeProfileMenu();
      });
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

  private syncBodyScroll() {
    document.body.style.overflow = this.menuOpen ? 'hidden' : '';
  }

  openTrackDialog() {
    this.closeMenu();
    this.closeProfileMenu();
    this.trackDialog?.open();
  }

  logout() {
    if (!confirm('Voulez-vous vraiment vous déconnecter ?')) return;
    this.closeMenu();
    this.closeProfileMenu();
    this.auth.logout();
  }
}
