import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RConfigService } from './r-config.service';
import { RCrudInterface } from './r-crud.interface';

export interface IUnitOfMeasure {
  id: string | number;
  code: string;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class RUnitOfMeasureService implements RCrudInterface {
  modelUrl: string;

  constructor(private http: HttpClient, private configSvc: RConfigService) {
    this.modelUrl = this.configSvc.baseUrl + '/unitOfMeasures';
  }

  getAll(): Observable<IUnitOfMeasure[]> {
    return this.http.get<IUnitOfMeasure[]>(`${this.modelUrl}`);
  }

  getById(id: string): Observable<IUnitOfMeasure> {
    return this.http.get<IUnitOfMeasure>(`${this.modelUrl}/${id}`);
  }

  save(data: Partial<IUnitOfMeasure>): Observable<IUnitOfMeasure> {
    const body: Record<string, unknown> = { code: data.code, name: data.name };
    return this.http.post<IUnitOfMeasure>(this.modelUrl, body);
  }

  update(data: Partial<IUnitOfMeasure> & { id: string | number }): Observable<IUnitOfMeasure> {
    const body: Record<string, unknown> = { code: data.code, name: data.name };
    return this.http.put<IUnitOfMeasure>(`${this.modelUrl}/${data.id}`, body);
  }

  remove(id: string | number): Observable<unknown> {
    return this.http.delete(`${this.modelUrl}/${id}`);
  }
}
