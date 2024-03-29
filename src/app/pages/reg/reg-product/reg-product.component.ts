import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { ActivatedRoute } from '@angular/router';
import {
  IProduct, RProductService
} from '../../../services/reg/r-product.service';
import {
  RCategoryService,
  ICategory
} from "../../../services/reg/r-category.service";

@Component({
  selector: 'app-reg-product',
  templateUrl: './reg-product.component.html',
  styleUrls: ['./reg-product.component.css']
})
export class RegProductComponent implements OnInit {
  productInfo: IProduct ;
  categories: ICategory[];

  constructor(private productSvc: RProductService, private router: Router,
    private categorySvc: RCategoryService, private route: ActivatedRoute) {
    this.productInfo = {} as IProduct;
    this.categories = [];
  }

  isNew() {
    let id = this.route.snapshot.paramMap.get("id");
    return !id && id == "new";
  }

  ngOnInit() {
    let id = this.route.snapshot.paramMap.get("id");
    console.log(id)
    if (id && id != "new") {
      this.productSvc.getById(id).subscribe(product => {
        this.productInfo = product;
      })
    }
    this.categorySvc.getAll().subscribe(cats => {
      this.categories = cats;
    });
  }

  save() {
    if (this.productInfo.id) {
      this.productSvc.update(this.productInfo).subscribe(product => {
        this.router.navigate(['/reg/products']);
      });
    } else {
      this.productSvc.save(this.productInfo).subscribe(product => {
        this.router.navigate(['/reg/products']);
      });
    }
  }

  cancel() {
    this.router.navigate(['/reg/products']);
  }
}
