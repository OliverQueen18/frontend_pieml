import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/admin.service';
import { AdminCitizenDto } from '../../models';

@Component({
  selector: 'app-admin-citizens',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule],
  templateUrl: './citizens.component.html',
  styleUrl: './citizens.component.scss'
})
export class AdminCitizensComponent implements OnInit {
  private admin = inject(AdminService);

  citizens: AdminCitizenDto[] = [];
  searchQuery = '';
  error = '';
  success = '';
  viewingCitizen: AdminCitizenDto | null = null;
  removingId: number | null = null;

  ngOnInit() {
    this.load();
  }

  get filteredCitizens(): AdminCitizenDto[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.citizens;
    return this.citizens.filter(c =>
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.nina.toLowerCase().includes(q)
    );
  }

  load() {
    this.admin.listCitizens().subscribe({
      next: res => this.citizens = res.data,
      error: err => this.error = err.error?.message || 'Erreur de chargement'
    });
  }

  fullName(citizen: AdminCitizenDto): string {
    return `${citizen.firstName} ${citizen.lastName}`;
  }

  openView(citizen: AdminCitizenDto) {
    this.viewingCitizen = citizen;
  }

  closeView() {
    this.viewingCitizen = null;
  }

  remove(citizen: AdminCitizenDto) {
    if (citizen.enabled === false) {
      this.error = 'Ce compte est déjà désactivé.';
      return;
    }
    if (!confirm(`Désactiver le compte de « ${this.fullName(citizen)} » ?\nLe citoyen ne pourra plus se connecter.`)) {
      return;
    }

    this.removingId = citizen.id;
    this.error = '';
    this.success = '';
    this.admin.deleteCitizen(citizen.id).subscribe({
      next: () => {
        this.success = 'Compte citoyen désactivé';
        this.removingId = null;
        if (this.viewingCitizen?.id === citizen.id) {
          this.closeView();
        }
        this.load();
      },
      error: err => {
        this.error = err.error?.message || 'Désactivation impossible';
        this.removingId = null;
      }
    });
  }
}
