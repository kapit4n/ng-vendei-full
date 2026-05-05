import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import {
  ApiEndpointGroup,
  ApiEndpointsResponse,
  BackendApiCatalogService,
} from 'src/app/services/tools/backend-api-catalog.service';

@Component({
  selector: 'app-backend-api-page',
  templateUrl: './backend-api-page.component.html',
  styleUrls: ['./backend-api-page.component.css'],
  standalone: false,
})
export class BackendApiPageComponent implements OnInit {
  loading = true;
  error: string | null = null;
  catalog: ApiEndpointsResponse | null = null;
  /** Effective API root shown to the user (proxy vs absolute). */
  clientApiRoot = environment.apiBaseUrl || '(same origin as this app)';

  constructor(
    private readonly apiCat: BackendApiCatalogService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.apiCat
      .getCatalog()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          this.catalog = data;
        },
        error: () => {
          this.error =
            'Could not load /api/endpoints. Ensure inventory-nod is running and the dev proxy includes "/api" (see proxy.conf.json).';
          this.catalog = null;
        },
      });
  }

  goHome(): void {
    this.router.navigate(['/main']);
  }

  fullUrl(path: string): string {
    const base = (this.catalog?.serverUrl || '').replace(/\/$/, '');
    return `${base}${path}`;
  }

  trackGroup(_index: number, g: ApiEndpointGroup): string {
    return g.id;
  }

  get swaggerHref(): string {
    const base = this.catalog?.serverUrl?.replace(/\/$/, '') || '';
    return base ? `${base}/api-docs` : '/api-docs';
  }
}
