import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { IConfigService } from "./i-config.service";

import { Observable } from "rxjs";

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
  modelUrl: string;
  includeCat: string;
  constructor(private http: HttpClient, private configSvc: IConfigService) {
    this.modelUrl = this.configSvc.baseUrl + "/products";
    this.includeCat = "filter[include]=category";
  }

  getAll(opts?: { includeLots?: boolean }): Observable<any> {
    let url = `${this.modelUrl}?${this.includeCat}`;
    if (opts?.includeLots) {
      url += '&include=inventoryLots';
    }
    return this.http.get(url);
  }

  getById(id: string, opts?: { includeLots?: boolean }): Observable<any> {
    const q = opts?.includeLots ? '?include=inventoryLots' : '';
    return this.http.get(`${this.modelUrl}/${encodeURIComponent(id)}${q}`);
  }

  save(data: any): Observable<any> {
    return this.http.post(this.modelUrl, data);
  }

  update(data: any): Observable<any> {
    return this.http.put(`${this.modelUrl}/${data.id}`, data);
  }

  addToInventory(
    productId: string,
    amount: number,
    opts?: { expiryDate?: string; batchCode?: string }
  ): Observable<any> {
    let url = `${this.modelUrl}/addToInventory?id=${encodeURIComponent(productId)}&amount=${encodeURIComponent(String(amount))}`;
    if (opts?.expiryDate) {
      url += `&expiryDate=${encodeURIComponent(opts.expiryDate)}`;
    }
    if (opts?.batchCode) {
      url += `&batchCode=${encodeURIComponent(opts.batchCode)}`;
    }
    return this.http.get(url);
  }
  
  reduceInventory(productId: string, amount: number): Observable<any> {
    return this.http.get(`${this.modelUrl}/reduceInventory?id=${productId}&amount=${amount}`);
  }


}
