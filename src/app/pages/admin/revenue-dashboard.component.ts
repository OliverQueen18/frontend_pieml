import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/admin.service';
import {
  AdminPaymentDto,
  CenterDto,
  PAYMENT_STATUS_LABELS,
  VehicleLookupDto
} from '../../models';

type DatePeriod = 'week' | 'month' | 'year' | 'all';
type FilterScope = 'all' | 'custom' | 'none';

interface RevenueBreakdown {
  key: string;
  label: string;
  amount: number;
  count: number;
}

interface TimelinePoint {
  label: string;
  amount: number;
  count: number;
}

@Component({
  selector: 'app-admin-revenue-dashboard',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule],
  templateUrl: './revenue-dashboard.component.html',
  styleUrl: './revenue-dashboard.component.scss'
})
export class AdminRevenueDashboardComponent implements OnInit {
  private admin = inject(AdminService);

  payments: AdminPaymentDto[] = [];
  centers: CenterDto[] = [];
  vehicleTypes: VehicleLookupDto[] = [];
  loading = true;
  error = '';

  selectedCities = new Set<string>();
  selectedCenterIds = new Set<number>();
  selectedVehicleTypeIds = new Set<number>();
  citiesScope: FilterScope = 'all';
  centersScope: FilterScope = 'all';
  vehicleTypesScope: FilterScope = 'all';
  dateFrom = '';
  dateTo = '';
  periodPreset: DatePeriod = 'month';
  periodOptions: { value: DatePeriod; label: string }[] = [
    { value: 'week', label: 'Semaine' },
    { value: 'month', label: 'Mois' },
    { value: 'year', label: 'Année' },
    { value: 'all', label: 'Tout' }
  ];
  statusLabels = PAYMENT_STATUS_LABELS;

  ngOnInit() {
    this.onPeriodChange('month');
    this.load();
  }

  load() {
    this.loading = true;
    this.error = '';
    this.admin.listPayments().subscribe({
      next: res => {
        this.payments = res.data;
        this.loading = false;
      },
      error: err => {
        this.error = err.error?.message || 'Erreur de chargement';
        this.loading = false;
      }
    });
    this.admin.listCenters().subscribe({
      next: res => this.centers = res.data.filter(c => c.active),
      error: () => {}
    });
    this.admin.listVehicleTypes().subscribe({
      next: res => this.vehicleTypes = res.data.filter(v => v.actif),
      error: () => {}
    });
  }

  get cities(): string[] {
    return [...new Set(this.centers.map(c => c.city).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));
  }

  get filteredCentersForFilter(): CenterDto[] {
    if (this.citiesScope === 'all') return this.centers;
    if (this.citiesScope === 'none') return [];
    return this.centers.filter(c => c.city && this.selectedCities.has(c.city));
  }

  get allCitiesSelected(): boolean {
    return this.citiesScope === 'all';
  }

  get allCentersSelected(): boolean {
    return this.centersScope === 'all';
  }

  get allVehicleTypesSelected(): boolean {
    return this.vehicleTypesScope === 'all';
  }

  get filteredPayments(): AdminPaymentDto[] {
    return this.payments.filter(p => this.matchesFilters(p));
  }

  get completedPayments(): AdminPaymentDto[] {
    return this.filteredPayments.filter(p => p.status === 'COMPLETED');
  }

  get totalRevenue(): number {
    return this.sumAmount(this.completedPayments, 'totalAmount');
  }

  get totalDossierFees(): number {
    return this.sumAmount(this.completedPayments, 'amount');
  }

  get totalServiceFees(): number {
    return this.sumAmount(this.completedPayments, 'serviceFee');
  }

  get pendingAmount(): number {
    return this.sumAmount(
      this.filteredPayments.filter(p => p.status === 'PENDING' || p.status === 'PROCESSING'),
      'totalAmount'
    );
  }

  get revenueByCenter(): RevenueBreakdown[] {
    return this.groupRevenue(
      this.completedPayments,
      p => String(p.centerId ?? 0),
      p => p.centerName || 'Centre non assigné'
    );
  }

  get revenueByVehicleType(): RevenueBreakdown[] {
    return this.groupRevenue(
      this.completedPayments,
      p => String(p.vehicleTypeId ?? 0),
      p => p.vehicleTypeLabel || 'Type non renseigné'
    );
  }

