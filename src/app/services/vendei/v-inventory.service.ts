import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

import { API_ACTIONS, API_PATHS } from '../../core/api/api-paths';
import { ApiClientService } from '../../core/api/api-client.service';

@Injectable({
  providedIn: "root"
})
export class VInventoryService {
  constructor(private readonly api: ApiClientService) {}

  reduceInventory(productId: string, amount: number): Observable<any> {
    return this.api.get(`${API_PATHS.products}/${API_ACTIONS.reduceInventory}`, {
      id: productId,
      amount,
    });
  }

  updateTotalSelled(productId: string, amount: number): Observable<any> {
    return this.api.get(`${API_PATHS.products}/${API_ACTIONS.updateTotalSelled}`, {
      id: productId,
      amount,
    });
  }

  updateQuantitySelled(productId: string, amount: number): Observable<any> {
    return this.api.get(`${API_PATHS.products}/${API_ACTIONS.updateQuantitySelled}`, {
      id: productId,
      amount,
    });
  }
}
