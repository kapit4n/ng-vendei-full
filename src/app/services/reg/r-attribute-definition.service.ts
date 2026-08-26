import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RConfigService } from './r-config.service';
import { Observable } from 'rxjs';

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
  modelUrl: string;

  constructor(private http: HttpClient, private configSvc: RConfigService) {
    this.modelUrl = this.configSvc.baseUrl + '/productAttributeDefinitions';
  }

  getAll(storeProfileId?: number): Observable<any> {
    let url = this.modelUrl;
    if (storeProfileId) url += `?storeProfileId=${storeProfileId}`;
    return this.http.get(url);
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

  remove(id: string | number): Observable<any> {
    return this.http.delete(`${this.modelUrl}/${id}`);
  }
}
