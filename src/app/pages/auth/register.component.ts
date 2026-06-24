import { Component, ElementRef, OnDestroy, QueryList, ViewChildren, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { GeoCoordinates, OsmLocationPickerComponent } from '../../shared/osm-location-picker.component';

interface RegistrationStep {
  num: number;
  icon: string;
  title: string;
  desc: string;
  active?: boolean;
  done?: boolean;
}

interface CountryCode {
  code: string;
  label: string;
  flag: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, OsmLocationPickerComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnDestroy {
  @ViewChildren('ninaInput') ninaInputs!: QueryList<ElementRef<HTMLInputElement>>;
  @ViewChildren('phoneInput') phoneInputs!: QueryList<ElementRef<HTMLInputElement>>;

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly ninaLength = 15;
  readonly ninaIndexes = Array.from({ length: this.ninaLength }, (_, i) => i);
  readonly phoneLength = 8;
  readonly phoneIndexes = Array.from({ length: this.phoneLength }, (_, i) => i);
  readonly emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  countryCodes: CountryCode[] = [
    { code: '+223', label: 'Mali', flag: '🇲🇱' },
    { code: '+221', label: 'Sénégal', flag: '🇸🇳' },
    { code: '+226', label: 'Burkina Faso', flag: '🇧🇫' },
    { code: '+227', label: 'Niger', flag: '🇳🇪' },
    { code: '+225', label: 'Côte d\'Ivoire', flag: '🇨🇮' },
    { code: '+224', label: 'Guinée', flag: '🇬🇳' },
    { code: '+228', label: 'Togo', flag: '🇹🇬' },
    { code: '+229', label: 'Bénin', flag: '🇧🇯' },
    { code: '+233', label: 'Ghana', flag: '🇬🇭' },
    { code: '+212', label: 'Maroc', flag: '🇲🇦' },
    { code: '+33', label: 'France', flag: '🇫🇷' }
  ];

  loading = false;
  showPassword = false;
  error = '';
  geoError = '';
  otpProgress = 0;
  otpStepIndex = 0;

  readonly otpSendSteps = [
    'Vérification de vos informations',
    'Création de votre compte citoyen',
    'Envoi du code OTP par email',
    'Préparation de la vérification'
  ];

  private otpProgressTimer?: ReturnType<typeof setInterval>;

  registrationSteps: RegistrationStep[] = [
    { num: 1, icon: 'pi-user-plus', title: 'Créer un compte', desc: 'Identité, NINA, contact et adresse', active: true },
    { num: 2, icon: 'pi-shield', title: 'Déclarer l\'engin', desc: 'Marque, modèle, châssis et cylindrée' },
    { num: 3, icon: 'pi-cloud-upload', title: 'Téléverser les documents', desc: 'Carte NINA, facture, photos…' },
    { num: 4, icon: 'pi-wallet', title: 'Effectuer le paiement', desc: '12 000 FCFA via Trésor Pay' },
    { num: 5, icon: 'pi-calendar-plus', title: 'Obtenir un rendez-vous', desc: 'Centre, date et heure' },
    { num: 6, icon: 'pi-check-circle', title: 'Immatriculation', desc: 'Présentez-vous avec vos originaux' }
  ];

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    ninaDigits: this.fb.array(
      Array.from({ length: this.ninaLength }, () =>
        this.fb.control('', [Validators.required, Validators.pattern(/^[A-Za-z0-9]$/)])
      )
    ),
    phoneCountryCode: ['+223', Validators.required],
    phoneDigits: this.fb.array(
      Array.from({ length: this.phoneLength }, () =>
        this.fb.control('', [Validators.required, Validators.pattern(/^[0-9]$/)])
      )
    ),
    email: ['', [Validators.required, Validators.pattern(this.emailPattern)]],
    address: ['', [Validators.required, Validators.maxLength(500)]],
    latitude: [null as number | null, [Validators.required, Validators.min(-90), Validators.max(90)]],
    longitude: [null as number | null, [Validators.required, Validators.min(-180), Validators.max(180)]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  get ninaDigits(): FormArray {
    return this.form.get('ninaDigits') as FormArray;
  }

  get phoneDigits(): FormArray {
    return this.form.get('phoneDigits') as FormArray;
  }

  toUppercase(field: 'firstName' | 'lastName') {
    const control = this.form.get(field);
    const value = (control?.value ?? '').toString().toUpperCase();
    if (control?.value !== value) {
      control?.setValue(value, { emitEvent: false });
    }
  }

  onNinaInput(index: number, event: Event) {
    this.onDigitInput(this.ninaDigits, this.ninaLength, index, event, /[^A-Za-z0-9]/g, true, i => this.focusNina(i));
  }

  onNinaKeydown(index: number, event: KeyboardEvent) {
    this.onDigitKeydown(this.ninaDigits, this.ninaLength, index, event, /^[A-Za-z0-9]$/, i => this.focusNina(i));
  }

  onNinaPaste(event: ClipboardEvent) {
    this.onDigitPaste(event, this.ninaDigits, this.ninaLength, this.ninaIndexes, /[^A-Za-z0-9]/g, true, i => this.focusNina(i));
  }

  onPhoneInput(index: number, event: Event) {
    this.onDigitInput(this.phoneDigits, this.phoneLength, index, event, /[^0-9]/g, false, i => this.focusPhone(i));
  }

  onPhoneKeydown(index: number, event: KeyboardEvent) {
    this.onDigitKeydown(this.phoneDigits, this.phoneLength, index, event, /^[0-9]$/, i => this.focusPhone(i));
  }

  onPhonePaste(event: ClipboardEvent) {
    this.onDigitPaste(event, this.phoneDigits, this.phoneLength, this.phoneIndexes, /[^0-9]/g, false, i => this.focusPhone(i));
  }

  ngOnDestroy() {
    this.stopOtpProgress();
  }

  onLocationSelected(coords: GeoCoordinates | null) {
    this.geoError = '';
    if (!coords) {
      this.form.patchValue({ latitude: null, longitude: null });
      this.form.controls.latitude.markAsTouched();
      this.form.controls.longitude.markAsTouched();
      return;
    }
    this.form.patchValue({
      latitude: coords.latitude,
      longitude: coords.longitude
    });
  }

  submit() {
    this.ninaDigits.markAllAsTouched();
    this.phoneDigits.markAllAsTouched();
    this.form.controls.email.markAsTouched();

    if (this.form.invalid) {
      if (!this.form.controls.latitude.value || !this.form.controls.longitude.value) {
        this.geoError = 'Veuillez saisir une adresse valide ou sélectionner un point sur la carte.';
      }
      return;
    }

    this.loading = true;
    this.error = '';
    this.geoError = '';
    this.startOtpProgress();
    const value = this.form.getRawValue();
    const nina = this.ninaDigits.controls.map(c => (c.value ?? '').toString().toUpperCase()).join('');
    const phone = `${value.phoneCountryCode}${this.phoneDigits.controls.map(c => (c.value ?? '').toString()).join('')}`;

    this.auth.register({
      firstName: value.firstName!.trim().toUpperCase(),
      lastName: value.lastName!.trim().toUpperCase(),
      nina,
      phone,
      email: value.email!.trim().toLowerCase(),
      address: value.address!.trim(),
      latitude: Number(value.latitude),
      longitude: Number(value.longitude),
      password: value.password!
    }).subscribe({
      next: () => {
        this.completeOtpProgress(() => {
          sessionStorage.setItem('pendingEmail', value.email!.trim().toLowerCase());
          sessionStorage.setItem('pendingOtpSentAt', String(Date.now()));
          this.router.navigate(['/verification-otp']);
        });
      },
      error: err => {
        this.error = err.error?.message || 'Erreur lors de l\'inscription';
        this.stopOtpProgress();
        this.loading = false;
      }
    });
  }

  private startOtpProgress() {
    this.stopOtpProgress();
    this.otpProgress = 0;
    this.otpStepIndex = 0;
    this.otpProgressTimer = setInterval(() => {
      if (this.otpProgress >= 92) return;
      this.otpProgress = Math.min(92, this.otpProgress + 2);
      if (this.otpProgress >= 22) this.otpStepIndex = 1;
      if (this.otpProgress >= 52) this.otpStepIndex = 2;
      if (this.otpProgress >= 78) this.otpStepIndex = 3;
    }, 140);
  }

  private completeOtpProgress(onDone: () => void) {
    if (this.otpProgressTimer) {
      clearInterval(this.otpProgressTimer);
      this.otpProgressTimer = undefined;
    }
    this.otpProgress = 100;
    this.otpStepIndex = this.otpSendSteps.length - 1;
    setTimeout(onDone, 450);
  }

  private stopOtpProgress() {
    if (this.otpProgressTimer) {
      clearInterval(this.otpProgressTimer);
      this.otpProgressTimer = undefined;
    }
    this.otpProgress = 0;
    this.otpStepIndex = 0;
  }

  private onDigitInput(
    digits: FormArray,
    length: number,
    index: number,
    event: Event,
    stripPattern: RegExp,
    uppercase: boolean,
    focus: (index: number) => void
  ) {
    const input = event.target as HTMLInputElement;
    let raw = input.value.replace(stripPattern, '');
    if (uppercase) raw = raw.toUpperCase();

    if (!raw) {
      digits.at(index).setValue('', { emitEvent: false });
      input.value = '';
      return;
    }

    if (raw.length === 1) {
      digits.at(index).setValue(raw, { emitEvent: false });
      input.value = raw;
      if (index < length - 1) focus(index + 1);
      return;
    }

    raw.split('').forEach((char, offset) => {
      const target = index + offset;
      if (target < length) digits.at(target).setValue(char, { emitEvent: false });
    });
    this.syncDigitDomValues(digits, digits === this.ninaDigits ? this.ninaInputs : this.phoneInputs);
    focus(Math.min(index + raw.length - 1, length - 1));
  }

  private onDigitKeydown(
    digits: FormArray,
    length: number,
    index: number,
    event: KeyboardEvent,
    allowedPattern: RegExp,
    focus: (index: number) => void
  ) {
    const key = event.key;
    if (!key) return;

    const current = (digits.at(index).value ?? '').toString();

    if (
      key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      key !== 'Backspace' &&
      key !== 'Delete' &&
      !allowedPattern.test(key)
    ) {
      event.preventDefault();
    }

    if (key === 'Backspace') {
      if (current) {
        digits.at(index).setValue('', { emitEvent: false });
      } else if (index > 0) {
        event.preventDefault();
        digits.at(index - 1).setValue('', { emitEvent: false });
        focus(index - 1);
      }
      return;
    }

    if (key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focus(index - 1);
      return;
    }

    if (key === 'ArrowRight' && index < length - 1) {
      event.preventDefault();
      focus(index + 1);
    }
  }

  private onDigitPaste(
    event: ClipboardEvent,
    digits: FormArray,
    length: number,
    indexes: number[],
    stripPattern: RegExp,
    uppercase: boolean,
    focus: (index: number) => void
  ) {
    event.preventDefault();
    let pasted = (event.clipboardData?.getData('text') ?? '').replace(stripPattern, '');
    if (uppercase) pasted = pasted.toUpperCase();
    pasted = pasted.slice(0, length);

    indexes.forEach(i => digits.at(i).setValue('', { emitEvent: false }));
    pasted.split('').forEach((char, i) => digits.at(i).setValue(char, { emitEvent: false }));
    this.syncDigitDomValues(digits, digits === this.ninaDigits ? this.ninaInputs : this.phoneInputs);
    focus(Math.min(Math.max(pasted.length - 1, 0), length - 1));
  }

  private focusNina(index: number) {
    this.focusInput(this.ninaInputs, index);
  }

  private focusPhone(index: number) {
    this.focusInput(this.phoneInputs, index);
  }

  private focusInput(inputs: QueryList<ElementRef<HTMLInputElement>>, index: number) {
    const target = inputs?.toArray()[index]?.nativeElement;
    if (target) {
      target.focus();
      target.select();
    }
  }

  private syncDigitDomValues(digits: FormArray, inputs: QueryList<ElementRef<HTMLInputElement>>) {
    inputs?.toArray().forEach((ref, i) => {
      ref.nativeElement.value = (digits.at(i).value ?? '').toString();
    });
  }
}
