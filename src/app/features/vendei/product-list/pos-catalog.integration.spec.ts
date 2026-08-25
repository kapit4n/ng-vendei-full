import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { of, BehaviorSubject } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { VProductsService } from '../../../services/vendei/v-products.service';
import { VCategoriesService } from '../../../services/vendei/v-categories.service';
import { VConfigService } from '../../../services/vendei/v-config.service';
import { VStoreProfileService } from '../../../services/vendei/v-store-profile.service';
import { PosCatalogComponent } from './pos-catalog.component';

/**
 * CATALOG & PRODUCT SELECTION REGRESSION — INTEGRATION TEST
 *
 * Validates:
 *   Product → Catalog → Selection → Cart
 *   Catalog switching
 *   Category filtering
 *   Search
 *   Image fallback
 */

describe('Catalog & Product Selection — Integration', () => {
  let component: PosCatalogComponent;
  let fixture: ComponentFixture<PosCatalogComponent>;
  let productsSvcSpy: jasmine.SpyObj<VProductsService>;
  let categoriesSvcSpy: jasmine.SpyObj<VCategoriesService>;
  let profileSvcSpy: jasmine.SpyObj<VStoreProfileService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let activeProfileIdSubject: BehaviorSubject<number | null>;

  const supermarketProducts = [
    { id: 1, Product: { name: 'Coca Cola', code: 'CC-001', categoryId: 10, img: '' }, currentPrice: 8, price: 8, img: '' },
    { id: 2, Product: { name: 'Bread', code: 'BR-001', categoryId: 10, img: '' }, currentPrice: 5, price: 5, img: '' },
  ];

  const chickenProducts = [
    { id: 3, Product: { name: 'Chicken Breast', code: 'CH-001', categoryId: 20, img: '' }, currentPrice: 32, price: 32, img: '' },
    { id: 4, Product: { name: 'Chicken Wings', code: 'CH-002', categoryId: 20, img: '' }, currentPrice: 25, price: 25, img: '' },
  ];

  const supermarketCategories = [{ id: 10, name: 'Beverages' }, { id: 11, name: 'Bakery' }];
  const chickenCategories = [{ id: 20, name: 'Chicken' }, { id: 21, name: 'Sides' }];

  function setupWithProducts(products: any[], categories: any[]) {
    productsSvcSpy.getProducts.and.returnValue(of(products));
    categoriesSvcSpy.getAll.and.returnValue(of(categories));
  }

  beforeEach(waitForAsync(() => {
    productsSvcSpy = jasmine.createSpyObj('VProductsService', ['getProducts']);
    categoriesSvcSpy = jasmine.createSpyObj('VCategoriesService', ['getAll']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    activeProfileIdSubject = new BehaviorSubject<number | null>(1);
    profileSvcSpy = jasmine.createSpyObj('VStoreProfileService', ['getProfiles', 'getActiveProfileId', 'setActiveProfile', 'getActiveProfile']);
    profileSvcSpy.getActiveProfileId.and.returnValue(1);
    (profileSvcSpy as any).getActiveProfileId$ = () => activeProfileIdSubject.asObservable();

    TestBed.configureTestingModule({
      declarations: [PosCatalogComponent],
      imports: [FormsModule, MatIconModule, MatInputModule, MatTooltipModule, BrowserAnimationsModule],
      providers: [
        VConfigService,
        { provide: VProductsService, useValue: productsSvcSpy },
        { provide: VCategoriesService, useValue: categoriesSvcSpy },
        { provide: VStoreProfileService, useValue: profileSvcSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();
  }));

  function createComponent() {
    fixture = TestBed.createComponent(PosCatalogComponent);
    component = fixture.componentInstance;
    component.selectedProducts = [];
    component.recalTotal = jasmine.createSpy('recalTotal');
    fixture.detectChanges();
  }

  // ─── CATALOG ISOLATION ───
  describe('Catalog isolation', () => {
    it('supermarket products appear when supermarket profile is active', () => {
      setupWithProducts(supermarketProducts, supermarketCategories);
      createComponent();

      expect(component.originalP.length).toBe(2);
      expect(component.products.length).toBe(2);
    });

    it('chicken products appear when chicken profile is active', () => {
      setupWithProducts(chickenProducts, chickenCategories);
      createComponent();

      expect(component.originalP.length).toBe(2);
      expect(component.products[0].Product.name).toBe('Chicken Breast');
    });

    it('search for chicken product does not show supermarket products', () => {
      setupWithProducts(chickenProducts, chickenCategories);
      createComponent();

      component.onSearchChange('Coca');
      expect(component.products.length).toBe(0);
    });
  });

  // ─── CATEGORY FILTERING ───
  describe('Category filtering', () => {
    beforeEach(() => {
      setupWithProducts([
        ...supermarketProducts.map(p => ({ ...p, Product: { ...p.Product, categoryId: 10 } })),
        { id: 5, Product: { name: 'Milk', code: 'ML-001', categoryId: 11, img: '' }, currentPrice: 12, price: 12, img: '' },
      ], supermarketCategories);
      createComponent();
    });

    it('All shows all products', () => {
      component.selectCategoryChip({ id: -1, name: 'All' });
      expect(component.products.length).toBe(3);
    });

    it('filters by Beverages category', () => {
      component.selectCategoryChip({ id: 10, name: 'Beverages' });
      expect(component.products.length).toBe(2);
    });

    it('filters by Bakery category', () => {
      component.selectCategoryChip({ id: 11, name: 'Bakery' });
      expect(component.products.length).toBe(1);
      expect(component.products[0].Product.name).toBe('Milk');
    });
  });

  // ─── SEARCH ───
  describe('Search', () => {
    beforeEach(() => {
      setupWithProducts(supermarketProducts, supermarketCategories);
      createComponent();
    });

    it('search by name finds product', () => {
      component.onSearchChange('Coca');
      expect(component.products.length).toBe(1);
      expect(component.products[0].Product.name).toBe('Coca Cola');
    });

    it('search by code finds product', () => {
      component.onSearchChange('BR-001');
      expect(component.products.length).toBe(1);
      expect(component.products[0].Product.name).toBe('Bread');
    });

    it('search is case insensitive', () => {
      component.onSearchChange('coca');
      expect(component.products.length).toBe(1);
    });

    it('search + category filters combine', () => {
      setupWithProducts([
        { id: 1, Product: { name: 'Coca Cola', code: 'CC-001', categoryId: 10, img: '' }, currentPrice: 8, price: 8, img: '' },
        { id: 2, Product: { name: 'Coca Zero', code: 'CZ-001', categoryId: 11, img: '' }, currentPrice: 8, price: 8, img: '' },
      ], supermarketCategories);
      createComponent();

      component.selectCategoryChip({ id: 10, name: 'Beverages' });
      component.onSearchChange('Coca');
      expect(component.products.length).toBe(1);
      expect(component.products[0].id).toBe(1);
    });
  });

  // ─── ADD TO CART ───
  describe('Add to cart', () => {
    beforeEach(() => {
      setupWithProducts(supermarketProducts, supermarketCategories);
      createComponent();
    });

    it('adds product with quantity 1', () => {
      component.addProduct(supermarketProducts[0]);
      expect(component.selectedProducts.length).toBe(1);
      expect(component.selectedProducts[0].quantity).toBe(1);
      expect(component.recalTotal).toHaveBeenCalled();
    });

    it('increments quantity when same product added twice', () => {
      component.addProduct(supermarketProducts[0]);
      component.addProduct(supermarketProducts[0]);
      expect(component.selectedProducts.length).toBe(1);
      expect(component.selectedProducts[0].quantity).toBe(2);
    });

    it('adds different products as separate lines', () => {
      component.addProduct(supermarketProducts[0]);
      component.addProduct(supermarketProducts[1]);
      expect(component.selectedProducts.length).toBe(2);
    });

    it('add by code works', () => {
      component.productCode = 'CC-001';
      component.addByCodeField();
      expect(component.selectedProducts.length).toBe(1);
      expect(component.productCode).toBe('');
    });
  });

  // ─── IMAGE FALLBACK ───
  describe('Image handling', () => {
    beforeEach(() => {
      setupWithProducts(supermarketProducts, supermarketCategories);
      createComponent();
    });

    it('returns placeholder when no images exist', () => {
      const url = component.productCardImageUrl({ img: '', Product: {} });
      expect(url).toContain('placeholders');
    });

    it('uses product image as fallback', () => {
      const url = component.productCardImageUrl({ img: '', Product: { img: '/uploads/prod.jpg' } });
      expect(url).toContain('prod.jpg');
    });
  });

  // ─── PRINT LOCK PREVENTS INTERACTION ───
  describe('Print lock', () => {
    beforeEach(() => {
      setupWithProducts(supermarketProducts, supermarketCategories);
      createComponent();
    });

    it('does not add product when print locked', () => {
      component.printOrderCount = 1;
      component.addProduct(supermarketProducts[0]);
      expect(component.selectedProducts.length).toBe(0);
    });

    it('does not add by code when print locked', () => {
      component.printOrderCount = 1;
      component.productCode = 'CC-001';
      component.addByCodeField();
      expect(component.selectedProducts.length).toBe(0);
    });
  });
});
