import { Component, OnInit, Input } from '@angular/core';
import { VProductsService } from '../../../services/vendei/v-products.service'
import { VCategoriesService } from '../../../services/vendei/v-categories.service';

@Component({
  selector: "app-product-list",
  templateUrl: "./product-list.component.html",
  styleUrls: ["./product-list.component.css"]
})
export class ProductListComponent implements OnInit {
  @Input()
  selectedProducts: any[];
  @Input() recalTotal: Function;

  products = [];
  productCode = "";
  originalP = [];
  categories = [{id: 0, name: "All"},{id: 1, name: "Gatgets"}, {id: 2, name: "TVs"}, { id: 3, name: "Computer" }]
  
  constructor(private productsSvc: VProductsService, private categoriesSvc: VCategoriesService) {}

  ngOnInit() {
    this.productsSvc.getProducts().subscribe(res => {
      this.products = res;
      this.originalP = res;
    });
    
    this.categoriesSvc.getAll().subscribe(res => {
      this.categories = res;
    });

  }

  addProduct(product: any) {
    if (this.selectedProducts.some(p => p.id == product.id))  {
      this.selectedProducts.filter(p => p.id == product.id)[0].quantity += 1;
    } else {
      const selectedP = Object.assign({ quantity: 1 }, product);
      this.selectedProducts.push(selectedP);
    }
    this.recalTotal();
  }

  filterByCategory(cat: any) {
    if (cat.id > 0) {
      this.products = this.originalP.filter(p => p.categoryId == cat.id);
    } else {
      this.products = this.originalP;
    }
  }

  filterByName(event) {
    let searchText = event.target.value;
    if (searchText) {
      let sText = searchText.toLowerCase();
      this.products = this.originalP.filter(p =>
        p.name.toLowerCase().includes(sText)
      );
    } else {
      this.products = this.originalP;
    }
  }

  addByCode(event) {
    let searchCode = event.target.value;
    
    if (searchCode) {
      let cProduct = this.originalP.find(p => p.code.toLowerCase() == searchCode);
      if (cProduct) {
        this.addProduct(cProduct);
        this.productCode = "";
      }
    }
  }

}
