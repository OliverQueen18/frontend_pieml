import { DecimalPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  inject
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { Subject, Subscription, debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs';

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

interface NominatimResult {
  lat: string;
  lon: string;
}

@Component({
  selector: 'app-osm-location-picker',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="osm-picker">
      <div class="osm-picker-head">
        <label>Localisation sur la carte</label>
        @if (loading) {
          <span class="osm-status"><i class="pi pi-spin pi-spinner"></i> Recherche…</span>
        } @else if (coordinates) {
          <span class="osm-status osm-status--ok">
            {{ coordinates.latitude | number:'1.4-6' }}, {{ coordinates.longitude | number:'1.4-6' }}
          </span>
        }
      </div>
      <div #mapHost class="osm-map" role="application" aria-label="Carte OpenStreetMap"></div>
      <button type="button" class="osm-locate-btn" (click)="useCurrentLocation()" [disabled]="locating">
        <i class="pi pi-map-marker"></i>
        {{ locating ? 'Localisation…' : 'Utiliser ma position actuelle' }}
      </button>
      @if (mapError) {
        <p class="osm-error">{{ mapError }}</p>
      }
    </div>
  `,
  styles: [`
    .osm-picker { margin-bottom: 0.85rem; }
    .osm-picker-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.45rem;
    }
    .osm-picker-head label {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--pie-navy);
    }
    .osm-status {
      font-size: 0.72rem;
      color: var(--pie-muted);
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }
    .osm-status--ok { color: var(--pie-green); font-weight: 600; }
    .osm-map {
      height: 220px;
      border-radius: 10px;
      border: 1px solid var(--pie-border);
      overflow: hidden;
      background: #eef2f7;
    }
    .osm-locate-btn {
      width: 100%;
      margin-top: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      padding: 0.55rem 0.75rem;
      border: 1px solid var(--pie-border);
      border-radius: 8px;
      background: white;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--pie-navy);
      font-family: inherit;
      cursor: pointer;
    }
    .osm-locate-btn:hover:not(:disabled) { border-color: var(--pie-green); background: #f8fafc; }
    .osm-locate-btn:disabled { opacity: 0.65; cursor: not-allowed; }
    .osm-locate-btn i { color: var(--pie-green); }
    .osm-error { color: #b91c1c; font-size: 0.78rem; margin-top: 0.35rem; }
    :host ::ng-deep .osm-marker-icon {
      background: transparent;
      border: none;
    }
    :host ::ng-deep .osm-marker-pin {
      width: 28px;
      height: 28px;
      margin-left: -14px;
      margin-top: -28px;
      background: var(--pie-green);
      border: 2px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    }
    :host ::ng-deep .leaflet-control-attribution { font-size: 0.62rem; }
  `]
})
export class OsmLocationPickerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapHost', { static: true }) mapHost!: ElementRef<HTMLDivElement>;

  @Input() address = '';
  @Input() latitude: number | null = null;
  @Input() longitude: number | null = null;
  @Input() requestLocationOnInit = false;
  @Output() locationSelected = new EventEmitter<GeoCoordinates | null>();

  loading = false;
  locating = false;
  mapError = '';
  coordinates: GeoCoordinates | null = null;

  private http = inject(HttpClient);
  private map?: L.Map;
  private marker?: L.Marker;
  private mapReady = false;
  private address$ = new Subject<string>();
  private addressSub?: Subscription;
  private resizeObserver?: ResizeObserver;
  private invalidateTimer?: ReturnType<typeof setTimeout>;
  private readonly defaultCenter: L.LatLngExpression = [12.6392, -8.0029];

  ngAfterViewInit() {
    this.initMap();
    this.resizeObserver = new ResizeObserver(() => this.scheduleInvalidateSize(50));
    this.resizeObserver.observe(this.mapHost.nativeElement);

    this.addressSub = this.address$
      .pipe(
        debounceTime(700),
        distinctUntilChanged(),
        filter(q => q.trim().length >= 5),
        switchMap(q => {
          this.loading = true;
          this.mapError = '';
          const query = `${q.trim()}, Mali`;
          return this.http.get<NominatimResult[]>(
            'https://nominatim.openstreetmap.org/search',
            {
              params: {
                q: query,
                format: 'json',
                limit: '1',
                countrycodes: 'ml'
              },
              headers: { Accept: 'application/json' }
            }
          );
        })
      )
      .subscribe({
        next: results => {
          this.loading = false;
          if (!results.length) {
            this.mapError = 'Adresse introuvable sur la carte. Affinez votre saisie ou cliquez sur la carte.';
            this.setCoordinates(null);
            return;
          }
          const lat = Number(results[0].lat);
          const lng = Number(results[0].lon);
          this.setCoordinates({ latitude: lat, longitude: lng }, true);
        },
        error: () => {
          this.loading = false;
          this.mapError = 'Impossible de géolocaliser cette adresse pour le moment.';
        }
      });

    if (this.address.trim().length >= 5) {
      this.address$.next(this.address);
    } else if (this.latitude != null && this.longitude != null) {
      this.whenMapReady(() => {
        this.setCoordinates({ latitude: this.latitude!, longitude: this.longitude! }, true);
        this.scheduleInvalidateSize(150);
      });
    } else if (this.requestLocationOnInit) {
      this.whenMapReady(() => this.useCurrentLocation(true));
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['address'] && !changes['address'].firstChange) {
      this.address$.next(this.address ?? '');
    }
    if ((changes['latitude'] || changes['longitude']) && !changes['latitude']?.firstChange) {
      if (this.latitude != null && this.longitude != null) {
        this.whenMapReady(() =>
          this.setCoordinates({ latitude: this.latitude!, longitude: this.longitude! }, true)
        );
      }
    }
  }

  ngOnDestroy() {
    this.addressSub?.unsubscribe();
    this.resizeObserver?.disconnect();
    if (this.invalidateTimer) clearTimeout(this.invalidateTimer);
    this.map?.remove();
    this.map = undefined;
  }

  useCurrentLocation(silentOnError = false) {
    if (!navigator.geolocation) {
      if (!silentOnError) {
        this.mapError = 'La géolocalisation n\'est pas supportée par votre navigateur.';
      }
      return;
    }
    this.locating = true;
    this.mapError = '';
    navigator.geolocation.getCurrentPosition(
      pos => {
        this.setCoordinates({
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6))
        }, true);
        this.locating = false;
      },
      () => {
        if (!silentOnError) {
          this.mapError = 'Impossible d\'obtenir votre position. Saisissez votre adresse ou cliquez sur la carte.';
        }
        this.locating = false;
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  private initMap() {
    this.map = L.map(this.mapHost.nativeElement, {
      center: this.defaultCenter,
      zoom: 12,
      scrollWheelZoom: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.setCoordinates({
        latitude: Number(e.latlng.lat.toFixed(6)),
        longitude: Number(e.latlng.lng.toFixed(6))
      }, true);
      this.mapError = '';
    });

    this.map.whenReady(() => {
      this.mapReady = true;
      this.scheduleInvalidateSize(0);
    });
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
    } catch {
      // Leaflet peut échouer si le conteneur n'est pas encore rendu (ex. dialogue masqué).
    }
  }

  private whenMapReady(action: () => void) {
    if (this.mapReady) {
      action();
      return;
    }
    this.map?.whenReady(() => action());
  }

  private setCoordinates(coords: GeoCoordinates | null, pan = false) {
    this.coordinates = coords;
    this.locationSelected.emit(coords);

    if (!this.map) return;

    if (!coords) {
      this.marker?.remove();
      this.marker = undefined;
      return;
    }

    this.whenMapReady(() => this.updateMarker(coords, pan));
  }

  private updateMarker(coords: GeoCoordinates, pan: boolean) {
    if (!this.map) return;

    const latlng: L.LatLngExpression = [coords.latitude, coords.longitude];
    const icon = L.divIcon({
      className: 'osm-marker-icon',
      html: '<div class="osm-marker-pin"></div>',
      iconSize: [28, 28],
      iconAnchor: [14, 28]
    });

    if (this.marker) {
      this.marker.setLatLng(latlng);
    } else {
      this.marker = L.marker(latlng, { icon, draggable: true }).addTo(this.map);
      this.marker.on('dragend', () => {
        const pos = this.marker!.getLatLng();
        this.coordinates = {
          latitude: Number(pos.lat.toFixed(6)),
          longitude: Number(pos.lng.toFixed(6))
        };
        this.locationSelected.emit(this.coordinates);
      });
    }

    if (pan) {
      this.map.setView(latlng, Math.max(this.map.getZoom(), 14), { animate: true });
    }
  }
}
