import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { AdminService } from '../../core/admin.service';
import { VehicleLookupDto } from '../../models';

@Component({
  selector: 'app-admin-vehicle-brands',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './vehicle-brands.component.html',
  styleUrl: './vehicle-brands.component.scss'
})
export class AdminVehicleBrandsComponent implements OnInit {
  private admin = inject(AdminService);
  private fb = inject(FormBuilder);

  brands: VehicleLookupDto[] = [];
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
    actif: [true],
    ordre: [1, Validators.required]
  });

  ngOnInit() {
    this.load();
  }

  get filteredBrands(): VehicleLookupDto[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.brands;
    return this.brands.filter(b =>
      b.code.toLowerCase().includes(q) ||
      b.libelle.toLowerCase().includes(q) ||
      (b.description || '').toLowerCase().includes(q)
    );
  }

  load() {
    this.admin.listVehicleBrands().subscribe({
      next: res => this.brands = res.data,
      error: err => this.error = err.error?.message || 'Erreur de chargement'
    });
  }

  openCreate() {
    this.editingId = null;
    this.error = '';
    this.showForm = true;
    this.form.reset({ actif: true, ordre: this.brands.length + 1 });
  }

  openEdit(brand: VehicleLookupDto) {
    this.editingId = brand.id;
    this.error = '';
    this.showForm = true;
    this.form.patchValue(brand);
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
      actif: !!value.actif,
      ordre: Number(value.ordre)
    };

    const req = this.editingId
      ? this.admin.updateVehicleBrand(this.editingId, payload)
      : this.admin.createVehicleBrand(payload);

    req.subscribe({
      next: () => {
        this.success = this.editingId ? 'Marque mise à jour' : 'Marque créée';
        this.cancelForm();
        this.load();
      },
      error: err => this.error = err.error?.message || 'Enregistrement impossible'
    });
  }

  toggleActive(brand: VehicleLookupDto) {
    const nextActive = !brand.actif;
    const label = nextActive ? 'activer' : 'désactiver';
    if (!confirm(`${nextActive ? 'Activer' : 'Désactiver'} la marque « ${brand.libelle} » ?`)) return;

    this.togglingId = brand.id;
    this.error = '';
    this.admin.updateVehicleBrand(brand.id, {
      code: brand.code,
      libelle: brand.libelle,
      description: brand.description || '',
      actif: nextActive,
      ordre: brand.ordre
    }).subscribe({
      next: () => {
        this.success = `Marque ${nextActive ? 'activée' : 'désactivée'}`;
        this.togglingId = null;
        this.load();
      },
      error: err => {
        this.error = err.error?.message || `Impossible de ${label} cette marque`;
        this.togglingId = null;
      }
    });
  }

  remove(id: number) {
    if (!confirm('Supprimer ou désactiver cette marque ?')) return;
    this.admin.deleteVehicleBrand(id).subscribe({
      next: () => {
        this.success = 'Marque supprimée ou désactivée';
        this.load();
      },
      error: err => this.error = err.error?.message || 'Suppression impossible'
    });
  }
}
