import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { IConfigService } from "./i-config.service";

import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class IProductsInvService {
  modelUrl: string;
  inProduct: string;
  constructor(private http: HttpClient, private configSvc: IConfigService) {
    this.modelUrl = this.configSvc.baseUrl + "/purchase-items";
    this.inProduct = "filter[include]=product";
  }

  getAll(): Observable<any> {
    return this.http.get(`${this.modelUrl}?${this.inProduct}`);
  }

  getByProductId(id: string): Observable<any> {
    return this.http.get(`${this.modelUrl}?filter[where][productId]=${id}`);
  }

  save(data: any): Observable<any> {
    return this.http.post(this.modelUrl, data);
  }

  update(data: any): Observable<any> {
    return this.http.put(`${this.modelUrl}/${data.id}`, data);
  }
  
  remove(invItemId: string): Observable<any> {
    return this.http.delete(`${this.modelUrl}/${invItemId}`);
  }


}