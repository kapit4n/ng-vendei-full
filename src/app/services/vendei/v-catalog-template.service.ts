import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ACTIONS, API_PATHS } from '../../core/api/api-paths';
import { ApiClientService } from '../../core/api/api-client.service';

export interface CatalogTemplate {
  id: number;
  name: string;
  slug: string;
  description: string;
  businessType: string;
  active: boolean;
  capabilities?: string[];
  receiptConfig?: any;
  posConfig?: any;
  categories?: CatalogTemplateCategory[];
  products?: CatalogTemplateProduct[];
}

export interface CatalogTemplateCategory {
  id: number;
  catalogTemplateId: number;
  name: string;
  code: string;
  description: string;
  sortOrder: number;
}

export interface CatalogTemplateProduct {
  id: number;
  catalogTemplateId: number;
  catalogTemplateCategoryId: number;
  name: string;
  description: string;
  code: string;
  img: string;
  price: number;
  cost: number;
  uom: string;
  stock: number;
  sortOrder: number;
}

@Injectable({ providedIn: 'root' })
export class VCatalogTemplateService {
  constructor(private readonly api: ApiClientService) {}

  getAll(businessType?: string): Observable<CatalogTemplate[]> {
    return this.api.get<CatalogTemplate[]>(API_PATHS.catalogTemplates, {
      businessType: businessType || undefined,
    });
  }

  getById(id: number): Observable<CatalogTemplate> {
    return this.api.get<CatalogTemplate>(`${API_PATHS.catalogTemplates}/${id}`);
  }

  apply(id: number, payload: any): Observable<any> {
    return this.api.post(`${API_PATHS.catalogTemplates}/${id}/${API_ACTIONS.apply}`, payload);
  }
}
