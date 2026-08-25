import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VConfigService } from './v-config.service';

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
  private modelUrl: string;

  constructor(private http: HttpClient, private configSvc: VConfigService) {
    this.modelUrl = configSvc.baseUrl + '/catalogTemplates';
  }

  getAll(businessType?: string): Observable<CatalogTemplate[]> {
    let url = this.modelUrl;
    if (businessType) url += `?businessType=${encodeURIComponent(businessType)}`;
    return this.http.get<CatalogTemplate[]>(url);
  }

  getById(id: number): Observable<CatalogTemplate> {
    return this.http.get<CatalogTemplate>(`${this.modelUrl}/${id}`);
  }

  apply(id: number, payload: any): Observable<any> {
    return this.http.post(`${this.modelUrl}/${id}/apply`, payload);
  }
}