  get revenueTimeline(): TimelinePoint[] {
    const completed = this.completedPayments.filter(p => p.paymentDate);
    if (!completed.length) return [];

    const byMonth = this.periodPreset === 'year' || this.periodPreset === 'all';
    const map = new Map<string, TimelinePoint>();

    for (const p of completed) {
      const date = new Date(p.paymentDate!);
      const label = byMonth
        ? `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
        : `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
      const entry = map.get(label) ?? { label, amount: 0, count: 0 };
      entry.amount += p.totalAmount;
      entry.count += 1;
      map.set(label, entry);
    }

    return [...map.values()].sort((a, b) => this.timelineSortKey(a.label, byMonth) - this.timelineSortKey(b.label, byMonth));
  }

  get maxCenterAmount(): number {
    return Math.max(1, ...this.revenueByCenter.map(c => c.amount));
  }

  get maxVehicleTypeAmount(): number {
    return Math.max(1, ...this.revenueByVehicleType.map(v => v.amount));
  }

  get maxTimelineAmount(): number {
    return Math.max(1, ...this.revenueTimeline.map(p => p.amount));
  }

  onPeriodChange(period: DatePeriod) {
    this.periodPreset = period;
    const today = new Date();
    switch (period) {
      case 'week':
        this.dateFrom = this.toDateInputValue(this.startOfWeek(today));
        this.dateTo = this.toDateInputValue(this.endOfWeek(today));
        break;
      case 'month':
        this.dateFrom = this.toDateInputValue(this.startOfMonth(today));
        this.dateTo = this.toDateInputValue(this.endOfMonth(today));
        break;
      case 'year':
        this.dateFrom = this.toDateInputValue(this.startOfYear(today));
        this.dateTo = this.toDateInputValue(this.endOfYear(today));
        break;
      case 'all':
        this.dateFrom = '';
        this.dateTo = '';
        break;
    }
  }

  onDateFilterChange() {
    if (this.dateFrom && this.dateTo && this.dateFrom > this.dateTo) {
      this.dateTo = this.dateFrom;
    }
  }

  periodLabel(): string {
    return this.periodOptions.find(p => p.value === this.periodPreset)?.label ?? '';
  }

  formatDisplayDate(value: string): string {
    if (!value) return '';
    const [y, m, d] = value.split('-');
    return `${d}/${m}/${y}`;
  }

  barWidth(value: number, max: number): string {
    return `${Math.round((value / max) * 100)}%`;
  }

  barHeight(value: number, max: number): string {
    return `${Math.round((value / max) * 100)}%`;
  }

  statusClass(status: string): string {
    return status.toLowerCase().replace('_', '-');
  }

  get selectedCitiesLabel(): string {
    return [...this.selectedCities].sort((a, b) => a.localeCompare(b, 'fr')).join(', ');
  }

  resetFilters() {
    this.citiesScope = 'all';
    this.centersScope = 'all';
    this.vehicleTypesScope = 'all';
    this.selectedCities.clear();
    this.selectedCenterIds.clear();
    this.selectedVehicleTypeIds.clear();
    this.onPeriodChange('month');
  }

  onAllCitiesChange(checked: boolean) {
    if (checked) {
      this.citiesScope = 'all';
      this.selectedCities.clear();
    } else {
      this.citiesScope = 'custom';
      this.selectedCities.clear();
      this.cities.forEach(city => this.selectedCities.add(city));
    }
    this.syncCentersAfterCityChange();
  }

  onCityChange(city: string, checked: boolean) {
    if (this.citiesScope === 'all') return;
    if (checked) {
      this.selectedCities.add(city);
      this.citiesScope = 'custom';
    } else {
      this.selectedCities.delete(city);
      if (this.selectedCities.size === 0) {
        this.citiesScope = 'none';
      }
    }
    this.syncCentersAfterCityChange();
  }

  isCitySelected(city: string): boolean {
    if (this.citiesScope === 'all') return true;
    if (this.citiesScope === 'none') return false;
    return this.selectedCities.has(city);
  }

  clearCityFilters() {
    this.citiesScope = 'none';
    this.selectedCities.clear();
    this.syncCentersAfterCityChange();
  }

  clearCenterFilters() {
    this.centersScope = 'none';
    this.selectedCenterIds.clear();
  }

  clearVehicleTypeFilters() {
    this.vehicleTypesScope = 'none';
    this.selectedVehicleTypeIds.clear();
  }

  private syncCentersAfterCityChange() {
    if (this.centersScope !== 'custom') return;
    const visibleIds = new Set(this.filteredCentersForFilter.map(c => c.id));
    for (const id of this.selectedCenterIds) {
      if (!visibleIds.has(id)) this.selectedCenterIds.delete(id);
    }
    if (this.selectedCenterIds.size === 0) {
      this.centersScope = 'none';
    }
  }

