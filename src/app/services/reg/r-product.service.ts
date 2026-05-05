import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { RConfigService } from "./r-config.service";

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
}

@Injectable({
  providedIn: "root"
})
export class RProductService implements RCrudInterface {
  modelUrl: string;
  constructor(private http: HttpClient, private configSvc: RConfigService) {
    this.modelUrl = this.configSvc.baseUrl + "/products";
  }

  getAll(): Observable<any> {
    return this.http.get(`${this.modelUrl}`);
  }

  getById(id: string): Observable<any> {
    return this.http.get(`${this.modelUrl}/${id}`);
  }

  save(data: any): Observable<any> {
    return this.http.post(this.modelUrl, data);
  }

  update(data: any): Observable<any> {
    return this.http.put(`${this.modelUrl}/${data.id}`, data);
  }

  remove(productId: any): Observable<any> {
    return this.http.delete(`${this.modelUrl}/${productId}`);
  }

}
