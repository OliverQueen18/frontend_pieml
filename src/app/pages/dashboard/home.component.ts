import { Component, OnInit, inject } from '@angular/core';

import { RouterLink } from '@angular/router';

import { CommonModule, DatePipe } from '@angular/common';

import { DossierService } from '../../core/dossier.service';

import {

  DashboardStats,

  DOSSIER_STATUS_LABELS,

  DossierDto,

  NotificationDto

} from '../../models';



@Component({

  selector: 'app-dashboard-home',

  standalone: true,

  imports: [CommonModule, RouterLink, DatePipe],

  templateUrl: './home.component.html',

  styleUrl: './home.component.scss'

})

export class DashboardHomeComponent implements OnInit {

  private dossierService = inject(DossierService);



  stats: DashboardStats | null = null;

  dossiers: DossierDto[] = [];

  notifications: NotificationDto[] = [];

  activeDossier: DossierDto | null = null;

  deletingId: number | null = null;

  error = '';



  ngOnInit() {

    this.loadDashboard();

  }



  loadDashboard() {

    this.dossierService.getDashboard().subscribe(res => this.stats = res.data);

    this.dossierService.getDossiers().subscribe(res => {

      this.dossiers = res.data || [];

      this.activeDossier = this.dossiers.find(d =>

        ['DRAFT', 'REJECTED', 'SUBMITTED', 'IN_REVIEW', 'PAYMENT_PENDING', 'PAID', 'VALIDATED', 'APPOINTMENT_SCHEDULED', 'IMMATRICULATION_IN_PROGRESS'].includes(d.status)

      ) || this.dossiers[0] || null;

    });

    this.dossierService.getNotifications().subscribe(res => this.notifications = res.data || []);

  }



  isDraft(dossier: DossierDto): boolean {

    return dossier.status === 'DRAFT';

  }



  deleteDraft(dossier: DossierDto, event?: Event) {

    event?.preventDefault();

    event?.stopPropagation();



    if (!this.isDraft(dossier) || this.deletingId != null) return;



    if (!confirm(`Supprimer définitivement le brouillon ${dossier.referenceNumber} ? Cette action est irréversible.`)) {

      return;

    }



    this.error = '';

    this.deletingId = dossier.id;

    this.dossierService.deleteDraftDossier(dossier.id).subscribe({

      next: () => {

        this.deletingId = null;

        this.loadDashboard();

      },

      error: err => {

        this.error = err.error?.message || 'Impossible de supprimer le dossier';

        this.deletingId = null;

      }

    });

  }



  statusLabel(status: string) {

    return DOSSIER_STATUS_LABELS[status] || status;

  }



  statusClass(status: string): string {

    const map: Record<string, string> = {

      IN_REVIEW: 'badge-orange', SUBMITTED: 'badge-orange', DRAFT: 'badge-orange',

      VALIDATED: 'badge-green', PAID: 'badge-green', COMPLETED: 'badge-green',
      APPOINTMENT_SCHEDULED: 'badge-blue', IMMATRICULATION_IN_PROGRESS: 'badge-blue',
      REJECTED: 'badge-red', PAYMENT_PENDING: 'badge-blue',
      STOLEN: 'badge-red', LOST: 'badge-orange', SOLD: 'badge-purple'
    };

    return map[status] || 'badge-blue';

  }

}

