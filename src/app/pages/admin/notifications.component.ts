import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { AdminService } from '../../core/admin.service';
import { AdminNotificationDto, NOTIFICATION_TYPE_LABELS } from '../../models';

type DatePeriod = 'week' | 'month' | 'year' | 'all';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, FormsModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class AdminNotificationsComponent implements OnInit {
  private admin = inject(AdminService);
  private fb = inject(FormBuilder);

  notifications: AdminNotificationDto[] = [];
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
  viewingItem: AdminNotificationDto | null = null;
  editingId: number | null = null;
  togglingId: number | null = null;
  typeLabels = NOTIFICATION_TYPE_LABELS;
  typeOptions = Object.keys(NOTIFICATION_TYPE_LABELS);

  form = this.fb.group({
    userEmail: ['', [Validators.required, Validators.email]],
    message: ['', [Validators.required, Validators.maxLength(500)]],
    type: ['INFO', Validators.required],
    sendEmail: [true],
    read: [false]
  });

  ngOnInit() {
    this.onPeriodChange('week');
    this.load();
  }

  get filteredNotifications(): AdminNotificationDto[] {
    const q = this.searchQuery.trim().toLowerCase();
    return this.notifications.filter(n => {
      if (!this.matchesDateRange(n.createdAt)) return false;
      if (!q) return true;
      return n.message.toLowerCase().includes(q) ||
        n.userEmail.toLowerCase().includes(q) ||
        n.userName.toLowerCase().includes(q) ||
        (this.typeLabels[n.type] || n.type).toLowerCase().includes(q);
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

  private matchesDateRange(createdAt: string): boolean {
    if (!this.dateFrom && !this.dateTo) return true;
    const date = new Date(createdAt);
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
    this.admin.listNotifications().subscribe({
      next: res => this.notifications = res.data,
      error: err => this.error = err.error?.message || 'Erreur de chargement'
    });
  }

  openCreate() {
    this.closeView();
    this.editingId = null;
    this.showForm = true;
    this.form.reset({ type: 'INFO', sendEmail: true, read: false });
    this.form.controls.userEmail.enable();
    this.form.controls.sendEmail.enable();
  }

  openEdit(item: AdminNotificationDto) {
    this.closeView();
    this.editingId = item.id;
    this.showForm = true;
    this.form.patchValue({
      userEmail: item.userEmail,
      message: item.message,
      type: item.type,
      read: item.read,
      sendEmail: false
    });
    this.form.controls.userEmail.disable();
    this.form.controls.sendEmail.disable();
  }

  openEditFromView() {
    if (!this.viewingItem) return;
    this.openEdit(this.viewingItem);
    this.viewingItem = null;
  }

  cancelForm() {
    this.showForm = false;
    this.editingId = null;
    this.form.controls.userEmail.enable();
    this.form.controls.sendEmail.enable();
  }

  openView(item: AdminNotificationDto) {
    this.viewingItem = item;
  }

  closeView() {
    this.viewingItem = null;
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error = '';
    this.success = '';
    const value = this.form.getRawValue();

    if (this.editingId) {
      this.admin.updateNotification(this.editingId, {
        message: value.message!,
        type: value.type!,
        read: !!value.read
      }).subscribe({
        next: () => {
          this.success = 'Notification mise à jour';
          this.cancelForm();
          this.load();
        },
        error: err => this.error = err.error?.message || 'Mise à jour impossible'
      });
    } else {
      this.admin.createNotification({
        userEmail: value.userEmail!,
        message: value.message!,
        type: value.type!,
        sendEmail: !!value.sendEmail
      }).subscribe({
        next: () => {
          this.success = 'Notification envoyée';
          this.cancelForm();
          this.load();
        },
        error: err => this.error = err.error?.message || 'Envoi impossible'
      });
    }
  }

  toggleRead(item: AdminNotificationDto) {
    this.togglingId = item.id;
    this.error = '';
    this.admin.updateNotification(item.id, { read: !item.read }).subscribe({
      next: () => {
        this.togglingId = null;
        this.load();
      },
      error: err => {
        this.error = err.error?.message || 'Mise à jour impossible';
        this.togglingId = null;
      }
    });
  }

  remove(item: AdminNotificationDto) {
    if (!confirm('Supprimer cette notification ?')) return;
    this.admin.deleteNotification(item.id).subscribe({
      next: () => {
        this.success = 'Notification supprimée';
        if (this.viewingItem?.id === item.id) this.closeView();
        this.load();
      },
      error: err => this.error = err.error?.message || 'Suppression impossible'
    });
  }
}
