import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { By } from '@angular/platform-browser';
import { BusinessSettingsComponent } from './business-settings.component';
import { VStoreProfileService, StoreProfile } from 'src/app/services/vendei/v-store-profile.service';

describe('BusinessSettingsComponent', () => {
  let component: BusinessSettingsComponent;
  let fixture: ComponentFixture<BusinessSettingsComponent>;
  let profileSvcSpy: jasmine.SpyObj<VStoreProfileService>;

  const mockProfiles: StoreProfile[] = [
    { id: 1, name: 'Supermarket', slug: 'supermarket', description: 'Groceries', active: true, defaultProfile: true, businessType: 'supermarket', businessName: 'Super Martinez' },
    { id: 2, name: 'Chicken Store', slug: 'chicken-store', description: 'Chicken', active: true, defaultProfile: false, businessType: 'chicken-store', businessName: 'Polleria El Pollo' },
    { id: 3, name: 'Closed Shop', slug: 'closed', description: 'Deactivated', active: false, defaultProfile: false, businessType: 'other' },
  ];

  beforeEach(waitForAsync(() => {
    profileSvcSpy = jasmine.createSpyObj('VStoreProfileService', [
      'getProfiles',
      'getDefaultProfile',
      'setDefaultProfile',
      'getCatalogCardSize',
      'setCatalogCardSize',
    ]);
    profileSvcSpy.getProfiles.and.returnValue(of(mockProfiles));
    profileSvcSpy.setDefaultProfile.and.callFake((p: StoreProfile) => of({ ...p, defaultProfile: true }));
    profileSvcSpy.getCatalogCardSize.and.returnValue('medium');
    profileSvcSpy.setCatalogCardSize.and.callFake(() => of({ ...mockProfiles[0], posConfig: { catalogColumns: 4, showProductImages: true, quickProducts: [], defaultSellingMode: 'UNIT', enabledPaymentTypes: [1, 4], catalogCardSize: 'medium' } } as StoreProfile));

    TestBed.configureTestingModule({
      declarations: [BusinessSettingsComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{ provide: VStoreProfileService, useValue: profileSvcSpy }],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BusinessSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads profiles and preselects the configured default', () => {
    expect(profileSvcSpy.getProfiles).toHaveBeenCalled();
    expect(component.profiles.length).toBe(3);
    expect(component.selectedProfileId).toBe(1);
    expect(component.loading).toBe(false);
  });

  it('shows the settings header and description', () => {
    const title = fixture.debugElement.query(By.css('mat-card-title')).nativeElement.textContent.trim();
    const subtitle = fixture.debugElement.query(By.css('mat-card-subtitle')).nativeElement.textContent.trim();
    expect(title).toContain('Default Business Type');
    expect(subtitle).toContain('loaded automatically when the POS starts.');
  });

  it('lists the available business types as select options', () => {
    expect(fixture.debugElement.query(By.css('mat-select'))).toBeTruthy();
    const options = fixture.debugElement.queryAll(By.css('mat-option'));
    expect(options.length).toBe(3);
  });

  it('returns an empty state when no profiles are available', () => {
    profileSvcSpy.getProfiles.and.returnValue(of([]));
    fixture = TestBed.createComponent(BusinessSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.loadFailed).toBe(true);
    expect(fixture.debugElement.query(By.css('.empty-state'))).toBeTruthy();
  });

  it('shows a loading state while fetching', () => {
    profileSvcSpy.getProfiles.and.returnValue(new Subject<StoreProfile[]>());
    fixture = TestBed.createComponent(BusinessSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.loading).toBe(true);
    expect(fixture.debugElement.query(By.css('.loading-state'))).toBeTruthy();
  });

  it('clears previous feedback when the selection changes', () => {
    component.savedMessage = 'Previous success';
    component.errorMessage = 'Previous error';
    component.onSelectionChange(2);
    expect(component.selectedProfileId).toBe(2);
    expect(component.savedMessage).toBe('');
    expect(component.errorMessage).toBe('');
  });

  it('saves the default and shows a success message', () => {
    component.onSelectionChange(2);
    component.save();
    expect(profileSvcSpy.setDefaultProfile).toHaveBeenCalledWith(jasmine.objectContaining({ id: 2 }));
    fixture.detectChanges();

    expect(component.saving).toBe(false);
    expect(component.selectedProfileId).toBe(2);
    const success = fixture.debugElement.query(By.css('.feedback-message--success'));
    expect(success).toBeTruthy();
    expect(success.nativeElement.textContent).toContain('Polleria El Pollo');
  });

  it('shows an error message when saving fails', () => {
    profileSvcSpy.setDefaultProfile.and.returnValue(throwError(() => new Error('Server down')));
    component.onSelectionChange(2);
    component.save();
    fixture.detectChanges();

    const error = fixture.debugElement.query(By.css('.feedback-message--error'));
    expect(error).toBeTruthy();
    expect(error.nativeElement.textContent).toContain('Could not save');
  });

  it('is a no-op when no profile is selected', () => {
    component.selectedProfileId = null;
    component.save();
    expect(profileSvcSpy.setDefaultProfile).not.toHaveBeenCalled();
  });

  describe('product card size', () => {
    it('loads the card size from the default business (defaults to medium)', () => {
      expect(profileSvcSpy.getCatalogCardSize).toHaveBeenCalled();
      expect(component.cardSize).toBe('medium');
    });

    it('renders a card size control with the three sizes', () => {
      fixture.detectChanges();
      const group = fixture.debugElement.query(By.css('.card-size-control'));
      expect(group).toBeTruthy();
      const btns = fixture.debugElement.queryAll(By.css('.card-size-btn'));
      expect(btns.length).toBe(3);
      expect(btns[0].nativeElement.textContent.trim()).toBe('Small');
      expect(btns[1].nativeElement.textContent.trim()).toBe('Medium');
      expect(btns[2].nativeElement.textContent.trim()).toBe('Large');
      expect(btns[1].nativeElement.getAttribute('aria-pressed')).toBe('true');
    });

    it('saves small for the default business', () => {
      component.selectCardSize('small');
      component.saveCardSize();
      expect(profileSvcSpy.setCatalogCardSize).toHaveBeenCalledWith('small', jasmine.objectContaining({ id: 1 }));
      fixture.detectChanges();
      const success = fixture.debugElement.query(By.css('.feedback-message--success'));
      expect(success).toBeTruthy();
      expect(success.nativeElement.textContent).toContain('small');
    });

    it('saves medium for the default business', () => {
      component.selectCardSize('medium');
      component.saveCardSize();
      expect(profileSvcSpy.setCatalogCardSize).toHaveBeenCalledWith('medium', jasmine.objectContaining({ id: 1 }));
    });

    it('saves large for the default business', () => {
      component.selectCardSize('large');
      component.saveCardSize();
      expect(profileSvcSpy.setCatalogCardSize).toHaveBeenCalledWith('large', jasmine.objectContaining({ id: 1 }));
    });

    it('shows an error message when saving the card size fails', () => {
      profileSvcSpy.setCatalogCardSize.and.returnValue(throwError(() => new Error('Server down')));
      component.selectCardSize('large');
      component.saveCardSize();
      fixture.detectChanges();
      const error = fixture.debugElement.query(By.css('.feedback-message--error'));
      expect(error).toBeTruthy();
      expect(error.nativeElement.textContent).toContain('Could not save the product card size');
    });

    it('selectCardSize clears previous messages', () => {
      component.savedCardSizeMessage = 'Previous';
      component.errorCardSizeMessage = 'Previous error';
      component.selectCardSize('small');
      expect(component.cardSize).toBe('small');
      expect(component.savedCardSizeMessage).toBe('');
      expect(component.errorCardSizeMessage).toBe('');
    });

    it('is a no-op when no card size target profile exists', () => {
      component.profiles = [];
      component.saveCardSize();
      expect(profileSvcSpy.setCatalogCardSize).not.toHaveBeenCalled();
    });
  });
});