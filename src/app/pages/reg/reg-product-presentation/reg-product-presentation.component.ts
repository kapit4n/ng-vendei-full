import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { ActivatedRoute } from '@angular/router';
import {
  IProductPresentation, RProductPresentationService
} from '../../../services/reg/r-product-presentation.service';
import {
  RProductService,
  IProduct
} from "../../../services/reg/r-product.service";

@Component({
  selector: 'app-reg-product-presentation',
  templateUrl: './reg-product-presentation.component.html',
  styleUrls: ['./reg-product-presentation.component.css']
})
export class RegProductPresentationComponent implements OnInit {
  productPresentationInfo: IProductPresentation ;
  products: IProduct[];

  constructor(private productPresentationSvc: RProductPresentationService, private router: Router,
    private productSvc: RProductService, private route: ActivatedRoute) {
    this.productPresentationInfo = {} as IProductPresentation;
    this.products = [];
  }

  isNew() {
    let id = this.route.snapshot.paramMap.get("id");
    return !id && id == "new";
  }

  ngOnInit() {
    let id = this.route.snapshot.paramMap.get("id");
    console.log(id)
    if (id && id != "new") {
      this.productPresentationSvc.getById(id).subscribe(productPresentation => {
        this.productPresentationInfo = productPresentation;
      })
    }
    this.productSvc.getAll().subscribe(products => {
      this.products = products;
    });
  }

  save() {
    if (this.productPresentationInfo.id) {
      this.productPresentationSvc.update(this.productPresentationInfo).subscribe(productPresentation => {
        this.router.navigate(['/reg/products']);
      });
    } else {
      this.productPresentationSvc.save(this.productPresentationInfo).subscribe(productPresentation => {
        this.router.navigate(['/reg/products']);
      });
    }
  }

  cancel() {
    this.router.navigate(['/reg/products']);
  }
}
