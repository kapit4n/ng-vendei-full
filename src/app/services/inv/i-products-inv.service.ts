import { Injectable } from "@angular/core";

import { Observable } from "rxjs";

import { API_PATHS } from "../../core/api/api-paths";
import { ApiClientService } from "../../core/api/api-client.service";

@Injectable({
  providedIn: 'root'
})
export class IProductsInvService {
  private readonly inProduct = 'filter[include]=product';

  constructor(private readonly api: ApiClientService) {}

  getAll(): Observable<any> {
    return this.api.get(API_PATHS.purchaseItems, this.inProduct);
  }

  getByProductId(id: string): Observable<any> {
    return this.api.get(API_PATHS.purchaseItems, `filter[where][productId]=${encodeURIComponent(String(id))}`);
  }

  save(data: any): Observable<any> {
    return this.api.post(API_PATHS.purchaseItems, data);
  }

  update(data: any): Observable<any> {
    return this.api.put(`${API_PATHS.purchaseItems}/${data.id}`, data);
  }
  
  remove(invItemId: string): Observable<any> {
    return this.api.delete(`${API_PATHS.purchaseItems}/${invItemId}`);
  }


}