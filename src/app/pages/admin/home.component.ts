import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../core/admin.service';
import { AuthService } from '../../core/auth.service';
import { PERMISSIONS } from '../../core/permissions';
import {
  AdminDashboardCharts,
  AdminDashboardStats,
  AdminNotificationDto,
  DashboardCenterStat,
  DashboardChartPoint,
  NOTIFICATION_TYPE_LABELS
} from '../../models';

type ChartPeriod = '7d' | '30d' | '6m';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class AdminHomeComponent implements OnInit {
  private admin = inject(AdminService);
  auth = inject(AuthService);

  stats: AdminDashboardStats | null = null;
  charts: AdminDashboardCharts | null = null;
  chartPeriod: ChartPeriod = '30d';
  error = '';
  chartsLoading = false;
  typeLabels = NOTIFICATION_TYPE_LABELS;
  readonly P = PERMISSIONS;

  readonly periodOptions: { value: ChartPeriod; label: string }[] = [
    { value: '7d', label: '7 derniers jours' },
    { value: '30d', label: '30 derniers jours' },
    { value: '6m', label: '6 derniers mois' }
  ];

  ngOnInit() {
    this.admin.getDashboard().subscribe({
      next: res => this.stats = res.data,
      error: err => this.error = err.error?.message || 'Impossible de charger les statistiques'
    });
    this.loadCharts();
  }

  get recentNotifications(): AdminNotificationDto[] {
    return this.charts?.recentNotifications ?? [];
  }

  get dossiersByPeriod(): DashboardChartPoint[] {
    return this.charts?.dossiersByPeriod ?? [];
  }

  get statsByCenter(): DashboardCenterStat[] {
    return this.charts?.statsByCenter ?? [];
  }

  get maxDossierValue(): number {
    return Math.max(1, ...this.dossiersByPeriod.map(p => p.value));
  }

  get maxCenterValue(): number {
    return Math.max(1, ...this.statsByCenter.map(c => c.appointments));
  }

  periodLabel(): string {
    return this.periodOptions.find(p => p.value === this.chartPeriod)?.label ?? '';
  }

  onPeriodChange(period: ChartPeriod) {
    if (this.chartPeriod === period) return;
    this.chartPeriod = period;
    this.loadCharts();
  }

  barHeight(value: number, max: number): string {
    return `${Math.round((value / max) * 100)}%`;
  }

  loadCharts() {
    this.chartsLoading = true;
    this.admin.getDashboardCharts(this.chartPeriod).subscribe({
      next: res => {
        this.charts = res.data;
        this.chartsLoading = false;
      },
      error: () => {
        this.chartsLoading = false;
      }
    });
  }
}
