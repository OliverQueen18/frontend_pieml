import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { AdminService } from '../../core/admin.service';
import { AuthService } from '../../core/auth.service';
import { ROLE_LABELS, ROLES, creatableStaffRoles } from '../../core/roles';
import { AdminUserDto, CenterDto } from '../../models';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class AdminUsersComponent implements OnInit {
  private admin = inject(AdminService);
  private fb = inject(FormBuilder);
  auth = inject(AuthService);

  users: AdminUserDto[] = [];
  centers: CenterDto[] = [];
  searchQuery = '';
  error = '';
  formError = '';
  centersError = '';
  success = '';
  showForm = false;
  submitting = false;
  viewingUser: AdminUserDto | null = null;
  centersUser: AdminUserDto | null = null;
  editingId: number | null = null;
  removingId: number | null = null;
  resettingId: number | null = null;
  savingCentersId: number | null = null;
  togglingStatusId: number | null = null;
  selectedCenterIds: number[] = [];
  centersSearchQuery = '';
  roleLabels = ROLE_LABELS;
  readonly ROLES = ROLES;

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    address: [''],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    password: ['', [Validators.minLength(8)]],
    role: [ROLES.VALIDATEUR as string, Validators.required],
    enabled: [true]
  });

  get creatableRoles(): string[] {
    return creatableStaffRoles(this.auth.role());
  }

  ngOnInit() {
    this.load();
    this.admin.listCenters().subscribe({
      next: res => this.centers = res.data.filter(c => c.active),
      error: () => {}
    });
  }

  get filteredUsers(): AdminUserDto[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.users;
    return this.users.filter(u =>
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      (u.address || '').toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.toLowerCase().includes(q) ||
      (this.roleLabels[u.role] || u.role).toLowerCase().includes(q) ||
      (u.centerNames || []).some(n => n.toLowerCase().includes(q))
    );
  }

  get assignableCenters(): CenterDto[] {
    if (this.auth.role() === ROLES.SUPER_ADMIN) return this.centers;
    const allowed = new Set(this.auth.centerIds());
    return this.centers.filter(c => allowed.has(c.id));
  }

  get filteredAssignableCenters(): CenterDto[] {
    const q = this.centersSearchQuery.trim().toLowerCase();
    if (!q) return this.assignableCenters;
    return this.assignableCenters.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      (c.address ?? '').toLowerCase().includes(q)
    );
  }

  get allFilteredCentersSelected(): boolean {
    const visible = this.filteredAssignableCenters;
    return visible.length > 0 && visible.every(c => this.isCenterSelected(c.id));
  }

  get someFilteredCentersSelected(): boolean {
    const visible = this.filteredAssignableCenters;
    const selectedCount = visible.filter(c => this.isCenterSelected(c.id)).length;
    return selectedCount > 0 && selectedCount < visible.length;
  }

  load() {
    this.admin.listUsers().subscribe({
      next: res => this.users = res.data,
      error: err => this.error = err.error?.message || 'Erreur de chargement'
    });
  }

  fullName(user: AdminUserDto): string {
    const name = `${user.firstName} ${user.lastName}`.trim();
    return name || user.email;
  }

  centersLabel(user: AdminUserDto): string {
    if (!user.centerNames?.length) return '—';
    return user.centerNames.join(', ');
  }

  canAssignCenters(user: AdminUserDto): boolean {
    return user.role !== ROLES.SUPER_ADMIN;
  }

  isCenterSelected(centerId: number): boolean {
    return this.selectedCenterIds.includes(centerId);
  }

  toggleCenter(centerId: number) {
    if (this.isCenterSelected(centerId)) {
      this.selectedCenterIds = this.selectedCenterIds.filter(id => id !== centerId);
    } else {
      this.selectedCenterIds = [...this.selectedCenterIds, centerId];
    }
  }

  toggleAllCenters(checked: boolean) {
    const visibleIds = this.filteredAssignableCenters.map(c => c.id);
    if (checked) {
      this.selectedCenterIds = [...new Set([...this.selectedCenterIds, ...visibleIds])];
    } else {
      const visibleSet = new Set(visibleIds);
      this.selectedCenterIds = this.selectedCenterIds.filter(id => !visibleSet.has(id));
    }
  }

  openCreate() {
    this.closeView();
    this.closeCentersDialog();
    this.editingId = null;
    this.formError = '';
    this.showForm = true;
    this.form.reset({
      firstName: '',
      lastName: '',
      address: '',
      role: this.creatableRoles[0] ?? ROLES.VALIDATEUR,
      enabled: true
    });
    this.form.controls.email.enable();
    this.setCreatePasswordValidators();
  }

  openEdit(user: AdminUserDto) {
    this.closeView();
    this.closeCentersDialog();
    this.editingId = user.id;
    this.formError = '';
    this.showForm = true;
    this.form.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      address: user.address || '',
      email: user.email,
      phone: user.phone,
      role: user.role,
      enabled: user.enabled,
      password: ''
    });
    this.form.controls.email.disable();
    this.setEditPasswordValidators();
  }

  openEditFromView() {
    if (!this.viewingUser) return;
    this.openEdit(this.viewingUser);
  }

  cancelForm() {
    this.showForm = false;
    this.editingId = null;
    this.formError = '';
    this.submitting = false;
    this.form.controls.email.enable();
    this.setCreatePasswordValidators();
  }

  private setCreatePasswordValidators() {
    this.form.controls.password.setValidators([Validators.required, Validators.minLength(8)]);
    this.form.controls.password.updateValueAndValidity();
  }

  private setEditPasswordValidators() {
    this.form.controls.password.setValidators([Validators.minLength(8)]);
    this.form.controls.password.updateValueAndValidity();
  }

  private extractError(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'error' in err) {
      const body = (err as { error?: { message?: string } }).error;
      if (body?.message) return body.message;
    }
    return fallback;
  }

  openView(user: AdminUserDto) {
    this.viewingUser = user;
  }

  closeView() {
    this.viewingUser = null;
  }

  openCentersDialog(user: AdminUserDto) {
    this.closeView();
    this.cancelForm();
    this.centersUser = user;
    this.centersSearchQuery = '';
    this.selectedCenterIds = [...(user.centerIds || [])];
  }

  closeCentersDialog() {
    this.centersUser = null;
    this.centersError = '';
    this.centersSearchQuery = '';
    this.selectedCenterIds = [];
  }

  saveCenters() {
    if (!this.centersUser) return;

    this.savingCentersId = this.centersUser.id;
    this.error = '';
    this.centersError = '';
    this.success = '';

    this.admin.updateUser(this.centersUser.id, { centerIds: this.selectedCenterIds }).subscribe({
      next: () => {
        this.success = `Centres mis à jour pour « ${this.fullName(this.centersUser!)} »`;
        this.savingCentersId = null;
        this.closeCentersDialog();
        this.load();
      },
      error: err => {
        this.centersError = this.extractError(err, 'Mise à jour des centres impossible');
        this.savingCentersId = null;
      }
    });
  }

  submit() {
    if (this.editingId) {
      this.setEditPasswordValidators();
    } else {
      this.setCreatePasswordValidators();
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError = 'Veuillez corriger les champs du formulaire.';
      return;
    }

    this.error = '';
    this.formError = '';
    this.success = '';
    this.submitting = true;
    const value = this.form.getRawValue();
    const phone = (value.phone ?? '').toString().trim();
    const firstName = (value.firstName ?? '').toString().trim();
    const lastName = (value.lastName ?? '').toString().trim();
    const address = (value.address ?? '').toString().trim();

    if (this.editingId) {
      const payload: Record<string, unknown> = {
        firstName,
        lastName,
        address,
        phone,
        role: value.role,
        enabled: value.enabled
      };
      const password = (value.password ?? '').toString();
      if (password) payload['password'] = password;

      this.admin.updateUser(this.editingId, payload).subscribe({
        next: () => {
          this.success = 'Utilisateur mis à jour';
          this.submitting = false;
          this.cancelForm();
          this.load();
        },
        error: err => {
          this.formError = this.extractError(err, 'Mise à jour impossible');
          this.submitting = false;
        }
      });
    } else {
      const email = (value.email ?? '').toString().trim().toLowerCase();
      const password = (value.password ?? '').toString();

      if (password.length < 8) {
        this.formError = 'Le mot de passe doit contenir au moins 8 caractères.';
        this.submitting = false;
        return;
      }

      this.admin.createUser({
        email,
        phone,
        firstName,
        lastName,
        address,
        password,
        role: value.role!
      }).subscribe({
        next: () => {
          const role = value.role!;
          const needsCenters = role !== ROLES.SUPER_ADMIN;
          this.success = needsCenters
            ? 'Utilisateur créé. Associez-le aux centres via l’icône carte dans la liste.'
            : 'Utilisateur créé';
          this.submitting = false;
          this.cancelForm();
          this.load();
        },
        error: err => {
          this.formError = this.extractError(err, 'Création impossible');
          this.submitting = false;
        }
      });
    }
  }

  canModify(user: AdminUserDto): boolean {
    return user.role !== ROLES.SUPER_ADMIN;
  }

  canDeactivate(user: AdminUserDto): boolean {
    return user.enabled && this.canModify(user);
  }

  canActivate(user: AdminUserDto): boolean {
    return !user.enabled && this.canModify(user);
  }

  canDelete(user: AdminUserDto): boolean {
    return !user.enabled && this.canModify(user);
  }

  canResetPassword(user: AdminUserDto): boolean {
    return user.enabled && this.canModify(user);
  }

  deactivate(user: AdminUserDto) {
    if (!this.canDeactivate(user)) return;
    if (!confirm(`Désactiver le compte de « ${this.fullName(user)} » ?\nL'utilisateur ne pourra plus se connecter.`)) {
      return;
    }

    this.togglingStatusId = user.id;
    this.error = '';
    this.success = '';

    this.admin.updateUser(user.id, { enabled: false }).subscribe({
      next: () => {
        this.success = 'Compte désactivé';
        this.togglingStatusId = null;
        if (this.viewingUser?.id === user.id) this.closeView();
        this.load();
      },
      error: err => {
        this.error = err.error?.message || 'Désactivation impossible';
        this.togglingStatusId = null;
      }
    });
  }

  activate(user: AdminUserDto) {
    if (!this.canActivate(user)) return;
    if (!confirm(`Réactiver le compte de « ${this.fullName(user)} » ?`)) {
      return;
    }

    this.togglingStatusId = user.id;
    this.error = '';
    this.success = '';

    this.admin.updateUser(user.id, { enabled: true }).subscribe({
      next: () => {
        this.success = 'Compte réactivé';
        this.togglingStatusId = null;
        this.load();
      },
      error: err => {
        this.error = err.error?.message || 'Réactivation impossible';
        this.togglingStatusId = null;
      }
    });
  }

  resetPassword(user: AdminUserDto) {
    if (!this.canResetPassword(user)) return;
    if (!confirm(`Réinitialiser le mot de passe de « ${this.fullName(user)} » ?\nUn mot de passe temporaire sera envoyé par email.`)) {
      return;
    }

    this.resettingId = user.id;
    this.error = '';
    this.success = '';

    this.admin.resetUserPassword(user.id).subscribe({
      next: res => {
        this.success = res.message || 'Mot de passe temporaire envoyé par email';
        this.resettingId = null;
        this.load();
      },
      error: err => {
        this.error = err.error?.message || 'Réinitialisation impossible';
        this.resettingId = null;
      }
    });
  }

  remove(user: AdminUserDto) {
    if (!this.canDelete(user)) {
      this.error = 'Seuls les comptes désactivés peuvent être supprimés.';
      return;
    }
    if (!confirm(`Supprimer définitivement le compte de « ${this.fullName(user)} » ?\nCette action est irréversible.`)) {
      return;
    }

    this.removingId = user.id;
    this.error = '';
    this.success = '';

    this.admin.deleteUser(user.id).subscribe({
      next: () => {
        this.success = 'Compte supprimé';
        this.removingId = null;
        if (this.viewingUser?.id === user.id) this.closeView();
        this.load();
      },
      error: err => {
        this.error = err.error?.message || 'Suppression impossible';
        this.removingId = null;
      }
    });
  }
}
