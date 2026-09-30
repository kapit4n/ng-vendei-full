import { Injectable } from '@angular/core';

import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { API_PATHS } from '../../core/api/api-paths';
import { ApiClientService } from '../../core/api/api-client.service';

import { VConfigService } from './v-config.service'

@Injectable({
  providedIn: 'root'
})
export class VCategoriesService {
  /** Bundled offline/demo categories used when `VConfigService.isTest` is on. */
  private readonly jsonFileURL = 'assets/vendei/categories.json';

  constructor(
    private readonly api: ApiClientService,
    private readonly configSvc: VConfigService
  ) {}

  /**
   * Return an observable with the list of categories
   */
  getAll(profileId?: number): Observable<any> {
    const normalizeList = (body: unknown): any[] => {
      if (Array.isArray(body)) {
        return body;
      }
      if (body && typeof body === 'object') {
        const o = body as Record<string, unknown>;
        const nested = o['data'] ?? o['rows'] ?? o['items'] ?? o['categories'] ?? o['Categories'];
        if (Array.isArray(nested)) {
          return nested;
        }
      }
      return [];
    };

    if (this.configSvc.isTest) {
      return this.api.getAsset<any>(this.jsonFileURL).pipe(
        map((response) => normalizeList(response)),
        catchError(err => {
          console.error('[VCategoriesService] getAll (JSON) failed', err);
          return of([]);
        })
      );
    }
    return this.api.get<any>(API_PATHS.categories, {
      storeProfileId: profileId || undefined,
    }).pipe(
      map((response) => normalizeList(response)),
      catchError(err => {
        console.error('[VCategoriesService] getAll failed', err);
        return of([]);
      })
    );
  }
}
