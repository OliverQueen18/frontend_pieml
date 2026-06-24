import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { AdminService } from '../../core/admin.service';
import { TypeDocumentDto } from '../../models';

@Component({
  selector: 'app-admin-type-documents',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './type-documents.component.html',
  styleUrl: './type-documents.component.scss'
})
export class AdminTypeDocumentsComponent implements OnInit {
  private admin = inject(AdminService);
  private fb = inject(FormBuilder);

  types: TypeDocumentDto[] = [];
  searchQuery = '';
  error = '';
  success = '';
  showForm = false;
  editingId: number | null = null;
  togglingId: number | null = null;

  form = this.fb.group({
    code: ['', Validators.required],
    libelle: ['', Validators.required],
    description: [''],
    obligatoire: [true],
    actif: [true],
    ordre: [1, Validators.required]
  });

  ngOnInit() {
    this.load();
  }

  get filteredTypes(): TypeDocumentDto[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.types;
    return this.types.filter(t =>
      t.code.toLowerCase().includes(q) ||
      t.libelle.toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q)
    );
  }

  load() {
    this.admin.listTypeDocuments().subscribe({
      next: res => this.types = res.data,
      error: err => this.error = err.error?.message || 'Erreur de chargement'
    });
  }

  openCreate() {
    this.editingId = null;
    this.error = '';
    this.showForm = true;
    this.form.reset({ obligatoire: true, actif: true, ordre: this.types.length + 1 });
  }

  openEdit(type: TypeDocumentDto) {
    this.editingId = type.id;
    this.error = '';
    this.showForm = true;
    this.form.patchValue(type);
  }

  cancelForm() {
    this.showForm = false;
    this.editingId = null;
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const payload = {
      code: value.code!,
      libelle: value.libelle!,
      description: value.description || '',
      obligatoire: !!value.obligatoire,
      actif: !!value.actif,
      ordre: Number(value.ordre)
    };

    const req = this.editingId
      ? this.admin.updateTypeDocument(this.editingId, payload)
      : this.admin.createTypeDocument(payload);

    req.subscribe({
      next: () => {
        this.success = this.editingId ? 'Type mis à jour' : 'Type créé';
        this.cancelForm();
        this.load();
      },
      error: err => this.error = err.error?.message || 'Enregistrement impossible'
    });
  }

  toggleActive(type: TypeDocumentDto) {
    const nextActive = !type.actif;
    const label = nextActive ? 'activer' : 'désactiver';
    if (!confirm(`${nextActive ? 'Activer' : 'Désactiver'} le type « ${type.libelle} » ?`)) return;

    this.togglingId = type.id;
    this.error = '';
    this.admin.updateTypeDocument(type.id, {
      code: type.code,
      libelle: type.libelle,
      description: type.description || '',
      obligatoire: type.obligatoire,
      actif: nextActive,
      ordre: type.ordre
    }).subscribe({
      next: () => {
        this.success = `Type ${nextActive ? 'activé' : 'désactivé'}`;
        this.togglingId = null;
        this.load();
      },
      error: err => {
        this.error = err.error?.message || `Impossible de ${label} ce type`;
        this.togglingId = null;
      }
    });
  }

  remove(id: number) {
    if (!confirm('Supprimer ou désactiver ce type de document ?')) return;
    this.admin.deleteTypeDocument(id).subscribe({
      next: () => {
        this.success = 'Type supprimé ou désactivé';
        this.load();
      },
      error: err => this.error = err.error?.message || 'Suppression impossible'
    });
  }
}
