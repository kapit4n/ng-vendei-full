import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

import { API_PATHS } from '../../core/api/api-paths';
import { ApiClientService } from '../../core/api/api-client.service';

import { VConfigService } from './v-config.service'

@Injectable({
  providedIn: "root"
})
export class VOrdersService {
  /** Bundled offline/demo orders used when `VConfigService.isTest` is on. */
  private readonly jsonFileURL = 'assets/vendei/orders.json';

  constructor(
    private readonly api: ApiClientService,
    private readonly configSvc: VConfigService
  ) {}

  /**
   * Return an observable with the list of orders
   */
  getAll(): Observable<any> {
    if (this.configSvc.isTest) {
      return this.api.getAsset<any>(this.jsonFileURL);
    }
    return this.api.get<any>(API_PATHS.orders).pipe(map((response) => response));
  }

  // save an order in API
  save(order: any): Observable<any> {
    return this.api
      .post(API_PATHS.orders, order)
      .pipe(
        map((response: Response) => {
          return <any>response;
        })
      );
  }

  saveDetail(detail: any): Observable<any> {
    return this.api
      .post(API_PATHS.orderDetails, detail)
      .pipe(
        map((response: Response) => {
          return <any>response;
        })
      );
  }
}
