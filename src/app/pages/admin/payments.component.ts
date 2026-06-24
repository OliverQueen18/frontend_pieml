import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { AdminService } from '../../core/admin.service';
import { AdminPaymentDto, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '../../models';

type DatePeriod = 'week' | 'month' | 'year' | 'all';

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule, FormsModule],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss'
})
export class AdminPaymentsComponent implements OnInit {
  private admin = inject(AdminService);
  private fb = inject(FormBuilder);

  payments: AdminPaymentDto[] = [];
  searchQuery = '';
  dateFrom = '';
  dateTo = '';
  periodPreset: DatePeriod = 'week';
  periodOptions: { value: DatePeriod; label: string }[] = [
    { value: 'week', label: 'Semaine' },
    { value: 'month', label: 'Mois' },
    { value: 'year', label: 'Année' },
    { value: 'all', label: 'Tout' }
  ];
  error = '';
  success = '';
  showForm = false;
  viewingPayment: AdminPaymentDto | null = null;
  editingId: number | null = null;
  statusLabels = PAYMENT_STATUS_LABELS;
  methodLabels = PAYMENT_METHOD_LABELS;
  statusOptions = Object.keys(PAYMENT_STATUS_LABELS);
  methodOptions = Object.keys(PAYMENT_METHOD_LABELS);

  form = this.fb.group({
    status: ['PENDING', Validators.required],
    paymentMethod: [''],
    transactionId: ['']
  });

  ngOnInit() {
    this.onPeriodChange('week');
    this.load();
  }

  get filteredPayments(): AdminPaymentDto[] {
    const q = this.searchQuery.trim().toLowerCase();
    return this.payments.filter(p => {
      if (!this.matchesDateRange(p.paymentDate)) return false;
      if (!q) return true;
      return (p.dossierReference || '').toLowerCase().includes(q) ||
        (p.transactionId || '').toLowerCase().includes(q) ||
        p.citizenName.toLowerCase().includes(q) ||
        p.citizenEmail.toLowerCase().includes(q) ||
        (this.statusLabels[p.status] || p.status).toLowerCase().includes(q);
    });
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

  periodLabel(): string {
    return this.periodOptions.find(p => p.value === this.periodPreset)?.label ?? '';
  }

  onDateFilterChange() {
    if (this.dateFrom && this.dateTo && this.dateFrom > this.dateTo) {
      this.dateTo = this.dateFrom;
    }
  }

  formatDisplayDate(value: string): string {
    if (!value) return '';
    const [y, m, d] = value.split('-');
    return `${d}/${m}/${y}`;
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

  load() {
    this.admin.listPayments().subscribe({
      next: res => this.payments = res.data,
      error: err => this.error = err.error?.message || 'Erreur de chargement'
    });
  }

  statusClass(status: string): string {
    return status.toLowerCase().replace('_', '-');
  }

  canDelete(payment: AdminPaymentDto): boolean {
    return payment.status === 'PENDING' || payment.status === 'FAILED';
  }

  openView(payment: AdminPaymentDto) {
    this.viewingPayment = payment;
  }

  closeView() {
    this.viewingPayment = null;
  }

  openEdit(payment: AdminPaymentDto) {
    this.closeView();
    this.editingId = payment.id;
    this.showForm = true;
    this.form.patchValue({
      status: payment.status,
      paymentMethod: payment.paymentMethod || '',
      transactionId: payment.transactionId || ''
    });
  }

  openEditFromView() {
    if (!this.viewingPayment) return;
    this.openEdit(this.viewingPayment);
    this.viewingPayment = null;
  }

  cancelForm() {
    this.showForm = false;
    this.editingId = null;
  }

  submit() {
    if (this.form.invalid || !this.editingId) return;
    this.error = '';
    this.success = '';
    const value = this.form.value;
    const payload: { status: string; paymentMethod?: string; transactionId?: string } = {
      status: value.status!
    };
    if (value.paymentMethod) payload.paymentMethod = value.paymentMethod;
    if (value.transactionId?.trim()) payload.transactionId = value.transactionId.trim();

    this.admin.updatePayment(this.editingId, payload).subscribe({
      next: () => {
        this.success = 'Paiement mis à jour';
        this.cancelForm();
        this.load();
      },
      error: err => this.error = err.error?.message || 'Mise à jour impossible'
    });
  }

  remove(payment: AdminPaymentDto) {
    if (!this.canDelete(payment)) {
      this.error = 'Seuls les paiements en attente ou échoués peuvent être supprimés.';
      return;
    }
    if (!confirm(`Supprimer le paiement du dossier ${payment.dossierReference} ?`)) return;
    this.admin.deletePayment(payment.id).subscribe({
      next: () => {
        this.success = 'Paiement supprimé';
        if (this.viewingPayment?.id === payment.id) this.closeView();
        this.load();
      },
      error: err => this.error = err.error?.message || 'Suppression impossible'
    });
  }
}
