import { Component, Input, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AccountService } from '../core/account.service';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './contact-form.component.html',
  styleUrl: './contact-form.component.scss'
})
export class ContactFormComponent implements OnInit {
  @Input() authenticated = false;
  @Input() compact = false;

  private fb = inject(FormBuilder);
  private account = inject(AccountService);
  private auth = inject(AuthService);

  sending = false;
  error = '';
  success = '';

  readonly emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.pattern(this.emailPattern)]],
    subject: ['', [Validators.required, Validators.maxLength(200)]],
    message: ['', [Validators.required, Validators.maxLength(2000)]]
  });

  ngOnInit() {
    if (this.authenticated) {
      const user = this.auth.user();
      if (user) {
        this.form.patchValue({
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email
        });
      }
    }
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.sending = true;
    this.error = '';
    this.success = '';

    const value = this.form.getRawValue();
    const payload = {
      name: value.name!.trim(),
      email: value.email!.trim().toLowerCase(),
      subject: value.subject!.trim(),
      message: value.message!.trim()
    };

    const request = this.authenticated
      ? this.account.sendContact(payload)
      : this.account.sendPublicContact(payload);

    request.subscribe({
      next: res => {
        this.success = res.message || 'Message envoyé avec succès.';
        this.form.patchValue({ subject: '', message: '' });
        this.sending = false;
      },
      error: err => {
        this.error = err.error?.message || 'Impossible d\'envoyer le message';
        this.sending = false;
      }
    });
  }

  resetForm() {
    this.form.reset({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
    if (this.authenticated) {
      const user = this.auth.user();
      if (user) {
        this.form.patchValue({
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email
        });
      }
    }
    this.error = '';
    this.success = '';
    this.sending = false;
  }
}
