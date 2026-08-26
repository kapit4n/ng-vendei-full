import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { RegAttributeComponent } from './reg-attribute.component';
import { RAttributeDefinitionService } from '../../../services/reg/r-attribute-definition.service';
import { VStoreProfileService } from '../../../services/vendei/v-store-profile.service';
import { of } from 'rxjs';

describe('RegAttributeComponent', () => {
  let component: RegAttributeComponent;
  let fixture: ComponentFixture<RegAttributeComponent>;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  function setupRoute(id: string | null) {
    TestBed.overrideComponent(RegAttributeComponent, {
      add: {
        providers: [
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                paramMap: {
                  get: () => id,
                },
              },
            },
          },
        ],
      },
    });
  }

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    setupRoute(null);

    await TestBed.configureTestingModule({
      declarations: [RegAttributeComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegAttributeComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show "New attribute" title', () => {
    expect(component.pageTitle).toBe('New attribute');
  });

  it('should show isSelectType false for TEXT', () => {
    component.attrInfo.type = 'TEXT';
    expect(component.isSelectType).toBe(false);
  });

  it('should show isSelectType true for SELECT', () => {
    component.attrInfo.type = 'SELECT';
    expect(component.isSelectType).toBe(true);
  });

  it('should validate name required', () => {
    component.attrInfo.name = '';
    component.attrInfo.code = 'SIZE';
    component.save();
    expect(component.saveError).toContain('name is required');
  });

  it('should validate code required', () => {
    component.attrInfo.name = 'Size';
    component.attrInfo.code = '';
    component.save();
    expect(component.saveError).toContain('code is required');
  });

  it('should save new attribute and navigate', () => {
    component.attrInfo = {
      storeProfileId: 1,
      name: 'Color',
      code: 'COLOR',
      type: 'SELECT',
      options: [],
      required: false,
      active: true,
      sortOrder: 0,
    };
    component.optionsInput = 'Red, Blue, Green';

    component.save();
    const req = httpMock.expectOne('/productAttributeDefinitions');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.options).toEqual(['Red', 'Blue', 'Green']);
    req.flush({ id: 10 });
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/reg/attributes']);
  });

  it('should cancel and navigate back', () => {
    component.cancel();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/reg/attributes']);
  });

  it('should clear optionsInput on type change away from SELECT', () => {
    component.optionsInput = 'Red, Blue';
    component.attrInfo.type = 'TEXT';
    component.onTypeChange();
    expect(component.optionsInput).toBe('');
  });

  it('should not clear optionsInput on type change to SELECT', () => {
    component.optionsInput = 'Red, Blue';
    component.attrInfo.type = 'SELECT';
    component.onTypeChange();
    expect(component.optionsInput).toBe('Red, Blue');
  });
});
