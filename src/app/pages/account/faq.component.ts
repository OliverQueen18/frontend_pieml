import { Component } from '@angular/core';
import { FaqAccordionComponent } from '../../shared/faq-accordion.component';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [FaqAccordionComponent],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss'
})
export class FaqComponent {}
