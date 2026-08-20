import { Injectable } from '@angular/core';

import { HttpClient } from "@angular/common/http";
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { VConfigService } from './v-config.service'

@Injectable({
  providedIn: 'root'
})
export class VCategoriesService {
  private jsonFileURL: string = "assets/vendei/categories.json";

  constructor(private http: HttpClient, private configSvc: VConfigService) { }
  
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
      return this.http.get<any>(this.jsonFileURL).pipe(
        map((response) => normalizeList(response)),
        catchError(err => {
          console.error('[VCategoriesService] getAll (JSON) failed', err);
          return of([]);
        })
      );
    }
    const params: string[] = [];
    if (profileId) {
      params.push(`storeProfileId=${profileId}`);
    }
    const qs = params.length ? `?${params.join('&')}` : '';
    return this.http.get<any>(`${this.configSvc.baseUrl}/categories${qs}`).pipe(
      map((response) => normalizeList(response)),
      catchError(err => {
        console.error('[VCategoriesService] getAll failed', err);
        return of([]);
      })
    );
  }
}
