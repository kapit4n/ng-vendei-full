import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { StoreProfileSelectorComponent } from './store-profile-selector.component';
import { VStoreProfileService, StoreProfile } from '../../../services/vendei/v-store-profile.service';

describe('StoreProfileSelectorComponent', () => {
  let component: StoreProfileSelectorComponent;
  let fixture: ComponentFixture<StoreProfileSelectorComponent>;
  let profileSvcSpy: jasmine.SpyObj<VStoreProfileService>;
  let activeProfileIdSubject: any;

  const mockProfiles: StoreProfile[] = [
    { id: 1, name: 'Supermarket', slug: 'supermarket', description: 'Groceries', active: true, defaultProfile: true },
    { id: 2, name: 'Chicken Store', slug: 'chicken-store', description: 'Chicken', active: true, defaultProfile: false },
  ];

  beforeEach(waitForAsync(() => {
    activeProfileIdSubject = { getValue: () => 1, asObservable: () => of(1) };
    profileSvcSpy = jasmine.createSpyObj('VStoreProfileService', ['getProfiles', 'getActiveProfileId', 'getActiveProfileId$', 'setActiveProfile', 'getActiveProfile']);
    profileSvcSpy.getProfiles.and.returnValue(of(mockProfiles));
    profileSvcSpy.getActiveProfileId.and.returnValue(1);
    (profileSvcSpy as any).getActiveProfileId$ = () => activeProfileIdSubject.asObservable();

    TestBed.configureTestingModule({
      declarations: [StoreProfileSelectorComponent],
      imports: [
        BrowserAnimationsModule,
        MatIconModule,
        MatSelectModule,
        MatFormFieldModule,
      ],
      providers: [
        { provide: VStoreProfileService, useValue: profileSvcSpy },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StoreProfileSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads profiles on init', () => {
    expect(profileSvcSpy.getProfiles).toHaveBeenCalled();
    expect(component.profiles.length).toBe(2);
  });

  it('sets loading to false after profiles load', () => {
    expect(component.loading).toBe(false);
  });

  it('emits profileChanged on selection', () => {
    spyOn(component.profileChanged, 'emit');
    component.onSelectionChange(2);
    expect(profileSvcSpy.setActiveProfile).toHaveBeenCalledWith(mockProfiles[1]);
    expect(component.profileChanged.emit).toHaveBeenCalledWith(mockProfiles[1]);
  });

  it('does not emit if same profile is selected', () => {
    spyOn(component.profileChanged, 'emit');
    component.onSelectionChange(1);
    expect(component.profileChanged.emit).not.toHaveBeenCalled();
  });

  it('returns active profile from getter', () => {
    const active = component.activeProfile;
    expect(active).toBeTruthy();
    expect(active!.name).toBe('Supermarket');
  });
});
