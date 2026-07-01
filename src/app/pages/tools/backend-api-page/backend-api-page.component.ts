import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import {
  ApiEndpointGroup,
  ApiEndpointsResponse,
  BackendApiCatalogService,
  DbModel,
  ModelsResponse,
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
  modelsData: ModelsResponse | null = null;
  expandedModel: string | null = null;
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
    forkJoin({
      catalog: this.apiCat.getCatalog(),
      models: this.apiCat.getModels(),
    })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          this.catalog = data.catalog;
          this.modelsData = data.models;
        },
        error: () => {
          this.error =
            'Could not load backend metadata. Ensure inventory-nod is running and the dev proxy includes "/api" (see proxy.conf.json).';
          this.catalog = null;
          this.modelsData = null;
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

  trackModel(_index: number, m: DbModel): string {
    return m.modelName;
  }

  toggleModel(name: string): void {
    this.expandedModel = this.expandedModel === name ? null : name;
  }

  get swaggerHref(): string {
    const base = this.catalog?.serverUrl?.replace(/\/$/, '') || '';
    return base ? `${base}/api-docs` : '/api-docs';
  }
}
