import { Component } from '@angular/core';
import { FAQ_ITEMS, FaqItem } from './faq.data';

@Component({
  selector: 'app-faq-accordion',
  standalone: true,
  templateUrl: './faq-accordion.component.html',
  styleUrl: './faq-accordion.component.scss'
})
export class FaqAccordionComponent {
  items: FaqItem[] = FAQ_ITEMS.map(item => ({ ...item }));

  toggle(item: FaqItem) {
    item.open = !item.open;
  }
}
