import { Injectable } from '@angular/core';

import { API_PATHS } from '../../core/api/api-paths';
import { ApiClientService } from '../../core/api/api-client.service';

import { RCrudInterface } from './r-crud.interface';
import { Observable } from 'rxjs';

export interface ICustomer {
  id?: string | number;
  name: string;
  code: string;
  address: string;
}

@Injectable({
  providedIn: 'root',
})
export class RCustomerService implements RCrudInterface {
  constructor(private readonly api: ApiClientService) {}

  getAll(): Observable<object> {
    return this.api.get(API_PATHS.clients);
  }

  getById(id: string): Observable<object> {
    return this.api.get(`${API_PATHS.clients}/${id}`);
  }

  save(data: Partial<ICustomer>): Observable<object> {
    return this.api.post(API_PATHS.clients, data);
  }

  update(data: Partial<ICustomer> & { id: string | number }): Observable<object> {
    return this.api.put(`${API_PATHS.clients}/${data.id}`, data);
  }

  remove(id: string | number): Observable<object> {
    return this.api.delete(`${API_PATHS.clients}/${id}`);
  }
}
