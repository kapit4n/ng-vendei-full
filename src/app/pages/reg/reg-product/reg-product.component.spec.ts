import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { RegProductComponent } from './reg-product.component';
import { RProductService } from '../../../services/reg/r-product.service';
import { RCategoryService } from '../../../services/reg/r-category.service';
import { RUnitOfMeasureService } from '../../../services/reg/r-unit-of-measure.service';
import { VStoreProfileService, SELLING_MODES, SellingMode } from '../../../services/vendei/v-store-profile.service';

describe('RegProductComponent', () => {
  let component: RegProductComponent;
  let fixture: ComponentFixture<RegProductComponent>;
  let profileSvcSpy: jasmine.SpyObj<VStoreProfileService>;
  let productSvcSpy: jasmine.SpyObj<RProductService>;

  function configureProfile(caps: string[], defaultMode: SellingMode = SELLING_MODES.UNIT): void {
    const profile = {
      id: 1,
      name: 'Bodega Central',
      slug: 'bodega-central',
      businessName: 'Bodega Central',
      businessType: 'supermarket',
      capabilities: caps,
      posConfig: {
        catalogColumns: 4,
        showProductImages: true,
        quickProducts: [],
        defaultSellingMode: defaultMode,
        enabledPaymentTypes: [1, 4],
      },
    };
    profileSvcSpy.getActiveProfile.and.returnValue(profile as never);
    profileSvcSpy.getCapabilities.and.returnValue(caps);
    profileSvcSpy.getDefaultSellingMode.and.returnValue(defaultMode);
    profileSvcSpy.hasCapability.and.callFake((cap: string) => caps.includes(cap));
    profileSvcSpy.getBusinessName.and.returnValue('Bodega Central');
    profileSvcSpy.getBusinessType.and.returnValue('supermarket');
  }

  beforeEach(waitForAsync(() => {
    profileSvcSpy = jasmine.createSpyObj<VStoreProfileService>('VStoreProfileService', [
      'getActiveProfile',
      'getCapabilities',
      'getDefaultSellingMode',
      'hasCapability',
      'getBusinessName',
      'getBusinessType',
    ]);
    profileSvcSpy.getActiveProfile.and.returnValue(null);
    profileSvcSpy.getCapabilities.and.returnValue([]);
    profileSvcSpy.getDefaultSellingMode.and.returnValue(SELLING_MODES.UNIT);
    profileSvcSpy.hasCapability.and.returnValue(false);
    profileSvcSpy.getBusinessName.and.returnValue('');
    profileSvcSpy.getBusinessType.and.returnValue('');

    productSvcSpy = jasmine.createSpyObj<RProductService>('RProductService', [
      'getAll',
      'getById',
      'save',
      'update',
    ]);
    productSvcSpy.save.and.returnValue(of({ id: 999 }));
    productSvcSpy.update.and.returnValue(of({ id: 999 }));

    const categorySvcSpy = jasmine.createSpyObj('RCategoryService', ['getAll']);
    categorySvcSpy.getAll.and.returnValue(of([]));
    const uomSvcSpy = jasmine.createSpyObj('RUnitOfMeasureService', ['getAll']);
    uomSvcSpy.getAll.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([])],
      declarations: [RegProductComponent],
      providers: [
        { provide: RProductService, useValue: productSvcSpy },
        { provide: RCategoryService, useValue: categorySvcSpy },
        { provide: RUnitOfMeasureService, useValue: uomSvcSpy },
        { provide: VStoreProfileService, useValue: profileSvcSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RegProductComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('applies the business profile on load', () => {
    configureProfile(['BARCODE', 'DISCOUNTS', 'CUSTOMERS']);
    fixture.detectChanges();
    expect(component.availableSellingModes).toEqual([SELLING_MODES.UNIT]);
    expect(component.businessName).toBe('Bodega Central');
  });

  it('defaults the product selling mode to the profile default', () => {
    configureProfile(['WEIGHT_PRODUCTS'], SELLING_MODES.WEIGHT);
    fixture.detectChanges();
    expect(component.productInfo.sellingMode).toBe(SELLING_MODES.WEIGHT);
  });

  it('offers WEIGHT only when WEIGHT_PRODUCTS capability is enabled', () => {
    configureProfile(['WEIGHT_PRODUCTS', 'EXPIRATION', 'CUSTOMERS']);
    fixture.detectChanges();
    expect(component.availableSellingModes).toContain(SELLING_MODES.WEIGHT);
    expect(component.availableSellingModes).not.toContain(SELLING_MODES.VARIANT);
  });

  it('offers VARIANT/COMBO/VARIABLE_QTY based on capabilities', () => {
    configureProfile(['PRODUCT_VARIANTS', 'COMBOS', 'VARIABLE_QUANTITY']);
    fixture.detectChanges();
    expect(component.availableSellingModes).toEqual([
      SELLING_MODES.UNIT,
      SELLING_MODES.VARIABLE_QTY,
      SELLING_MODES.VARIANT,
      SELLING_MODES.COMBO,
    ]);
  });

  it('resets expiry fields when the EXPIRATION capability is off', () => {
    configureProfile(['BARCODE']);
    component.productInfo.trackExpiry = true;
    component.productInfo.defaultShelfLifeDays = 5;
    fixture.detectChanges();
    expect(component.canTrackExpiry).toBeFalsy();
    expect(component.productInfo.trackExpiry).toBeFalsy();
    expect(component.productInfo.defaultShelfLifeDays).toBeNull();
  });

  it('keeps expiry editing enabled when the EXPIRATION capability is on', () => {
    configureProfile(['EXPIRATION']);
    fixture.detectChanges();
    expect(component.canTrackExpiry).toBeTruthy();
  });

  it('hides the expiry block in the DOM when EXPIRATION is disabled', () => {
    configureProfile(['BARCODE']);
    fixture.detectChanges();
    const block = fixture.nativeElement.querySelector('.expiry-block');
    expect(block).toBeNull();
  });

  it('shows the expiry block in the DOM when EXPIRATION is enabled', () => {
    configureProfile(['EXPIRATION']);
    fixture.detectChanges();
    const block = fixture.nativeElement.querySelector('.expiry-block');
    expect(block).not.toBeNull();
  });

  it('marks the business as barcode-driven when BARCODE is enabled', () => {
    configureProfile(['BARCODE']);
    fixture.detectChanges();
    expect(component.isBarcodeBusiness).toBeTruthy();
  });

  it('displays the selling mode selector when more than one mode is available', () => {
    configureProfile(['WEIGHT_PRODUCTS']);
    fixture.detectChanges();
    const field = fixture.nativeElement.querySelector('.selling-mode-field');
    expect(field).not.toBeNull();
  });

  it('hides the selling mode selector when only UNIT is available', () => {
    configureProfile(['BARCODE']);
    fixture.detectChanges();
    const field = fixture.nativeElement.querySelector('.selling-mode-field');
    expect(field).toBeNull();
  });

  it('sends the selected sellingMode when creating a product', () => {
    configureProfile(['VARIABLE_QUANTITY'], SELLING_MODES.UNIT);
    fixture.detectChanges();
    component.productInfo.name = 'Cable';
    component.productInfo.code = 'CBL-01';
    component.productInfo.categoryId = '1';
    component.productInfo.sellingMode = SELLING_MODES.VARIABLE_QTY;
    component['save']();
    expect(productSvcSpy.save).toHaveBeenCalledWith(
      jasmine.objectContaining({ sellingMode: SELLING_MODES.VARIABLE_QTY })
    );
  });

  it('falls back to UNIT when the selected mode is not allowed by the business', () => {
    configureProfile(['BARCODE'], SELLING_MODES.UNIT);
    fixture.detectChanges();
    component.productInfo.name = 'Milk';
    component.productInfo.code = 'MILK-01';
    component.productInfo.categoryId = '1';
    component.productInfo.sellingMode = 'WEIGHT';
    component['save']();
    expect(productSvcSpy.save).toHaveBeenCalledWith(
      jasmine.objectContaining({ sellingMode: SELLING_MODES.UNIT })
    );
  });

  it('does not send trackExpiry when EXPIRATION is disabled', () => {
    configureProfile(['BARCODE']);
    fixture.detectChanges();
    component.productInfo.name = 'Salt';
    component.productInfo.code = 'SALT-01';
    component.productInfo.categoryId = '1';
    component['save']();
    expect(productSvcSpy.save).toHaveBeenCalledWith(
      jasmine.objectContaining({ trackExpiry: false, defaultShelfLifeDays: null })
    );
  });
});