  onAllCentersChange(checked: boolean) {
    if (checked) {
      this.centersScope = 'all';
      this.selectedCenterIds.clear();
      return;
    }
    this.centersScope = 'custom';
    this.selectedCenterIds.clear();
    this.filteredCentersForFilter.forEach(c => this.selectedCenterIds.add(c.id));
  }

  onCenterChange(centerId: number, checked: boolean) {
    if (this.centersScope === 'all') return;
    if (checked) {
      this.selectedCenterIds.add(centerId);
      this.centersScope = 'custom';
    } else {
      this.selectedCenterIds.delete(centerId);
      if (this.selectedCenterIds.size === 0) {
        this.centersScope = 'none';
      }
    }
  }

  isCenterSelected(centerId: number): boolean {
    if (this.centersScope === 'all') return true;
    if (this.centersScope === 'none') return false;
    return this.selectedCenterIds.has(centerId);
  }

  onAllVehicleTypesChange(checked: boolean) {
    if (checked) {
      this.vehicleTypesScope = 'all';
      this.selectedVehicleTypeIds.clear();
      return;
    }
    this.vehicleTypesScope = 'custom';
    this.selectedVehicleTypeIds.clear();
    this.vehicleTypes.forEach(v => this.selectedVehicleTypeIds.add(v.id));
  }

  onVehicleTypeChange(vehicleTypeId: number, checked: boolean) {
    if (this.vehicleTypesScope === 'all') return;
    if (checked) {
      this.selectedVehicleTypeIds.add(vehicleTypeId);
      this.vehicleTypesScope = 'custom';
    } else {
      this.selectedVehicleTypeIds.delete(vehicleTypeId);
      if (this.selectedVehicleTypeIds.size === 0) {
        this.vehicleTypesScope = 'none';
      }
    }
  }

  isVehicleTypeSelected(vehicleTypeId: number): boolean {
    if (this.vehicleTypesScope === 'all') return true;
    if (this.vehicleTypesScope === 'none') return false;
    return this.selectedVehicleTypeIds.has(vehicleTypeId);
  }

  private matchesFilters(p: AdminPaymentDto): boolean {
    if (this.citiesScope === 'none') return false;
    if (this.citiesScope === 'custom') {
      const city = this.centers.find(c => c.id === p.centerId)?.city;
      if (!city || !this.selectedCities.has(city)) return false;
    }
    if (this.centersScope === 'none') return false;
    if (this.centersScope === 'custom' && (!p.centerId || !this.selectedCenterIds.has(p.centerId))) {
      return false;
    }
    if (this.vehicleTypesScope === 'none') return false;
    if (this.vehicleTypesScope === 'custom' && (!p.vehicleTypeId || !this.selectedVehicleTypeIds.has(p.vehicleTypeId))) {
      return false;
    }
    return this.matchesDateRange(p.paymentDate);
  }

  private matchesDateRange(paymentDate?: string): boolean {
    if (!this.dateFrom && !this.dateTo) return true;
    if (!paymentDate) return false;
    const date = new Date(paymentDate);
    if (Number.isNaN(date.getTime())) return false;
    if (this.dateFrom) {
      const from = new Date(`${this.dateFrom}T00:00:00`);
      if (date < from) return false;
    }
    if (this.dateTo) {
      const to = new Date(`${this.dateTo}T23:59:59.999`);
      if (date > to) return false;
    }
    return true;
  }

  private groupRevenue(
    payments: AdminPaymentDto[],
    keyFn: (p: AdminPaymentDto) => string,
    labelFn: (p: AdminPaymentDto) => string
  ): RevenueBreakdown[] {
    const map = new Map<string, RevenueBreakdown>();
    for (const p of payments) {
      const key = keyFn(p);
      const entry = map.get(key) ?? { key, label: labelFn(p), amount: 0, count: 0 };
      entry.amount += p.totalAmount;
      entry.count += 1;
      map.set(key, entry);
    }
    return [...map.values()].sort((a, b) => b.amount - a.amount);
  }

  private sumAmount(payments: AdminPaymentDto[], field: 'totalAmount' | 'amount' | 'serviceFee'): number {
    return payments.reduce((sum, p) => sum + (p[field] ?? 0), 0);
  }

  private timelineSortKey(label: string, byMonth: boolean): number {
    if (byMonth) {
      const [m, y] = label.split('/').map(Number);
      return y * 100 + m;
    }
    const [d, m] = label.split('/').map(Number);
    return m * 100 + d;
  }

  private startOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private endOfWeek(date: Date): Date {
    const d = this.startOfWeek(date);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private endOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  private startOfYear(date: Date): Date {
    return new Date(date.getFullYear(), 0, 1);
  }

  private endOfYear(date: Date): Date {
    return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
  }

  private toDateInputValue(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
