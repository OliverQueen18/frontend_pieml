import { Component, HostBinding, Input } from '@angular/core';

@Component({
  selector: 'app-state-logo',
  standalone: true,
  template: `
    <img
      src="assets/logo-etat.png"
      alt="République du Mali — Un Peuple, Un But, Une Foi"
      class="state-logo">
  `,
  styles: [`
    :host {
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .state-logo {
      height: 100px;
      width: auto;
      max-width: 280px;
      object-fit: contain;
      object-position: right center;
    }

    @media (max-width: 992px) {
      .state-logo {
        height: 44px;
        max-width: 200px;
      }
    }

    @media (max-width: 768px) {
      :host:not(.mobile-visible) {
        display: none;
      }
    }
  `]
})
export class StateLogoComponent {
  @Input() mobileVisible = false;

  @HostBinding('class.mobile-visible')
  get mobileClass() {
    return this.mobileVisible;
  }
}
