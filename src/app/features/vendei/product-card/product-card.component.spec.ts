import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { VStoreProfileService } from 'src/app/services/vendei/v-store-profile.service';
import { ProductImageComponent } from './product-image.component';
import { ProductCardComponent } from './product-card.component';

describe('ProductCardComponent', () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;
  let profileSvcSpy: jasmine.SpyObj<VStoreProfileService>;

  const baseProduct: any = {
    id: 591,
    currentPrice: 12,
    price: 12,
    img: 'assets/vendei/catalog/supermarket/coca-cola-2l.svg',
    Product: {
      id: 591,
      name: 'Coca Cola 2L',
      code: 'SEED-PRD-SU-01',
      stock: 100,
      sellingMode: 'UNIT',
      img: 'assets/vendei/catalog/supermarket/coca-cola-2l.svg',
    },
  };

  beforeEach(waitForAsync(() => {
    profileSvcSpy = jasmine.createSpyObj('VStoreProfileService', ['getCurrencySymbol']);
    profileSvcSpy.getCurrencySymbol.and.returnValue('Bs');

    TestBed.configureTestingModule({
      declarations: [ProductCardComponent, ProductImageComponent],
      providers: [{ provide: VStoreProfileService, useValue: profileSvcSpy }],
    }).compileComponents();
  }));

  /** Create the component with the given inputs already applied before the first render. */
  function create(product: any = baseProduct, opts: Partial<{ showImage: boolean; disabled: boolean; respectStock: boolean; cardSize: string }> = {}) {
    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
    component.product = product;
    component.showImage = opts.showImage ?? true;
    component.disabled = opts.disabled ?? false;
    component.respectStock = opts.respectStock ?? false;
    component.cardSize = (opts.cardSize as any) ?? 'medium';
    fixture.detectChanges();
    return component;
  }

  it('should create', () => {
    create();
    expect(component).toBeTruthy();
  });

  it('derives title by stripping parenthetical labels', () => {
    create({ Product: { name: 'Red Apple (1 lb)' } });
    expect(component.title).toBe('Red Apple');
  });

  it('keeps unit label from the parenthetical suffix', () => {
    create({ Product: { name: 'Red Apple (1 lb)' } });
    expect(component.label).toBe('(1 lb)');
  });

  it('derives unit label from selling mode when name has no suffix', () => {
    create({ Product: { name: 'Banana', sellingMode: 'WEIGHT' }, sellingMode: 'WEIGHT' });
    expect(component.unitLabel).toBe('(kg)');
  });

  it('falls back to product name when missing', () => {
    create({});
    expect(component.productName).toBe('Product');
  });

  it('returns rounded price from currentPrice', () => {
    create({ currentPrice: 12, price: 11, Product: { name: 'X' } });
    expect(component.price).toBe(12);
  });

  it('falls back to price when currentPrice absent', () => {
    create({ price: 2.5, Product: { name: 'X' } });
    expect(component.price).toBe(2.5);
  });

  it('exposes the SKU from Product.code', () => {
    create();
    expect(component.sku).toBe('SEED-PRD-SU-01');
  });

  it('exposes stock from Product.stock', () => {
    create();
    expect(component.stock).toBe(100);
  });

  it('is not sold out when stock is positive', () => {
    create(baseProduct, { respectStock: true });
    expect(component.isSoldOut).toBe(false);
  });

  it('is sold out when stock is zero and respectStock is true', () => {
    create({ Product: { name: 'X', stock: 0 } }, { respectStock: true });
    expect(component.isSoldOut).toBe(true);
    expect(component.isDisabled).toBe(true);
  });

  it('ignores stock when respectStock is false', () => {
    create({ Product: { name: 'X', stock: 0 } });
    expect(component.isSoldOut).toBe(false);
  });

  it('is disabled when disabled input is set', () => {
    create(baseProduct, { disabled: true });
    expect(component.isDisabled).toBe(true);
  });

  it('emits addProduct on activate when enabled', () => {
    create();
    let emitted = false;
    component.addProduct.subscribe(() => (emitted = true));
    component.onActivate();
    expect(emitted).toBe(true);
  });

  it('does not emit addProduct on activate when disabled', () => {
    create(baseProduct, { disabled: true });
    let emitted = false;
    component.addProduct.subscribe(() => (emitted = true));
    component.onActivate();
    expect(emitted).toBe(false);
  });

  it('renders the product name and formatted price in the DOM', () => {
    create();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Coca Cola 2L');
    expect(el.textContent).toContain('Bs 12.00');
  });

  it('renders an accessible add button with the product aria-label', () => {
    create();
    const btn = fixture.nativeElement.querySelector('button.product-card');
    expect(btn).toBeTruthy();
    expect(btn.getAttribute('aria-label')).toBe('Add Coca Cola 2L');
  });

  describe('card size density variants', () => {
    it('defaults to medium (no variant class)', () => {
      create();
      const btn: HTMLElement = fixture.nativeElement.querySelector('button.product-card');
      expect(component.cardSize).toBe('medium');
      expect(btn.classList.contains('product-card--small')).toBe(false);
      expect(btn.classList.contains('product-card--large')).toBe(false);
    });

    it('applies the small variant class', () => {
      create(baseProduct, { cardSize: 'small' });
      const btn: HTMLElement = fixture.nativeElement.querySelector('button.product-card');
      expect(btn.classList.contains('product-card--small')).toBe(true);
    });

    it('applies the large variant class', () => {
      create(baseProduct, { cardSize: 'large' });
      const btn: HTMLElement = fixture.nativeElement.querySelector('button.product-card');
      expect(btn.classList.contains('product-card--large')).toBe(true);
    });

    it('small hides the SKU via the small variant style', () => {
      create(baseProduct, { cardSize: 'small' });
      const sku: HTMLElement = fixture.nativeElement.querySelector('.product-card__sku');
      expect(sku).toBeTruthy();
      expect(getComputedStyle(sku).display).toBe('none');
    });

    it('medium and large keep the SKU visible', () => {
      create(baseProduct, { cardSize: 'medium' });
      let sku: HTMLElement = fixture.nativeElement.querySelector('.product-card__sku');
      expect(sku).toBeTruthy();
      expect(getComputedStyle(sku).display).not.toBe('none');
      create(baseProduct, { cardSize: 'large' });
      sku = fixture.nativeElement.querySelector('.product-card__sku');
      expect(getComputedStyle(sku).display).not.toBe('none');
    });

    it('small keeps image, name and price visible', () => {
      create(baseProduct, { cardSize: 'small' });
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('app-product-image')).toBeTruthy();
      expect(el.textContent).toContain('Coca Cola 2L');
      expect(el.textContent).toContain('Bs 12.00');
    });
  });
});
