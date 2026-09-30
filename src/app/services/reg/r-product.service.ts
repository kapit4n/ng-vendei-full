import { Injectable } from '@angular/core';
import { API_PATHS } from "../../core/api/api-paths";
import { ApiClientService } from "../../core/api/api-client.service";

import { RCrudInterface } from './r-crud.interface';
import { Observable } from 'rxjs';
import type { IUnitOfMeasure } from './r-unit-of-measure.service';

export interface IProduct {
  id: string;
  name: string;
  code: string;
  price: number;
  cost: number;
  img: string;
  description: string;
  categoryId: string;
  stock: number;
  /** Allowed units for this product (from API). */
  UnitOfMeasures?: IUnitOfMeasure[];
  /** IDs to send when saving (optional). */
  unitOfMeasureIds?: (string | number)[];
  /** When true, receiving stock creates dated lots (FEFO on sale). */
  trackExpiry?: boolean;
  /** If set and trackExpiry, receive can omit expiry (today + N days in UTC on server). */
  defaultShelfLifeDays?: number | null;
  /** Selling mode for this product: UNIT, WEIGHT, VARIABLE_QTY, VARIANT, COMBO. */
  sellingMode?: string;
}

@Injectable({
  providedIn: "root"
})
export class RProductService implements RCrudInterface {
  constructor(private readonly api: ApiClientService) {}

  getAll(): Observable<any> {
    return this.api.get(API_PATHS.products);
  }

  getById(id: string): Observable<any> {
    return this.api.get(`${API_PATHS.products}/${id}`);
  }

  save(data: any): Observable<any> {
    return this.api.post(API_PATHS.products, data);
  }

  update(data: any): Observable<any> {
    return this.api.put(`${API_PATHS.products}/${data.id}`, data);
  }

  remove(productId: any): Observable<any> {
    return this.api.delete(`${API_PATHS.products}/${productId}`);
  }

}
