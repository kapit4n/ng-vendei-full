import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { API_PATHS } from '../../core/api/api-paths';
import { ApiClientService } from '../../core/api/api-client.service';

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
  constructor(private readonly api: ApiClientService) {}

  getByProductId(productId: number | string): Observable<ProductVariant[]> {
    return this.api
      .get<any>(API_PATHS.productVariants, { productId })
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
