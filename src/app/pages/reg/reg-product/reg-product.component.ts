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

const PLACEHOLDER_IMG = 'assets/vendei/placeholders/product-card.svg';

@Component({
    selector: 'app-reg-product',
    templateUrl: './reg-product.component.html',
    styleUrls: ['./reg-product.component.css'],
    standalone: false
})
export class RegProductComponent implements OnInit {
  productInfo: IProduct;
  categories: ICategory[];
  saveError = '';

  constructor(private productSvc: RProductService, private router: Router,
    private categorySvc: RCategoryService, private route: ActivatedRoute) {
    this.productInfo = {} as IProduct;
    this.categories = [];
  }

  get pageTitle(): string {
    return this.isEditing() ? 'Edit product' : 'New product';
  }

  get pageSubtitle(): string {
    return this.isEditing()
      ? 'Update details and save when you are done.'
      : 'Fill in the basics. You can add pricing and units under Product details.';
  }

  get imagePreviewUrl(): string {
    const raw = (this.productInfo?.img || '').trim();
    if (!raw) {
      return PLACEHOLDER_IMG;
    }
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/') || raw.startsWith('assets/')) {
      return raw;
    }
    return PLACEHOLDER_IMG;
  }

  isEditing(): boolean {
    return !!this.route.snapshot.paramMap.get('id');
  }

  /** Mat-select compare when API mixes string/number ids. */
  compareCategoryId(a: string | number | null | undefined, b: string | number | null | undefined): boolean {
    if (a == null || b == null) {
      return a == b;
    }
    return String(a) === String(b);
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productSvc.getById(id).subscribe(product => {
        this.productInfo = {
          ...product,
          categoryId: product.categoryId != null ? String(product.categoryId) : '',
        };
      });
    }
    this.categorySvc.getAll().subscribe(cats => {
      this.categories = cats || [];
      if (!id && this.categories.length && (this.productInfo.categoryId == null || this.productInfo.categoryId === '')) {
        this.productInfo.categoryId = String(this.categories[0].id);
      }
    });
  }

  save() {
    this.saveError = '';
    const name = (this.productInfo.name || '').trim();
    const code = (this.productInfo.code || '').trim();
    if (!name) {
      this.saveError = 'Product name is required.';
      return;
    }
    if (!code) {
      this.saveError = 'Product code is required.';
      return;
    }
    if (this.productInfo.categoryId == null || this.productInfo.categoryId === '') {
      this.saveError = 'Please choose a category.';
      return;
    }

    const payload = {
      ...this.productInfo,
      name,
      code,
      categoryId: this.productInfo.categoryId,
    };

    const onErr = () => {
      this.saveError = 'Could not save. Check your connection and try again.';
    };

    if (this.productInfo.id) {
      this.productSvc.update(payload).subscribe({
        next: () => this.router.navigate(['/reg/products']),
        error: onErr,
      });
    } else {
      this.productSvc.save(payload).subscribe({
        next: () => this.router.navigate(['/reg/products']),
        error: onErr,
      });
    }
  }

  cancel() {
    this.router.navigate(['/reg/products']);
  }
}
