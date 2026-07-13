import { Component } from '@angular/core';
import { APP_VERSION } from '../core/app-version';

@Component({
  selector: 'app-version-footer',
  standalone: true,
  template: `
    <footer class="app-version-footer" aria-label="Version de l'application">
      <span>PIEML v{{ version }}</span>
    </footer>
  `,
  styles: `
    .app-version-footer {
      flex-shrink: 0;
      padding: 0.55rem 1rem;
      text-align: center;
      font-size: 0.72rem;
      letter-spacing: 0.02em;
      color: var(--pie-muted, #64748b);
      background: transparent;
      border-top: 1px solid rgba(148, 163, 184, 0.25);
    }
  `
})
export class VersionFooterComponent {
  readonly version = APP_VERSION;
}
