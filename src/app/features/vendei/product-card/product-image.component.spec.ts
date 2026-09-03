import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PRODUCT_CARD_PLACEHOLDER } from 'src/app/utils/product-image-url';
import { ProductImageComponent } from './product-image.component';

describe('ProductImageComponent', () => {
  let component: ProductImageComponent;
  let fixture: ComponentFixture<ProductImageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProductImageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductImageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('uses placeholder for empty src', () => {
    component.src = '';
    expect(component.resolvedSrc).toBe(PRODUCT_CARD_PLACEHOLDER);
  });

  it('uses placeholder for invalid src', () => {
    component.src = 'not-a-valid-url';
    expect(component.resolvedSrc).toBe(PRODUCT_CARD_PLACEHOLDER);
  });

  it('keeps a valid assets src', () => {
    component.src = 'assets/vendei/catalog/supermarket/coca-cola-2l.svg';
    expect(component.resolvedSrc).toBe('assets/vendei/catalog/supermarket/coca-cola-2l.svg');
  });

  it('keeps a root-relative src', () => {
    component.src = '/media/product.png';
    expect(component.resolvedSrc).toBe('/media/product.png');
  });

  it('falls back to placeholder on load error via onError', () => {
    component.src = 'assets/broken.svg';
    const img = document.createElement('img');
    img.src = 'assets/broken.svg';
    component.onError({ target: img } as unknown as Event);
    // Browsers resolve relative URLs against the page origin; compare the path/name.
    expect(img.src.split('/').pop()).toBe('product-card.svg');
  });

  it('does not loop when the error is already the placeholder', () => {
    component.src = PRODUCT_CARD_PLACEHOLDER;
    const img = document.createElement('img');
    img.src = PRODUCT_CARD_PLACEHOLDER;
    component.onError({ target: img } as unknown as Event);
    expect(img.src.split('/').pop()).toBe('product-card.svg');
  });

  it('renders an img element with the resolved src and alt', () => {
    component.src = 'assets/x.png';
    component.alt = 'Cola';
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('assets/x.png');
    expect(img.getAttribute('alt')).toBe('Cola');
    expect(img.getAttribute('loading')).toBe('lazy');
  });
});
