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

export interface ModelAttribute {
  name: string;
  type: string;
  allowNull: boolean;
  primaryKey: boolean;
  autoIncrement: boolean;
  defaultValue: string | null;
}

export interface ModelAssociation {
  type: string;
  targetModel: string;
  foreignKey: string | null;
  as: string | null;
  through: string | null;
}

export interface DbModel {
  modelName: string;
  tableName: string;
  attributes: ModelAttribute[];
  associations: ModelAssociation[];
}

export interface ModelsResponse {
  generatedAt: string;
  models: DbModel[];
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

  /** GET /api/models — Sequelize model definitions from inventory-nod. */
  getModels(): Observable<ModelsResponse> {
    const base = this.config.baseUrl.replace(/\/$/, '');
    return this.http.get<ModelsResponse>(`${base}/api/models`);
  }
}
