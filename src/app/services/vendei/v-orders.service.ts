import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { VConfigService } from './v-config.service'

import 'rxjs'; //get everything from Rx    

@Injectable({
  providedIn: "root"
})
export class VOrdersService {
  private jsonFileURL: string = "../../assets/vendei/products.json";

  constructor(private http: HttpClient, private configSvc: VConfigService) { }

  private ordersUrl(): string {
    return `${this.configSvc.baseUrl}/orders`;
  }

  private detailsUrl(): string {
    return `${this.configSvc.baseUrl}/orderDetails`;
  }

  /**
   * Return an observable with the list of orders
   */
  getAll(): Observable<any> {
    if (this.configSvc.isTest) {
      return this.http.get(this.jsonFileURL).pipe(
        map((response: Response) => {
          return <any>response;
        })
      );
    } else {
      return this.http
        .get(this.ordersUrl())
        .pipe(
          map((response: Response) => {
            return <any>response;
          })
        );
    }
  }

  // save an order in API
  save(order: any): Observable<any> {
    return this.http
      .post(this.ordersUrl(), order)
      .pipe(
        map((response: Response) => {
          return <any>response;
        })
      );
  }

  saveDetail(detail: any): Observable<any> {
    return this.http
      .post(this.detailsUrl(), detail)
      .pipe(
        map((response: Response) => {
          return <any>response;
        })
      );
  }
}
