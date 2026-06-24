import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  inject
} from '@angular/core';
import * as L from 'leaflet';

interface NominatimResult {
  lat: string;
  lon: string;
}

@Component({
  selector: 'app-osm-map-view',
  standalone: true,
  template: `
    <div class="osm-map-view" [style.height]="height">
      <div
        #mapHost
        class="osm-map"
        role="img"
        [attr.aria-label]="address || 'Carte du centre'">
      </div>
      @if (loading) {
        <div class="osm-map-loading" aria-live="polite">
          <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
          <span>Chargement de la carte…</span>
        </div>
      }
      @if (mapError) {
        <p class="osm-map-error">{{ mapError }}</p>
      }
    </div>
  `,
  styles: [`
    .osm-map-view {
      position: relative;
      width: 100%;
    }
    .osm-map {
      width: 100%;
      height: 100%;
      border-radius: 10px;
      border: 1px solid var(--pie-border, #e2e8f0);
      overflow: hidden;
      background: #eef2f7;
    }
    .osm-map-loading {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      border-radius: 10px;
      background: rgba(248, 250, 252, 0.92);
      color: var(--pie-muted, #64748b);
      font-size: 0.82rem;
      z-index: 2;
    }
    .osm-map-loading i { color: var(--pie-green, #1aab4b); }
    .osm-map-error {
      margin: 0.45rem 0 0;
      font-size: 0.78rem;
      color: #b91c1c;
    }
    :host ::ng-deep .osm-marker-icon {
      background: transparent;
      border: none;
    }
    :host ::ng-deep .osm-marker-pin {
      width: 28px;
      height: 28px;
      margin-left: -14px;
      margin-top: -28px;
      background: var(--pie-green, #1aab4b);
      border: 2px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    }
    :host ::ng-deep .leaflet-control-attribution { font-size: 0.62rem; }
  `]
})
export class OsmMapViewComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapHost', { static: true }) mapHost!: ElementRef<HTMLDivElement>;

  @Input() latitude: number | null = null;
  @Input() longitude: number | null = null;
  @Input() address = '';
  @Input() height = '220px';
  @Input() zoom = 15;

  loading = true;
  mapError = '';

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private map?: L.Map;
  private marker?: L.Marker;
  private mapReady = false;
  private resizeObserver?: ResizeObserver;
  private invalidateTimer?: ReturnType<typeof setTimeout>;
  private readonly defaultCenter: L.LatLngExpression = [12.6392, -8.0029];

  ngAfterViewInit() {
    this.initMap();
    this.resizeObserver = new ResizeObserver(() => this.scheduleInvalidateSize(50));
    this.resizeObserver.observe(this.mapHost.nativeElement);
    setTimeout(() => this.resolveLocation(), 0);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.mapReady && (changes['latitude'] || changes['longitude'] || changes['address'])) {
      this.resolveLocation();
    }
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    if (this.invalidateTimer) clearTimeout(this.invalidateTimer);
    this.map?.remove();
    this.map = undefined;
  }

  private initMap() {
    this.map = L.map(this.mapHost.nativeElement, {
      center: this.defaultCenter,
      zoom: 12,
      scrollWheelZoom: false,
      dragging: true,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.map);

    this.map.whenReady(() => {
      this.mapReady = true;
      this.scheduleInvalidateSize(0);
    });
  }

  private resolveLocation() {
    this.setLoading(true);
    this.mapError = '';

    if (this.latitude != null && this.longitude != null) {
      this.showMarker(this.latitude, this.longitude);
      return;
    }

    const query = this.address.trim();
    if (query.length < 5) {
      this.setLoading(false);
      this.mapError = 'Adresse du centre indisponible pour afficher la carte.';
      return;
    }

    this.http.get<NominatimResult[]>(
      'https://nominatim.openstreetmap.org/search',
      {
        params: {
          q: query.includes('Mali') ? query : `${query}, Mali`,
          format: 'json',
          limit: '1',
          countrycodes: 'ml'
        },
        headers: { Accept: 'application/json' }
      }
    ).subscribe({
      next: results => {
        if (!results.length) {
          this.setLoading(false);
          this.mapError = 'Centre introuvable sur la carte.';
          return;
        }
        this.showMarker(Number(results[0].lat), Number(results[0].lon));
      },
      error: () => {
        this.setLoading(false);
        this.mapError = 'Impossible de charger la carte pour le moment.';
      }
    });
  }

  private showMarker(lat: number, lng: number) {
    if (!this.map) return;

    const latlng: L.LatLngExpression = [lat, lng];
    const icon = L.divIcon({
      className: 'osm-marker-icon',
      html: '<div class="osm-marker-pin"></div>',
      iconSize: [28, 28],
      iconAnchor: [14, 28]
    });

    this.whenMapReady(() => {
      if (this.marker) {
        this.marker.setLatLng(latlng);
      } else {
        this.marker = L.marker(latlng, { icon }).addTo(this.map!);
      }
      this.map!.setView(latlng, this.zoom, { animate: false });
      this.setLoading(false);
      this.scheduleInvalidateSize(100);
    });
  }

  private setLoading(value: boolean) {
    setTimeout(() => {
      this.loading = value;
      this.cdr.markForCheck();
    });
  }

  private whenMapReady(action: () => void) {
    if (this.mapReady) {
      action();
      return;
    }
    this.map?.whenReady(() => action());
  }

  private scheduleInvalidateSize(delay = 0) {
    if (this.invalidateTimer) clearTimeout(this.invalidateTimer);
    this.invalidateTimer = setTimeout(() => this.safeInvalidateSize(), delay);
  }

  private safeInvalidateSize() {
    if (!this.map) return;
    const el = this.mapHost.nativeElement;
    if (el.offsetWidth <= 0 || el.offsetHeight <= 0) return;
    try {
      this.map.invalidateSize({ animate: false });
    } catch { /* ignore */ }
  }
}
