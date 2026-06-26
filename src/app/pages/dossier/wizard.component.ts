import { Component, OnInit, inject } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

import { Router } from '@angular/router';

import { CommonModule } from '@angular/common';

import { forkJoin } from 'rxjs';

import { DossierService } from '../../core/dossier.service';

import { AccountService } from '../../core/account.service';

import { COUNTRIES } from '../../core/countries';

import {

  AdminTariffDto,

  CenterDto,

  DocumentDto,

  DossierDto,

  VehicleCreateRequest,

  VehicleLookupDto

} from '../../models';

import { compressUploadFile } from '../../core/file-compression.util';
import { DossierQrComponent } from '../../shared/dossier-qr.component';



interface CenterWithDistance extends CenterDto {

  distanceKm?: number;

}



@Component({

  selector: 'app-dossier-wizard',

  standalone: true,

  imports: [ReactiveFormsModule, CommonModule, DossierQrComponent],

  templateUrl: './wizard.component.html',

  styleUrl: './wizard.component.scss'

})

export class DossierWizardComponent implements OnInit {

  private fb = inject(FormBuilder);

  private dossierService = inject(DossierService);

  private accountService = inject(AccountService);

  private router = inject(Router);



  step = 1;

  loading = false;

  loadingPaymentData = false;

  error = '';

  success = '';

  dossier: DossierDto | null = null;



  vehicleBrands: VehicleLookupDto[] = [];

  vehicleTypes: VehicleLookupDto[] = [];

  registrationTariff: AdminTariffDto | null = null;

  sortedCenters: CenterWithDistance[] = [];



  selectedPaymentMethod = 'TRESOR_PAY';



  readonly countries = COUNTRIES;

  readonly minYear = 1980;

  readonly maxYear = new Date().getFullYear();



  vehicleForm = this.fb.group({

    brandId: [null as number | null, Validators.required],

    vehicleTypeId: [null as number | null, Validators.required],

    brandOther: [''],

    model: ['', Validators.required],

    engineCapacity: ['125CC'],

    engineNumber: [''],

    chassisNumber: ['', Validators.required],

    color: ['', Validators.required],

    year: [String(this.maxYear), [

      Validators.required,

      Validators.pattern(/^\d{4}$/),

      this.yearRangeValidator.bind(this)

    ]],

    countryOfOrigin: ['']

  });



  paymentForm = this.fb.group({

    centerId: [null as number | null, Validators.required]

  });



  uploadProgress: Record<number, boolean> = {};



  private readonly vehicleUppercaseFields = [

    'brandOther', 'model', 'engineCapacity', 'engineNumber', 'chassisNumber', 'color'

  ] as const;



  ngOnInit() {

    this.dossierService.getVehicleBrands().subscribe({

      next: res => this.vehicleBrands = res.data || [],

      error: () => this.error = 'Impossible de charger les marques'

    });



    this.dossierService.getVehicleTypes().subscribe({

      next: res => this.vehicleTypes = res.data || [],

      error: () => this.error = 'Impossible de charger les types d\'engin'

    });



    this.vehicleForm.get('brandId')?.valueChanges.subscribe(() => this.updateBrandOtherValidator());

  }



  get isOtherBrandSelected(): boolean {

    const brandId = this.vehicleForm.value.brandId;

    const brand = this.vehicleBrands.find(b => b.id === brandId);

    return brand?.code === 'AUTRE';

  }



  get totalFee(): number {

    if (!this.registrationTariff) return 0;

    return this.registrationTariff.amount + (this.registrationTariff.serviceFee || 0);

  }



  get selectedCenter(): CenterWithDistance | undefined {

    const centerId = this.paymentForm.value.centerId;

    return this.sortedCenters.find(c => c.id === centerId);

  }



  get selectedVehicleTypeLabel(): string {

    const vehicleTypeId = this.vehicleForm.value.vehicleTypeId;

    const fromForm = this.vehicleTypes.find(v => v.id === vehicleTypeId)?.libelle;

    return fromForm || this.dossier?.vehicle?.vehicleType || '—';

  }



  formatFcfa(amount: number): string {

    return `${amount.toLocaleString('fr-FR')} FCFA`;

  }



  private updateBrandOtherValidator() {

    const control = this.vehicleForm.get('brandOther');

    if (this.isOtherBrandSelected) {

      control?.setValidators([Validators.required]);

    } else {

      control?.clearValidators();

      control?.setValue('', { emitEvent: false });

    }

    control?.updateValueAndValidity({ emitEvent: false });

  }



  get documents(): DocumentDto[] {

    return this.dossier?.documents ?? [];

  }



  toUppercase(field: typeof this.vehicleUppercaseFields[number]) {

    const control = this.vehicleForm.get(field);

    const value = (control?.value ?? '').toString().toUpperCase();

    if (control?.value !== value) {

      control?.setValue(value, { emitEvent: false });

    }

  }



  onYearInput() {

    const control = this.vehicleForm.get('year');

    const digits = (control?.value ?? '').toString().replace(/\D/g, '').slice(0, 4);

    control?.setValue(digits, { emitEvent: false });

    control?.updateValueAndValidity({ emitEvent: false });

  }



  private yearRangeValidator(control: AbstractControl): ValidationErrors | null {

    const raw = (control.value ?? '').toString();

    if (!/^\d{4}$/.test(raw)) return null;

    const year = Number(raw);

    return year >= this.minYear && year <= this.maxYear ? null : { invalidYear: true };

  }



