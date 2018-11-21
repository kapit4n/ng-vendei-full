import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { RepConfigService } from "./rep-config.service";
import { Observable } from "rxjs";

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
  modelUrl: string;
  constructor(private http: HttpClient, private configSvc: RepConfigService) {
    this.modelUrl = this.configSvc.baseUrl + "/products";
  }

  getAll(): Observable<any> {
    return this.http.get(`${this.modelUrl}`);
  }
}
