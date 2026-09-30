import { Injectable } from '@angular/core';
import { Observable } from "rxjs";

import { API_PATHS } from '../../core/api/api-paths';
import { ApiClientService } from '../../core/api/api-client.service';
export interface IProduct {
  id: string;
  price: number;
  cost: number;
  inventory: number;
  totalSells: number;
}

@Injectable({
  providedIn: "root"
})
export class RepProductsService {
  constructor(private readonly api: ApiClientService) {}

  getAll(): Observable<any> {
    return this.api.get(API_PATHS.products);
  }
}
