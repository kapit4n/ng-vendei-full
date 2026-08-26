import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { VConfigService } from './v-config.service';

export interface ProductVariant {
  id: number;
  productId: number;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  cost: number;
  stock: number;
  active: boolean;
  attributeLinks?: any[];
}

@Injectable({ providedIn: 'root' })
export class VProductVariantService {
  constructor(private http: HttpClient, private configSvc: VConfigService) {}

  getByProductId(productId: number | string): Observable<ProductVariant[]> {
    return this.http
      .get<any>(`${this.configSvc.baseUrl}/productVariants?productId=${productId}`)
      .pipe(
        map((body) => {
          if (Array.isArray(body)) return body;
          if (body && typeof body === 'object') {
            const nested = body['data'] ?? body['rows'] ?? body['items'];
            if (Array.isArray(nested)) return nested;
          }
          return [];
        }),
        catchError(() => of([]))
      );
  }
}
