import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { IConfigService } from '../inv/i-config.service';

export interface ApiEndpointRoute {
  method: string;
  path: string;
  description: string;
}

export interface ApiEndpointGroup {
  id: string;
  title: string;
  routes: ApiEndpointRoute[];
}

export interface ApiEndpointsResponse {
  title: string;
  generatedAt: string;
  serverUrl: string;
  groups: ApiEndpointGroup[];
}

@Injectable({
  providedIn: 'root',
})
export class BackendApiCatalogService {
  constructor(private http: HttpClient, private config: IConfigService) {}

  /** GET /api/endpoints — grouped route catalog from inventory-nod. */
  getCatalog(): Observable<ApiEndpointsResponse> {
    const base = this.config.baseUrl.replace(/\/$/, '');
    return this.http.get<ApiEndpointsResponse>(`${base}/api/endpoints`);
  }
}
