import { Injectable } from '@angular/core';
import { API_PATHS } from "../../core/api/api-paths";
import { ApiClientService } from "../../core/api/api-client.service";

import { RCrudInterface } from './r-crud.interface'
import { Observable } from "rxjs";

export interface ICategory {
  id?: number | string;
  name: string;
  description: string;
  img: string;
  code: string;
}

@Injectable({
  providedIn: "root"
})
export class RCategoryService implements RCrudInterface {
  constructor(private readonly api: ApiClientService) {}

  getAll(): Observable<any> {
    return this.api.get(API_PATHS.categories);
  }

  getById(id: string): Observable<any> {
    return this.api.get(`${API_PATHS.categories}/${id}`);
  }

  save(data: any): Observable<any> {
    return this.api.post(API_PATHS.categories, data);
  }

  update(data: any): Observable<any> {
    return this.api.put(`${API_PATHS.categories}/${data.id}`, data);
  }

  remove(id: string | number): Observable<any> {
    return this.api.delete(`${API_PATHS.categories}/${id}`);
  }
}
