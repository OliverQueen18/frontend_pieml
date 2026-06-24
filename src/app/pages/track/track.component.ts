import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TrackDossierSearchComponent } from '../../shared/track-dossier-search.component';
import { parseDossierReference } from '../../shared/dossier-reference.util';

@Component({
  selector: 'app-track',
  standalone: true,
  imports: [RouterLink, TrackDossierSearchComponent],
  templateUrl: './track.component.html',
  styleUrl: './track.component.scss'
})
export class TrackComponent implements OnInit {
  private route = inject(ActivatedRoute);

  readonly readerId = 'track-page-qr-reader';
  initialReference = '';

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      const ref = params.get('ref') ?? params.get('reference') ?? '';
      this.initialReference = ref ? parseDossierReference(ref) : '';
    });
  }
}
