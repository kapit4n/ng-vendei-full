import { Injectable } from '@angular/core';

import { API_PATHS } from '../../core/api/api-paths';
import { ApiClientService } from '../../core/api/api-client.service';

import { RCrudInterface } from './r-crud.interface';
import { Observable } from 'rxjs';

export interface IProductPresentation {
  id: string;
  code: string;
  currentPrice: number;
  img: string;
  unitOfMeasure: string;
  unitOfMeasureId?: string | number | null;
  productId: string;
  quantity: number;
  brand: string;
}

@Injectable({
  providedIn: "root"
})
export class RProductPresentationService implements RCrudInterface {
  constructor(private readonly api: ApiClientService) {}

  getAll(): Observable<any> {
    return this.api.get(API_PATHS.productPresentations);
  }

  getById(id: string): Observable<any> {
    return this.api.get(`${API_PATHS.productPresentations}/${id}`);
  }

  save(data: any): Observable<any> {
    return this.api.post(API_PATHS.productPresentations, data);
  }

  update(data: any): Observable<any> {
    return this.api.put(`${API_PATHS.productPresentations}/${data.id}`, data);
  }

  remove(productId: any): Observable<any> {
    return this.api.delete(`${API_PATHS.productPresentations}/${productId}`);
  }

}
