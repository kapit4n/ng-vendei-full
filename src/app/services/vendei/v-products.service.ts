import { Injectable } from '@angular/core';

import { HttpClient } from "@angular/common/http";
import { Observable, Subject, of, config } from 'rxjs';
import { map, filter, switchMap } from 'rxjs/operators';

import {VConfigService} from './v-config.service'

import 'rxjs'; //get everything from Rx    

@Injectable({
  providedIn: "root"
})
export class VProductsService {
  /** Product list */
  products: any[];

  /** json URL */
  private jsonFileURL: string = "../../assets/vendei/products.json";
  private productsURL: string = "http://localhost:3000/api/products";

  /** Product List service constructor */
  constructor(private http: HttpClient, private configSvc: VConfigService) {}

  /**
   * Returns the list of products
   */
  list(): any[] {
    return this.products;
  }

  /**
   * Return Product by category
   */
  productsByCategory(category: any): any[] {
    return this.products;
  }

  /**
   * Return an observable with the yeam that matches the id
   */
  getProductById(id: any): Observable<any> {
    return this.http.get(this.jsonFileURL).pipe(
      map((response: Response) => {
        return <any>response.json()[id - 1];
      })
    );
  }

  /**
   * Return an observable with the list of products
   */
  getProducts(): Observable<any> {
    if (this.configSvc.isTest) {
      return this.http.get(this.jsonFileURL).pipe(
        map((response: Response) => {
          return <any>response;
        })
      );
    } else {
      return this.http
        .get(this.productsURL)
        .pipe(
          map((response: Response) => {
            return <any>response;
          })
        );
    }
  }
}
