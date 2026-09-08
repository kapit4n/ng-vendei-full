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
    ]);
    profileSvcSpy.getProfiles.and.returnValue(of(mockProfiles));
    profileSvcSpy.setDefaultProfile.and.callFake((p: StoreProfile) => of({ ...p, defaultProfile: true }));

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
});