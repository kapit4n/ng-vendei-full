import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_PATHS } from '../../core/api/api-paths';
import { ApiClientService } from '../../core/api/api-client.service';

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
  constructor(private readonly api: ApiClientService) {}

  getAll(): Observable<IUnitOfMeasure[]> {
    return this.api.get<IUnitOfMeasure[]>(API_PATHS.unitOfMeasures);
  }

  getById(id: string): Observable<IUnitOfMeasure> {
    return this.api.get<IUnitOfMeasure>(`${API_PATHS.unitOfMeasures}/${id}`);
  }

  save(data: Partial<IUnitOfMeasure>): Observable<IUnitOfMeasure> {
    const body: Record<string, unknown> = { code: data.code, name: data.name };
    return this.api.post<IUnitOfMeasure>(API_PATHS.unitOfMeasures, body);
  }

  update(data: Partial<IUnitOfMeasure> & { id: string | number }): Observable<IUnitOfMeasure> {
    const body: Record<string, unknown> = { code: data.code, name: data.name };
    return this.api.put<IUnitOfMeasure>(`${API_PATHS.unitOfMeasures}/${data.id}`, body);
  }

  remove(id: string | number): Observable<unknown> {
    return this.api.delete(`${API_PATHS.unitOfMeasures}/${id}`);
  }
}
