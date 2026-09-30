import { Injectable } from '@angular/core';
import { Observable } from "rxjs";

import { API_PATHS } from '../../core/api/api-paths';
import { ApiClientService } from '../../core/api/api-client.service';
export interface ISell {
  id: string;
  productId: number;
  product: any;
  order: any;
  price: number;
  totalPrice: number;
  quantity: number;
}

@Injectable({
  providedIn: "root"
})
export class RepSellsService {
  /** Sequelize filter syntax must reach the backend verbatim, so it stays a raw string. */
  private readonly query = [
    'filter[include]=product',
    'filter[include]=order',
    'filter[order]=createdDate%20DESC',
  ].join('&');

  constructor(private readonly api: ApiClientService) {}

  getAll(): Observable<any> {
    return this.api.get(API_PATHS.orderDetails, this.query);
  }
}
