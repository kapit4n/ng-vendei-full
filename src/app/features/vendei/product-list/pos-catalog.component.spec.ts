import { ComponentFixture, discardPeriodicTasks, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { of, BehaviorSubject, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { VProductsService } from '../../../services/vendei/v-products.service';
import { VCategoriesService } from '../../../services/vendei/v-categories.service';
import { VConfigService } from '../../../services/vendei/v-config.service';
import { VStoreProfileService } from '../../../services/vendei/v-store-profile.service';
import { VProductVariantService } from '../../../services/vendei/v-product-variant.service';
import { PosCatalogComponent } from './pos-catalog.component';

describe('PosCatalogComponent', () => {
  let component: PosCatalogComponent;
  let fixture: ComponentFixture<PosCatalogComponent>;
  let productsSvcSpy: jasmine.SpyObj<VProductsService>;
  let categoriesSvcSpy: jasmine.SpyObj<VCategoriesService>;
  let profileSvcSpy: jasmine.SpyObj<VStoreProfileService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let variantSvcSpy: jasmine.SpyObj<VProductVariantService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let activeProfileIdSubject: BehaviorSubject<number | null>;

  const sampleProducts = [
    {
      id: 1,
      Product: { name: 'Red Apple', code: 'A-001', categoryId: 1, img: '' },
      currentPrice: 2.50,
      price: 2.50,
      img: '',
    },
    {
      id: 2,
      Product: { name: 'Banana (1 lb)', code: 'B-001', categoryId: 1, img: '' },
      currentPrice: 1.20,
      price: 1.20,
      img: '',
    },
    {
      id: 3,
      Product: { name: 'Orange Juice', code: 'O-001', categoryId: 2, img: '' },
      currentPrice: 5.00,
      price: 5.00,
      img: '',
    },
  ];

  const sampleCategories = [
    { id: 1, name: 'Fruits' },
    { id: 2, name: 'Beverages' },
  ];

  beforeEach(waitForAsync(() => {
    productsSvcSpy = jasmine.createSpyObj('VProductsService', ['getProducts']);
    categoriesSvcSpy = jasmine.createSpyObj('VCategoriesService', ['getAll']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    variantSvcSpy = jasmine.createSpyObj('VProductVariantService', ['getByProductId']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    activeProfileIdSubject = new BehaviorSubject<number | null>(1);
    profileSvcSpy = jasmine.createSpyObj('VStoreProfileService', ['getProfiles', 'getActiveProfileId', 'setActiveProfile', 'getActiveProfile', 'hasCapability']);
    profileSvcSpy.getActiveProfileId.and.returnValue(1);
    profileSvcSpy.hasCapability.and.returnValue(true);
    (profileSvcSpy as any).getActiveProfileId$ = () => activeProfileIdSubject.asObservable();

    productsSvcSpy.getProducts.and.returnValue(of(sampleProducts));
    categoriesSvcSpy.getAll.and.returnValue(of(sampleCategories));
    variantSvcSpy.getByProductId.and.returnValue(of([]));

    TestBed.configureTestingModule({
      declarations: [PosCatalogComponent],
      imports: [
        FormsModule,
        MatIconModule,
        MatInputModule,
        MatTooltipModule,
        BrowserAnimationsModule,
      ],
      providers: [
        VConfigService,
        { provide: VProductsService, useValue: productsSvcSpy },
        { provide: VCategoriesService, useValue: categoriesSvcSpy },
        { provide: VStoreProfileService, useValue: profileSvcSpy },
        { provide: Router, useValue: routerSpy },
        { provide: VProductVariantService, useValue: variantSvcSpy },
        { provide: MatDialog, useValue: dialogSpy },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PosCatalogComponent);
    component = fixture.componentInstance;
    component.selectedProducts = [];
    component.recalTotal = () => {};
    fixture.detectChanges();
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('loads products and categories on init', () => {
      expect(productsSvcSpy.getProducts).toHaveBeenCalled();
      expect(categoriesSvcSpy.getAll).toHaveBeenCalled();
    });

    it('normalizes products with currentPrice', () => {
      expect(component.originalP.length).toBe(3);
      expect(component.originalP[0].currentPrice).toBe(2.50);
    });

    it('prepends "All" sentinel category', () => {
      expect(component.categories[0]).toEqual({ id: -1, name: 'All' });
      expect(component.categories.length).toBe(3);
    });

    it('applies filters after loading', () => {
      expect(component.products.length).toBe(3);
    });
  });

  describe('productRowTrack', () => {
    it('uses id if available', () => {
      expect(component.productRowTrack(0, { id: 5 })).toBe(5);
    });

    it('falls back to productId', () => {
      expect(component.productRowTrack(0, { productId: 10 })).toBe(10);
    });

    it('falls back to index as last resort', () => {
      expect(component.productRowTrack(3, {})).toBe(3);
    });
  });

  describe('filtering', () => {
    it('filters by category', () => {
      component.activeCategory = { id: 2, name: 'Beverages' };
      component.applyFilters();
      expect(component.products.length).toBe(1);
      expect(component.products[0].id).toBe(3);
    });

    it('shows all products when activeCategory is null', () => {
      component.activeCategory = null;
      component.applyFilters();
      expect(component.products.length).toBe(3);
    });

    it('filters by search query (name)', () => {
      component.searchQuery = 'Apple';
      component.applyFilters();
      expect(component.products.length).toBe(1);
      expect(component.products[0].id).toBe(1);
    });

    it('filters by search query (code)', () => {
      component.searchQuery = 'B-001';
      component.applyFilters();
      expect(component.products.length).toBe(1);
      expect(component.products[0].Product.name).toBe('Banana (1 lb)');
    });

    it('combines category and search filters', () => {
      component.activeCategory = { id: 1, name: 'Fruits' };
      component.searchQuery = 'banana';
      component.applyFilters();
      expect(component.products.length).toBe(1);
      expect(component.products[0].id).toBe(2);
    });

    it('returns empty when no match', () => {
      component.searchQuery = 'zzzzzz';
      component.applyFilters();
      expect(component.products.length).toBe(0);
    });

    it('search is case insensitive', () => {
      component.searchQuery = 'apple';
      component.applyFilters();
      expect(component.products.length).toBe(1);
    });

    it('handles products with no Product wrapper', () => {
      const productsWithFlatFields = sampleProducts.map(p => ({
        ...p,
        name: p.Product?.name,
        code: p.Product?.code,
        categoryId: p.Product?.categoryId,
        Product: undefined,
      }));
      productsSvcSpy.getProducts.and.returnValue(of(productsWithFlatFields));

      const comp = TestBed.createComponent(PosCatalogComponent);
      comp.componentInstance.selectedProducts = [];
      comp.componentInstance.recalTotal = () => {};
      comp.detectChanges();

      expect(comp.componentInstance.originalP.length).toBe(3);
      expect(comp.componentInstance.originalP[0].name).toBe('Red Apple');
      comp.componentInstance.searchQuery = 'Orange';
      comp.componentInstance.applyFilters();
      expect(comp.componentInstance.products.length).toBe(1);
    });
  });

  describe('onSearchChange / clearSearch', () => {
    it('updates searchQuery and re-filters', () => {
      component.onSearchChange('Orange');
      expect(component.searchQuery).toBe('Orange');
      expect(component.products.length).toBe(1);
    });

    it('clearSearch resets to all products', () => {
      component.onSearchChange('Apple');
      expect(component.products.length).toBe(1);
      component.clearSearch();
      expect(component.searchQuery).toBe('');
      expect(component.products.length).toBe(3);
    });
  });

  describe('selectCategoryChip / isCategoryActive', () => {
    it('sets activeCategory for a real category', () => {
      component.selectCategoryChip({ id: 2, name: 'Beverages' });
      expect(component.activeCategory).toEqual({ id: 2, name: 'Beverages' });
    });

    it('sets activeCategory to null for sentinel -1', () => {
      component.selectCategoryChip({ id: 1, name: 'Fruits' });
      component.selectCategoryChip({ id: -1, name: 'All' });
      expect(component.activeCategory).toBeNull();
    });

    it('isCategoryActive returns true for active category', () => {
      component.selectCategoryChip({ id: 2, name: 'Beverages' });
      expect(component.isCategoryActive({ id: 2, name: 'Beverages' })).toBe(true);
    });

    it('isCategoryActive returns true for "All" when none selected', () => {
      expect(component.isCategoryActive({ id: -1, name: 'All' })).toBe(true);
    });
  });

  describe('resetFilters', () => {
    it('clears category and search and reapplies', () => {
      component.selectCategoryChip({ id: 2, name: 'Beverages' });
      component.searchQuery = 'test';
      component.resetFilters();
      expect(component.activeCategory).toBeNull();
      expect(component.searchQuery).toBe('');
      expect(component.products.length).toBe(3);
    });
  });

  describe('addProduct', () => {
    let recalTotalSpy: jasmine.Spy;

    beforeEach(() => {
      recalTotalSpy = jasmine.createSpy('recalTotal');
      component.recalTotal = recalTotalSpy as any;
    });

    it('adds a new product with quantity 1', () => {
      component.addProduct(sampleProducts[0]);
      expect(component.selectedProducts.length).toBe(1);
      expect(component.selectedProducts[0].quantity).toBe(1);
      expect(component.selectedProducts[0].id).toBe(1);
      expect(recalTotalSpy).toHaveBeenCalled();
    });

    it('increments quantity for existing product', () => {
      component.addProduct(sampleProducts[0]);
      component.addProduct(sampleProducts[0]);
      expect(component.selectedProducts.length).toBe(1);
      expect(component.selectedProducts[0].quantity).toBe(2);
    });

    it('does not add when printOrderCount > 0', () => {
      component.printOrderCount = 1;
      component.addProduct(sampleProducts[1]);
      expect(component.selectedProducts.length).toBe(0);
      expect(recalTotalSpy).not.toHaveBeenCalled();
    });

    it('opens variant dialog when product has variants', fakeAsync(() => {
      const mockVariant = { id: 10, productId: 1, name: 'XL Red', sku: '', barcode: '', price: 70, cost: 0, stock: 0, active: true };
      variantSvcSpy.getByProductId.and.returnValue(of([mockVariant]));
      dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as any);

      component.addProduct(sampleProducts[0]);
      tick();

      expect(dialogSpy.open).toHaveBeenCalled();
      expect(component.selectedProducts.length).toBe(0);
    }));

    it('adds to cart directly when no variants', fakeAsync(() => {
      variantSvcSpy.getByProductId.and.returnValue(of([]));

      component.addProduct(sampleProducts[0]);
      tick();

      expect(component.selectedProducts.length).toBe(1);
      expect(component.selectedProducts[0].quantity).toBe(1);
      expect(dialogSpy.open).not.toHaveBeenCalled();
    }));

    it('adds to cart directly when variant fetch fails', fakeAsync(() => {
      variantSvcSpy.getByProductId.and.returnValue(throwError(() => new Error('network')));

      component.addProduct(sampleProducts[0]);
      tick();

      expect(component.selectedProducts.length).toBe(1);
      expect(component.selectedProducts[0].quantity).toBe(1);
      expect(dialogSpy.open).not.toHaveBeenCalled();
    }));

    it('adds product with variant data when variant is selected', fakeAsync(() => {
      const variantResult = {
        variantId: 10,
        variantName: 'XL Red',
        variantSku: 'XL-R',
        currentPrice: 70,
      };
      variantSvcSpy.getByProductId.and.returnValue(of([{ id: 10, productId: 1, name: 'XL Red', sku: '', barcode: '', price: 70, cost: 0, stock: 0, active: true }]));
      dialogSpy.open.and.returnValue({ afterClosed: () => of(variantResult) } as any);

      component.addProduct(sampleProducts[0]);
      tick();

      expect(component.selectedProducts.length).toBe(1);
      const line = component.selectedProducts[0];
      expect(line.variantId).toBe(10);
      expect(line.variantName).toBe('XL Red');
      expect(line.variantSku).toBe('XL-R');
      expect(line.currentPrice).toBe(70);
      expect(line.id).toBe('1-v10');
    }));

    it('adds product without variant data when base is selected', fakeAsync(() => {
      variantSvcSpy.getByProductId.and.returnValue(of([{ id: 10, productId: 1, name: 'XL Red', sku: '', barcode: '', price: 70, cost: 0, stock: 0, active: true }]));
      dialogSpy.open.and.returnValue({ afterClosed: () => of({ base: true }) } as any);

      component.addProduct(sampleProducts[0]);
      tick();

      expect(component.selectedProducts.length).toBe(1);
      const line = component.selectedProducts[0];
      expect(line.variantId).toBeNull();
      expect(line.variantName).toBeNull();
      expect(line.id).toBe(1);
    }));

    it('does not add product when dialog is cancelled', fakeAsync(() => {
      variantSvcSpy.getByProductId.and.returnValue(of([{ id: 10, productId: 1, name: 'XL Red', sku: '', barcode: '', price: 70, cost: 0, stock: 0, active: true }]));
      dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as any);

      component.addProduct(sampleProducts[0]);
      tick();

      expect(component.selectedProducts.length).toBe(0);
    }));

    it('increments quantity when same variant is added twice', fakeAsync(() => {
      const variantResult = {
        variantId: 10,
        variantName: 'XL Red',
        variantSku: 'XL-R',
        currentPrice: 70,
      };
      variantSvcSpy.getByProductId.and.returnValue(of([{ id: 10, productId: 1, name: 'XL Red', sku: '', barcode: '', price: 70, cost: 0, stock: 0, active: true }]));
      dialogSpy.open.and.returnValue({ afterClosed: () => of(variantResult) } as any);

      component.addProduct(sampleProducts[0]);
      tick();
      component.addProduct(sampleProducts[0]);
      tick();

      expect(component.selectedProducts.length).toBe(1);
      expect(component.selectedProducts[0].quantity).toBe(2);
      expect(component.selectedProducts[0].variantId).toBe(10);
    }));

    it('creates separate lines for different variants of same product', fakeAsync(() => {
      variantSvcSpy.getByProductId.and.returnValue(of([
        { id: 10, productId: 1, name: 'XL Red', sku: 'XL-R', barcode: '', price: 70, cost: 0, stock: 0, active: true },
        { id: 11, productId: 1, name: 'L Blue', sku: 'LB', barcode: '', price: 65, cost: 0, stock: 0, active: true },
      ]));

      dialogSpy.open.and.returnValues(
        { afterClosed: () => of({ variantId: 10, variantName: 'XL Red', variantSku: 'XL-R', currentPrice: 70 }) } as any,
        { afterClosed: () => of({ variantId: 11, variantName: 'L Blue', variantSku: 'LB', currentPrice: 65 }) } as any,
      );

      component.addProduct(sampleProducts[0]);
      tick();
      component.addProduct(sampleProducts[0]);
      tick();

      expect(component.selectedProducts.length).toBe(2);
      expect(component.selectedProducts[0].variantId).toBe(10);
      expect(component.selectedProducts[1].variantId).toBe(11);
    }));

    it('uses variant price when variant has no price set', fakeAsync(() => {
      const variantResult = {
        variantId: 10,
        variantName: 'XL Red',
        variantSku: 'XL-R',
        currentPrice: 2.5,
      };
      variantSvcSpy.getByProductId.and.returnValue(of([{ id: 10, productId: 1, name: 'XL Red', sku: '', barcode: '', price: 0, cost: 0, stock: 0, active: true }]));
      dialogSpy.open.and.returnValue({ afterClosed: () => of(variantResult) } as any);

      component.addProduct(sampleProducts[0]);
      tick();

      expect(component.selectedProducts[0].currentPrice).toBe(2.5);
    }));
  });

  describe('addByCodeField', () => {
    let recalTotalSpy: jasmine.Spy;

    beforeEach(() => {
      recalTotalSpy = jasmine.createSpy('recalTotal');
      component.recalTotal = recalTotalSpy as any;
    });

    it('finds product by exact code and adds it', () => {
      component.productCode = 'A-001';
      component.addByCodeField();
      expect(component.selectedProducts.length).toBe(1);
      expect(component.selectedProducts[0].id).toBe(1);
      expect(component.productCode).toBe('');
      expect(recalTotalSpy).toHaveBeenCalled();
    });

    it('does nothing with empty code', () => {
      component.productCode = '';
      component.addByCodeField();
      expect(component.selectedProducts.length).toBe(0);
      expect(recalTotalSpy).not.toHaveBeenCalled();
    });

    it('does nothing when no product matches', () => {
      component.productCode = 'NONEXISTENT';
      component.addByCodeField();
      expect(component.selectedProducts.length).toBe(0);
      expect(recalTotalSpy).toHaveBeenCalled();
    });

    it('does not add when printOrderCount > 0', () => {
      component.printOrderCount = 1;
      component.productCode = 'A-001';
      component.addByCodeField();
      expect(component.selectedProducts.length).toBe(0);
      expect(recalTotalSpy).not.toHaveBeenCalled();
    });
  });

  describe('navigation', () => {
    it('openReports navigates to /rep/products', () => {
      component.openReports();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/rep/products']);
    });

    it('openRegister navigates to /reg/products', () => {
      component.openRegister();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/reg/products']);
    });

    it('openMain navigates to /main', () => {
      component.openMain();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/main']);
    });

    it('openCategoriesManage navigates to /reg/categories', () => {
      component.openCategoriesManage();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/reg/categories']);
    });
  });

  describe('display helpers', () => {
    it('productCardImageUrl uses presentation image first', () => {
      const url = component.productCardImageUrl({
        img: '/uploads/presentation.jpg',
        Product: { img: '/uploads/product.jpg' },
      });
      expect(url).toContain('presentation');
    });

    it('productCardImageUrl falls back to product image', () => {
      const url = component.productCardImageUrl({
        img: '',
        Product: { img: '/uploads/product.jpg' },
      });
      expect(url).toContain('product');
    });

    it('productCardImageUrl returns placeholder when no images', () => {
      const url = component.productCardImageUrl({ img: '', Product: {} });
      expect(url).toContain('placeholders');
    });

    it('displayProductName returns Product.name first', () => {
      const name = component.displayProductName(sampleProducts[0]);
      expect(name).toBe('Red Apple');
    });

    it('displayProductName falls back to name', () => {
      const name = component.displayProductName({ name: 'Fallback' });
      expect(name).toBe('Fallback');
    });

    it('displayProductName returns "Product" as last resort', () => {
      const name = component.displayProductName({});
      expect(name).toBe('Product');
    });

    it('productCardTitle strips parenthetical suffix', () => {
      const title = component.productCardTitle(sampleProducts[1]);
      expect(title).toBe('Banana');
    });

    it('productCardLabel returns parenthetical suffix', () => {
      const label = component.productCardLabel(sampleProducts[1]);
      expect(label).toBe('(1 lb)');
    });
  });

  describe('focusQuickCode', () => {
    it('schedules focus on quick code input', fakeAsync(() => {
      const focusSpy = jasmine.createSpy('focus');
      component.quickCodeInput = {
        nativeElement: { focus: focusSpy },
      } as any;

      component.focusQuickCode();
      expect(focusSpy).not.toHaveBeenCalled();
      tick();
      expect(focusSpy).toHaveBeenCalled();
      discardPeriodicTasks();
    }));
  });

  describe('capability gating', () => {
    it('canScanBarcode returns true when BARCODE capability enabled', () => {
      profileSvcSpy.hasCapability = jasmine.createSpy('hasCapability').and.callFake((cap: string) => cap === 'BARCODE');
      expect(component.canScanBarcode).toBe(true);
    });

    it('canScanBarcode returns false when BARCODE capability disabled', () => {
      profileSvcSpy.hasCapability = jasmine.createSpy('hasCapability').and.returnValue(false);
      expect(component.canScanBarcode).toBe(false);
    });

    it('hasVariantsEnabled returns true when PRODUCT_VARIANTS capability enabled', () => {
      profileSvcSpy.hasCapability = jasmine.createSpy('hasCapability').and.callFake((cap: string) => cap === 'PRODUCT_VARIANTS');
      expect(component.hasVariantsEnabled).toBe(true);
    });

    it('hasVariantsEnabled returns false when PRODUCT_VARIANTS capability disabled', () => {
      profileSvcSpy.hasCapability = jasmine.createSpy('hasCapability').and.returnValue(false);
      expect(component.hasVariantsEnabled).toBe(false);
    });

    it('skips variant dialog when PRODUCT_VARIANTS disabled', fakeAsync(() => {
      profileSvcSpy.hasCapability = jasmine.createSpy('hasCapability').and.returnValue(false);
      const mockVariant = { id: 10, productId: 1, name: 'XL Red', sku: '', barcode: '', price: 70, cost: 0, stock: 0, active: true };
      variantSvcSpy.getByProductId.and.returnValue(of([mockVariant]));

      component.addProduct(sampleProducts[0]);
      tick();

      expect(component.selectedProducts.length).toBe(1);
      expect(dialogSpy.open).not.toHaveBeenCalled();
    }));
  });
});
