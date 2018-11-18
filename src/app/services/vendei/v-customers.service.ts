import { Injectable } from "@angular/core";

import { HttpClient } from "@angular/common/http";
import { Observable, Subject, of } from "rxjs";
import { map, filter, switchMap } from "rxjs/operators";
import { VConfigService } from './v-config.service'

import "rxjs"; //get everything from Rx

@Injectable({
  providedIn: "root"
})
export class VCustomersService {
  /** Product list */
  customers: any[];

  /** json URL */
  private jsonFileURL: string = "../../assets/vendei/customers.json";
  private customersURL: string = "http://localhost:3000/api/customers";

  /** Product List service constructor */
  constructor(private http: HttpClient, private configSvc: VConfigService) {}

  /**
   * Returns the list of products
   */
  list(): any[] {
    return this.customers;
  }

  /**
   * Return an observable with the yeam that matches the id
   */
  getCustomerById(id: any): Observable<any> {
    return this.http.get(this.jsonFileURL).pipe(
      map((response: Response) => {
        return <any>response.json()[id - 1];
      })
    );
  }

  /**
   * Return an observable with the list of products
   */
  getAll(): Observable<any> {
    if (this.configSvc.isTest) {
      return this.http.get(this.jsonFileURL).pipe(
        map((response: Response) => {
          return <any>response;
        })
      );
    } else {
      return this.http.get(this.customersURL).pipe(
        map((response: Response) => {
          return <any>response;
        })
      );
    }
  }
}
