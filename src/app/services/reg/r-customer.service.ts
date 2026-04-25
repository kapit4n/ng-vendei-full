import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RConfigService } from './r-config.service';

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
  modelUrl: string;

  constructor(private http: HttpClient, private configSvc: RConfigService) {
    this.modelUrl = this.configSvc.baseUrl + '/clients';
  }

  getAll(): Observable<object> {
    return this.http.get(`${this.modelUrl}`);
  }

  getById(id: string): Observable<object> {
    return this.http.get(`${this.modelUrl}/${id}`);
  }

  save(data: Partial<ICustomer>): Observable<object> {
    return this.http.post(this.modelUrl, data);
  }

  update(data: Partial<ICustomer> & { id: string | number }): Observable<object> {
    return this.http.put(`${this.modelUrl}/${data.id}`, data);
  }

  remove(id: string | number): Observable<object> {
    return this.http.delete(`${this.modelUrl}/${id}`);
  }
}
