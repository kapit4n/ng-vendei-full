import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { RepConfigService } from "./rep-config.service";
import { Observable } from "rxjs";

export interface DailySalesSummary {
  date: string;
  orderCount: number;
  totalSales: number;
  totalCash: number;
  totalQr: number;
  totalDiscount: number;
  totalReturn: number;
}

@Injectable({
  providedIn: "root"
})
export class RepDailySalesService {
  private modelUrl: string;

  constructor(private http: HttpClient, private configSvc: RepConfigService) {
    this.modelUrl = this.configSvc.baseUrl + "/orders";
  }

  getTodaySummary(): Observable<DailySalesSummary> {
    return this.http.get<DailySalesSummary>(`${this.modelUrl}/today-summary`);
  }
}
