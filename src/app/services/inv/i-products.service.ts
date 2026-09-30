import { Injectable } from "@angular/core";

import { Observable } from "rxjs";

import { API_ACTIONS, API_PATHS } from "../../core/api/api-paths";
import { ApiClientService } from "../../core/api/api-client.service";

export interface IProduct {
  id: string;
  name: string;
  code: string;
  price: number;
  cost: number;
  stock: number;
  img: string;
  description: string;
  trackExpiry?: boolean;
  defaultShelfLifeDays?: number | null;
  inventoryLots?: unknown[];
}

@Injectable({
  providedIn: "root"
})
export class IProductsService {
  /** Sequelize filter syntax must reach the backend verbatim, so it stays a raw string. */
  private readonly includeCat = 'filter[include]=category';

  constructor(private readonly api: ApiClientService) {}

  getAll(opts?: { includeLots?: boolean }): Observable<any> {
    const query = opts?.includeLots ? `${this.includeCat}&include=inventoryLots` : this.includeCat;
    return this.api.get(API_PATHS.products, query);
  }

  getById(id: string, opts?: { includeLots?: boolean }): Observable<any> {
    return this.api.get(
      `${API_PATHS.products}/${encodeURIComponent(id)}`,
      opts?.includeLots ? 'include=inventoryLots' : undefined
    );
  }

  save(data: any): Observable<any> {
    return this.api.post(API_PATHS.products, data);
  }

  update(data: any): Observable<any> {
    return this.api.put(`${API_PATHS.products}/${data.id}`, data);
  }

  addToInventory(
    productId: string,
    amount: number,
    opts?: { expiryDate?: string; batchCode?: string }
  ): Observable<any> {
    return this.api.get(`${API_PATHS.products}/${API_ACTIONS.addToInventory}`, {
      id: productId,
      amount,
      expiryDate: opts?.expiryDate,
      batchCode: opts?.batchCode,
    });
  }
  
  reduceInventory(productId: string, amount: number): Observable<any> {
    return this.api.get(`${API_PATHS.products}/${API_ACTIONS.reduceInventory}`, {
      id: productId,
      amount,
    });
  }


}
