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

  getAll(): Observable<any> {
    return this.http.get(`${this.modelUrl}?${this.includeCat}`);
  }

  getById(id: string): Observable<any> {
    return this.http.get(`${this.modelUrl}/${id}`);
  }

  save(data: any): Observable<any> {
    return this.http.post(this.modelUrl, data);
  }

  update(data: any): Observable<any> {
    return this.http.put(`${this.modelUrl}/${data.id}`, data);
  }

  addToInventory(productId: string, amount: number): Observable<any> {
    return this.http.get(`${this.modelUrl}/addToInventory?id=${productId}&amount=${amount}`);
  }
  
  reduceInventory(productId: string, amount: number): Observable<any> {
    return this.http.get(`${this.modelUrl}/reduceInventory?id=${productId}&amount=${amount}`);
  }


}
