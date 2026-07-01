import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { VConfigService } from "./v-config.service";

import { Observable } from "rxjs";

@Injectable({
  providedIn: "root"
})
export class VInventoryService {
  modelUrl: string;
  
  constructor(private http: HttpClient, private configSvc: VConfigService) {
    this.modelUrl = this.configSvc.baseUrl + "/products";
  }

  reduceInventory(productId: string, amount: number): Observable<any> {
    return this.http.get(
      `${this.modelUrl}/reduceInventory?id=${productId}&amount=${amount}`
    );
  }

  updateTotalSelled(productId: string, amount: number): Observable<any> {
    return this.http.get(
      `${this.modelUrl}/updateTotalSelled?id=${productId}&amount=${amount}`
    );
  }

  updateQuantitySelled(productId: string, amount: number): Observable<any> {
    return this.http.get(
      `${this.modelUrl}/updateQuantitySelled?id=${productId}&amount=${amount}`
    );
  }

}
