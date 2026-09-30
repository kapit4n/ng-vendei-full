import { Injectable } from '@angular/core';
import { Observable } from "rxjs";

import { API_ACTIONS, API_PATHS } from '../../core/api/api-paths';
import { ApiClientService } from '../../core/api/api-client.service';
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
  constructor(private readonly api: ApiClientService) {}

  getTodaySummary(): Observable<DailySalesSummary> {
    return this.api.get<DailySalesSummary>(`${API_PATHS.orders}/${API_ACTIONS.todaySummary}`);
  }
}
