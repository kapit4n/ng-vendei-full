import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_PATHS } from '../../core/api/api-paths';
import { ApiClientService } from '../../core/api/api-client.service';

export interface IAttributeDefinition {
  id?: number | string;
  storeProfileId: number;
  name: string;
  code: string;
  type: string;
  options: string[];
  required: boolean;
  active: boolean;
  sortOrder: number;
}

@Injectable({ providedIn: 'root' })
export class RAttributeDefinitionService {
  constructor(private readonly api: ApiClientService) {}

  getAll(storeProfileId?: number): Observable<any> {
    return this.api.get(API_PATHS.productAttributeDefinitions, {
      storeProfileId: storeProfileId || undefined,
    });
  }

  getById(id: string): Observable<any> {
    return this.api.get(`${API_PATHS.productAttributeDefinitions}/${id}`);
  }

  save(data: any): Observable<any> {
    return this.api.post(API_PATHS.productAttributeDefinitions, data);
  }

  update(data: any): Observable<any> {
    return this.api.put(`${API_PATHS.productAttributeDefinitions}/${data.id}`, data);
  }

  remove(id: string | number): Observable<any> {
    return this.api.delete(`${API_PATHS.productAttributeDefinitions}/${id}`);
  }
}
