import { NgOptimizedImage } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-pieml-logo',
  standalone: true,
  imports: [NgOptimizedImage],
  template: `
    <img
      [ngSrc]="src"
      [width]="intrinsicWidth"
      [height]="intrinsicHeight"
      [alt]="alt"
      [class]="cssClass"
      [style.height.px]="height"
      [style.width.px]="displayWidth">
  `,
  styles: [`
    :host {
      display: inline-flex;
      line-height: 0;
    }

    img {
      object-fit: contain;
    }
  `]
})
export class PiemlLogoComponent {
  @Input() alt = 'PIEML — Plateforme d\'Immatriculation des Engins du Mali';
  @Input() cssClass = 'pieml-logo';
  @Input() height = 48;

  private static readonly XS = { src: 'assets/logo-pieml-xs.png', w: 168, h: 112 };
  private static readonly SM = { src: 'assets/logo-pieml-sm.png', w: 360, h: 240 };

  get asset() {
    return this.height <= 72 ? PiemlLogoComponent.XS : PiemlLogoComponent.SM;
  }

  get src() {
    return this.asset.src;
  }

  get intrinsicWidth() {
    return this.asset.w;
  }

  get intrinsicHeight() {
    return this.asset.h;
  }

  get displayWidth() {
    return Math.round(this.height * (this.intrinsicWidth / this.intrinsicHeight));
  }
}