  createDossier() {

    this.updateBrandOtherValidator();

    if (this.vehicleForm.invalid) {

      this.vehicleForm.markAllAsTouched();

      return;

    }



    this.loading = true;

    this.error = '';

    const value = this.vehicleForm.getRawValue();

    const payload: VehicleCreateRequest = {

      brandId: value.brandId!,

      vehicleTypeId: value.vehicleTypeId!,

      model: value.model!.trim().toUpperCase(),

      engineCapacity: (value.engineCapacity ?? '').toString().trim().toUpperCase(),

      chassisNumber: value.chassisNumber!.trim().toUpperCase(),

      color: value.color!.trim().toUpperCase(),

      year: Number(value.year),

      countryOfOrigin: (value.countryOfOrigin ?? '').toString().trim()

    };



    const engineNumber = (value.engineNumber ?? '').toString().trim().toUpperCase();

    if (engineNumber) {

      payload.engineNumber = engineNumber;

    }



    if (this.isOtherBrandSelected) {

      payload.brandOther = value.brandOther!.trim().toUpperCase();

    }



    this.dossierService.createDossier(payload).subscribe({

      next: res => {

        this.dossier = res.data;

        this.step = 2;

        this.loading = false;

      },

      error: err => {

        this.error = err.error?.message || 'Erreur création dossier';

        this.loading = false;

      }

    });

  }



  async onFileSelected(typeDocumentId: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.dossier) return;

    this.error = '';
    this.uploadProgress[typeDocumentId] = true;

    try {
      const uploadFile = await compressUploadFile(file);
      this.dossierService.uploadDocument(this.dossier.id, typeDocumentId, uploadFile).subscribe({
        next: res => {
          this.dossier = res.data;
          this.uploadProgress[typeDocumentId] = false;
          input.value = '';
        },
        error: err => {
          this.error = err.error?.message || 'Erreur upload';
          this.uploadProgress[typeDocumentId] = false;
          input.value = '';
        }
      });
    } catch {
      this.error = 'Impossible de préparer le fichier';
      this.uploadProgress[typeDocumentId] = false;
      input.value = '';
    }
  }



  allRequiredDocsUploaded(): boolean {

    return this.documents

      .filter(d => d.typeDocument.obligatoire)

      .every(d => d.status === 'UPLOADED');

  }



  goToPayment() {

    if (!this.dossier) return;



    this.loading = true;

    this.dossierService.submitDossier(this.dossier.id).subscribe({

      next: res => {

        this.dossier = res.data;

        this.step = 3;

        this.success = 'Dossier enregistré. Un email avec votre QR code vous a été envoyé.';

        this.loading = false;

        this.loadPaymentData();

      },

      error: err => {

        this.error = err.error?.message || 'Documents manquants';

        this.loading = false;

      }

    });

  }



  private loadPaymentData() {

    this.loadingPaymentData = true;

    forkJoin({

      tariffs: this.dossierService.getPublicTariffs(),

      centers: this.dossierService.getCenters(),

      profile: this.accountService.getProfile()

    }).subscribe({

      next: ({ tariffs, centers, profile }) => {

        const activeTariffs = tariffs.data || [];

        this.registrationTariff = activeTariffs.find(t => t.code === 'REGISTRATION') ?? activeTariffs[0] ?? null;

        this.sortedCenters = this.sortCentersByProximity(centers.data || [], profile.data);

        if (this.sortedCenters.length > 0) {

          this.paymentForm.patchValue({ centerId: this.sortedCenters[0].id });

        }

        this.loadingPaymentData = false;

      },

      error: () => {

        this.error = 'Impossible de charger les tarifs ou les centres';

        this.loadingPaymentData = false;

      }

    });

  }



  private sortCentersByProximity(centers: CenterDto[], profile: { latitude: number; longitude: number }): CenterWithDistance[] {

    return centers

      .map(center => ({

        ...center,

        distanceKm: center.latitude != null && center.longitude != null

          ? this.haversineKm(profile.latitude, profile.longitude, center.latitude, center.longitude)

          : undefined

      }))

      .sort((a, b) => {

        if (a.distanceKm == null && b.distanceKm == null) {

          return a.city.localeCompare(b.city, 'fr');

        }

        if (a.distanceKm == null) return 1;

        if (b.distanceKm == null) return -1;

        return a.distanceKm - b.distanceKm;

      });

  }



  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {

    const toRad = (deg: number) => deg * Math.PI / 180;

    const dLat = toRad(lat2 - lat1);

    const dLon = toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) ** 2

      + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  }



  pay() {

    if (!this.dossier) return;

    if (this.paymentForm.invalid) {

      this.paymentForm.markAllAsTouched();

      this.error = 'Veuillez sélectionner un centre d\'immatriculation';

      return;

    }



    this.loading = true;

    this.error = '';

    const centerId = this.paymentForm.value.centerId!;

    this.dossierService.initiatePayment(this.dossier.id, this.selectedPaymentMethod, centerId).subscribe({

      next: () => {

        this.dossierService.confirmPayment(this.dossier!.id).subscribe({

          next: res => {

            this.dossier = res.data;

            this.step = 4;

            this.success = 'Paiement confirmé. Votre demande a été enregistrée avec succès.';

            this.loading = false;

          },

          error: err => {

            this.error = err.error?.message || 'Erreur paiement';

            this.loading = false;

          }

        });

      },

      error: err => {

        this.error = err.error?.message || 'Erreur paiement';

        this.loading = false;

      }

    });

  }



  finish() {

    this.router.navigate(['/tableau-de-bord']);

  }

}

