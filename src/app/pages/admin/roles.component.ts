import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { AdminService } from '../../core/admin.service';
import { AuthService } from '../../core/auth.service';
import { groupPermissionsByCategory, PERMISSIONS, PermissionDto } from '../../core/permissions';
import { ROLE_LABELS, ROLES, ROLE_DESCRIPTIONS } from '../../core/roles';
import { AdminRoleDto } from '../../models';

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, FormsModule],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss'
})
export class AdminRolesComponent implements OnInit {
  private admin = inject(AdminService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  roles: AdminRoleDto[] = [];
  permissionCatalog: PermissionDto[] = [];
  searchQuery = '';
  error = '';
  success = '';
  showForm = false;
  showPermissions = false;
  viewingRole: AdminRoleDto | null = null;
  permissionsRole: AdminRoleDto | null = null;
  selectedPermissions: string[] = [];
  editingId: number | null = null;
  togglingId: number | null = null;
  savingPermissions = false;
  roleLabels = ROLE_LABELS;
  roleDescriptions = ROLE_DESCRIPTIONS;
  allRoleCodes = Object.values(ROLES);
  readonly ROLES = ROLES;
  readonly canManagePermissions = () => this.auth.hasPermission(PERMISSIONS.ROLES_MANAGE);

  form = this.fb.group({
    code: ['', Validators.required],
    label: ['', Validators.required],
    description: [''],
    active: [true]
  });

  ngOnInit() {
    this.load();
    this.admin.listPermissionsCatalog().subscribe({
      next: res => this.permissionCatalog = res.data,
      error: () => {}
    });
  }

  get permissionGroups() {
    return groupPermissionsByCategory(this.permissionCatalog);
  }

  get filteredRoles(): AdminRoleDto[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.roles;
    return this.roles.filter(r =>
      r.code.toLowerCase().includes(q) ||
      r.label.toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q) ||
      (r.permissions || []).some(p => p.toLowerCase().includes(q))
    );
  }

  get canCreateRole(): boolean {
    return this.availableCodesForCreate.length > 0;
  }

  get predefinedRoleCount(): number {
    return this.allRoleCodes.length;
  }

  roleDescription(code: string): string {
    const role = this.roles.find(r => r.code === code);
    return role?.description || this.roleDescriptions[code] || '';
  }

  get availableCodesForCreate(): string[] {
    const existing = new Set(this.roles.map(r => r.code));
    return this.allRoleCodes.filter(c => !existing.has(c));
  }

  permissionCount(role: AdminRoleDto): number {
    return role.permissions?.length ?? 0;
  }

  load() {
    this.admin.listRoles().subscribe({
      next: res => this.roles = res.data,
      error: err => this.error = err.error?.message || 'Erreur de chargement'
    });
  }

  openCreate() {
    this.error = '';
    this.success = '';
    this.closeView();
    this.closePermissions();
    this.editingId = null;
    this.showForm = true;
    const codes = this.availableCodesForCreate;
    if (codes.length) {
      const code = codes[0];
      this.form.reset({
        code,
        label: this.roleLabels[code] || '',
        description: '',
        active: true
      });
    } else {
      this.form.reset({ code: '', label: '', description: '', active: true });
    }
    this.form.controls.code.enable();
  }

  onCreateCodeChange(event: Event) {
    if (this.editingId) return;
    const code = (event.target as HTMLSelectElement).value;
    if (code && !this.form.controls.label.dirty) {
      this.form.patchValue({ label: this.roleLabels[code] || '' });
    }
  }

  openEdit(role: AdminRoleDto) {
    this.closeView();
    this.closePermissions();
    this.editingId = role.id;
    this.showForm = true;
    this.form.patchValue({
      code: role.code,
      label: role.label,
      description: role.description || '',
      active: role.active
    });
    this.form.controls.code.disable();
  }

  openPermissions(role: AdminRoleDto) {
    if (!this.canManagePermissions()) {
      this.error = 'Vous n\'avez pas la permission de gérer les droits.';
      return;
    }
    this.closeView();
    this.cancelForm();
    this.permissionsRole = role;
    this.selectedPermissions = [...(role.permissions || [])];
    this.showPermissions = true;
  }

