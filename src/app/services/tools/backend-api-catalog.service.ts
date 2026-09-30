import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_PATHS } from '../../core/api/api-paths';
import { ApiClientService } from '../../core/api/api-client.service';

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
  constructor(private readonly api: ApiClientService) {}

  /** GET /api/endpoints — grouped route catalog from inventory-nod. */
  getCatalog(): Observable<ApiEndpointsResponse> {
    return this.api.get<ApiEndpointsResponse>(`${API_PATHS.api}/endpoints`);
  }

  /** GET /api/models — Sequelize model definitions from inventory-nod. */
  getModels(): Observable<ModelsResponse> {
    return this.api.get<ModelsResponse>(`${API_PATHS.api}/models`);
  }
}
