import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { RepConfigService } from "./rep-config.service";
import { Observable } from "rxjs";

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
  modelUrl: string;
  includeProd: string;
  includeOrder: string;
  orderBy: string;
  constructor(private http: HttpClient, private configSvc: RepConfigService) {
    this.modelUrl = this.configSvc.baseUrl + "/orderDetails";
    this.includeProd = "filter[include]=product";
    this.includeOrder = "filter[include]=order";
    this.orderBy = "filter[order]=createdDate%20DESC"
  }

  getAll(): Observable<any> {
    return this.http.get(`${this.modelUrl}?${this.includeProd}&${this.includeOrder}&${this.orderBy}`);
  }
}
