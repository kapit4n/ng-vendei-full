import { Injectable } from '@angular/core';

import { HttpClient } from "@angular/common/http";
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import {VConfigService} from './v-config.service'

@Injectable({
  providedIn: "root"
})
export class VProductsService {
  /** Product list */
  products: any[];

  /** json URL */
  private jsonFileURL: string = "../../assets/vendei/products.json";

  /** Product List service constructor */
  constructor(private http: HttpClient, private configSvc: VConfigService) {}

  /**
   * Returns the list of products
   */
  list(): any[] {
    return this.products;
  }

  /**
   * Return Product by category
   */
  productsByCategory(category: any): any[] {
    return this.products;
  }

  /**
   * Return an observable with the yeam that matches the id
   */
  getProductById(id: any): Observable<any> {
    return this.http.get(this.jsonFileURL).pipe(
      map((response: Response) => {
        return <any>response.json()[id - 1];
      })
    );
  }

  /**
   * Return an observable with the list of products
   */
  getProducts(): Observable<any> {
    const normalizeList = (body: unknown): any[] => {
      if (Array.isArray(body)) {
        return body;
      }
      if (body && typeof body === 'object') {
        const o = body as Record<string, unknown>;
        const nested = o['data'] ?? o['rows'] ?? o['items'];
        if (Array.isArray(nested)) {
          return nested;
        }
      }
      return [];
    };

    if (this.configSvc.isTest) {
      return this.http.get(this.jsonFileURL).pipe(
        map((response: unknown) => normalizeList(response)),
        catchError(err => {
          console.error('[VProductsService] getProducts (JSON) failed', err);
          return of([]);
        })
      );
    }
    return this.http.get(`${this.configSvc.baseUrl}/productPresentations`).pipe(
      map((response: unknown) => normalizeList(response)),
      catchError(err => {
        console.error('[VProductsService] getProducts failed', err);
        return of([]);
      })
    );
  }
}
