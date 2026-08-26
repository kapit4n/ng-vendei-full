import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { VariantSelectDialogComponent, VariantSelectData } from './variant-select-dialog.component';
import { VStoreProfileService } from '../../../services/vendei/v-store-profile.service';

describe('VariantSelectDialogComponent', () => {
  let component: VariantSelectDialogComponent;
  let fixture: ComponentFixture<VariantSelectDialogComponent>;
  let httpMock: HttpTestingController;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<VariantSelectDialogComponent>>;
  let profileSvcSpy: jasmine.SpyObj<VStoreProfileService>;

  const mockData: VariantSelectData = {
    productId: 10,
    productName: 'T-Shirt',
    basePrice: 50,
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    profileSvcSpy = jasmine.createSpyObj('VStoreProfileService', ['getCurrencySymbol']);
    profileSvcSpy.getCurrencySymbol.and.returnValue('$');

    await TestBed.configureTestingModule({
      declarations: [VariantSelectDialogComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: VStoreProfileService, useValue: profileSvcSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VariantSelectDialogComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return profile currency symbol', () => {
    expect(component.currencySymbol).toBe('$');
  });

  it('should load active variants on init', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/productVariants?productId=10');
    expect(req.request.method).toBe('GET');
    req.flush([
      { id: 1, productId: 10, name: 'XL Red', price: 65, active: true, attributeLinks: [] },
      { id: 2, productId: 10, name: 'Hidden', price: 0, active: false, attributeLinks: [] },
    ]);
    expect(component.variants.length).toBe(1);
    expect(component.variants[0].name).toBe('XL Red');
    expect(component.loading).toBeFalsy();
  });

  it('should handle empty variants', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/productVariants?productId=10');
    req.flush([]);
    expect(component.variants.length).toBe(0);
    expect(component.loading).toBeFalsy();
  });

  it('should close with variant data on selectVariant', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/productVariants?productId=10');
    req.flush([]);
    component.selectVariant({ id: 5, name: 'Large Blue', sku: 'LB01', barcode: '', price: 70 } as any);
    expect(dialogRefSpy.close).toHaveBeenCalledWith({
      variantId: 5,
      variantName: 'Large Blue',
      variantSku: 'LB01',
      variantBarcode: '',
      currentPrice: 70,
    });
  });

  it('should close with { base: true } on selectBase', () => {
    component.selectBase();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ base: true });
  });

  it('should close with null on close (cancel)', () => {
    component.close();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(null);
  });

  it('should return attribute summary string', () => {
    const variant = {
      attributeLinks: [
        { attributeValue: { definition: { name: 'Size' }, value: 'XL' } },
        { attributeValue: { definition: { name: 'Color' }, value: 'Red' } },
      ],
    } as any;
    expect(component.variantAttributeSummary(variant)).toBe('Size: XL · Color: Red');
  });

  it('should handle variant with no attributeLinks', () => {
    const variant = { attributeLinks: [] } as any;
    expect(component.variantAttributeSummary(variant)).toBe('');
  });

  it('should handle load error', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/productVariants?productId=10');
    req.flush({ error: 'fail' }, { status: 500, statusText: 'Server Error' });
    expect(component.loadError).toContain('Could not load');
    expect(component.loading).toBeFalsy();
  });
});
