import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable, Subject, of, config } from 'rxjs';
import { map, filter, switchMap } from 'rxjs/operators';

import {VConfigService} from './v-config.service'

import 'rxjs'; //get everything from Rx    

@Injectable({
  providedIn: "root"
})
export class VOrdersService {
  private jsonFileURL: string = "../../assets/vendei/products.json";
  private ordersURL: string = "http://localhost:3000/api/orders";
  private detailsURL: string = "http://localhost:3000/api/orderDetails";

  constructor(private http: HttpClient, private configSvc: VConfigService) {}

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
        .get(this.ordersURL)
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
      .post(this.ordersURL, order)
      .pipe(
        map((response: Response) => {
          return <any>response;
        })
      );
  }

  saveDetail(detail: any): Observable<any> {
    return this.http
      .post(this.detailsURL, detail)
      .pipe(
        map((response: Response) => {
          return <any>response;
        })
      );
  }
}
