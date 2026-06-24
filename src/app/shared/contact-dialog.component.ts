import { Component, ViewChild } from '@angular/core';
import { ContactFormComponent } from './contact-form.component';

@Component({
  selector: 'app-contact-dialog',
  standalone: true,
  imports: [ContactFormComponent],
  templateUrl: './contact-dialog.component.html',
  styleUrl: './contact-dialog.component.scss'
})
export class ContactDialogComponent {
  @ViewChild(ContactFormComponent) contactForm?: ContactFormComponent;

  visible = false;

  open() {
    this.visible = true;
    setTimeout(() => this.contactForm?.resetForm(), 0);
  }

  close() {
    this.contactForm?.resetForm();
    this.visible = false;
  }
}