  closePermissions() {
    this.showPermissions = false;
    this.permissionsRole = null;
    this.selectedPermissions = [];
  }

  isPermissionSelected(code: string): boolean {
    return this.selectedPermissions.includes(code);
  }

  togglePermission(code: string) {
    if (this.permissionsRole?.code === ROLES.SUPER_ADMIN) return;
    if (this.isPermissionSelected(code)) {
      this.selectedPermissions = this.selectedPermissions.filter(p => p !== code);
    } else {
      this.selectedPermissions = [...this.selectedPermissions, code];
    }
  }

  toggleCategory(items: PermissionDto[], select: boolean) {
    if (this.permissionsRole?.code === ROLES.SUPER_ADMIN) return;
    const codes = items.map(i => i.code);
    if (select) {
      const merged = new Set([...this.selectedPermissions, ...codes]);
      this.selectedPermissions = [...merged];
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(p => !codes.includes(p));
    }
  }

  isCategoryFullySelected(items: PermissionDto[]): boolean {
    return items.every(i => this.isPermissionSelected(i.code));
  }

  savePermissions() {
    if (!this.permissionsRole) return;
    this.savingPermissions = true;
    this.error = '';
    this.admin.updateRolePermissions(this.permissionsRole.id, this.selectedPermissions).subscribe({
      next: () => {
        this.success = 'Permissions mises à jour';
        this.savingPermissions = false;
        this.closePermissions();
        this.load();
      },
      error: err => {
        this.error = err.error?.message || 'Mise à jour impossible';
        this.savingPermissions = false;
      }
    });
  }

  openEditFromView() {
    if (!this.viewingRole) return;
    this.openEdit(this.viewingRole);
    this.viewingRole = null;
  }

  openPermissionsFromView() {
    if (!this.viewingRole) return;
    const role = this.viewingRole;
    this.closeView();
    this.openPermissions(role);
  }

  cancelForm() {
    this.showForm = false;
    this.editingId = null;
    this.form.controls.code.enable();
  }

  openView(role: AdminRoleDto) {
    this.viewingRole = role;
  }

  closeView() {
    this.viewingRole = null;
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.editingId && !this.canCreateRole) {
      return;
    }
    this.error = '';
    this.success = '';
    const value = this.form.getRawValue();
    const payload = {
      code: value.code!,
      label: value.label!,
      description: value.description || '',
      active: !!value.active
    };

    const req = this.editingId
      ? this.admin.updateRole(this.editingId, payload)
      : this.admin.createRole(payload);

    req.subscribe({
      next: () => {
        this.success = this.editingId ? 'Rôle mis à jour' : 'Rôle créé';
        this.cancelForm();
        this.load();
      },
      error: err => this.error = err.error?.message || 'Enregistrement impossible'
    });
  }

  toggleActive(role: AdminRoleDto) {
    if (role.systemRole && role.active) {
      this.error = 'Impossible de désactiver un rôle système.';
      return;
    }
    const next = !role.active;
    if (!confirm(`${next ? 'Activer' : 'Désactiver'} le rôle « ${role.label} » ?`)) return;

    this.togglingId = role.id;
    this.error = '';
    this.admin.updateRole(role.id, { code: role.code, label: role.label, description: role.description, active: next }).subscribe({
      next: () => {
        this.success = `Rôle ${next ? 'activé' : 'désactivé'}`;
        this.togglingId = null;
        this.load();
      },
      error: err => {
        this.error = err.error?.message || 'Mise à jour impossible';
        this.togglingId = null;
      }
    });
  }

  canDelete(role: AdminRoleDto): boolean {
    return !role.systemRole && role.userCount === 0;
  }

  remove(role: AdminRoleDto) {
    if (!this.canDelete(role)) {
      this.error = 'Ce rôle ne peut pas être supprimé.';
      return;
    }
    if (!confirm(`Supprimer le rôle « ${role.label} » ?`)) return;

    this.admin.deleteRole(role.id).subscribe({
      next: () => {
        this.success = 'Rôle supprimé';
        if (this.viewingRole?.id === role.id) this.closeView();
        this.load();
      },
      error: err => this.error = err.error?.message || 'Suppression impossible'
    });
  }

  permissionLabel(code: string): string {
    return this.permissionCatalog.find(p => p.code === code)?.label || code;
  }
}
