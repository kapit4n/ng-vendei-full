import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { RegAttributeListComponent } from './reg-attribute-list.component';
import { RAttributeDefinitionService } from '../../../services/reg/r-attribute-definition.service';
import { VStoreProfileService } from '../../../services/vendei/v-store-profile.service';

describe('RegAttributeListComponent', () => {
  let component: RegAttributeListComponent;
  let fixture: ComponentFixture<RegAttributeListComponent>;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [RegAttributeListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegAttributeListComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load attributes on init', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/productAttributeDefinitions');
    expect(req.request.method).toBe('GET');
    req.flush([
      { id: 1, name: 'Size', code: 'SIZE', type: 'SELECT', options: ['S', 'M', 'L', 'XL'], required: true, active: true, sortOrder: 0 },
    ]);
    expect(component.attributes.length).toBe(1);
    expect(component.attributes[0].name).toBe('Size');
  });

  it('should handle empty attributes', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/productAttributeDefinitions');
    req.flush([]);
    expect(component.attributes.length).toBe(0);
    expect(component.loadError).toBe('');
  });

  it('should handle load error', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/productAttributeDefinitions');
    req.flush({ error: 'fail' }, { status: 500, statusText: 'Server Error' });
    expect(component.loadError).toContain('Could not load');
  });

  it('should navigate to new attribute page', () => {
    component.newAttribute();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/reg/attributes/new']);
  });

  it('should navigate to edit attribute page', () => {
    component.openAttribute(5);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/reg/attributes', 5]);
  });

  it('should sort attributes by sortOrder', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/productAttributeDefinitions');
    req.flush([
      { id: 2, name: 'Color', code: 'COLOR', type: 'SELECT', sortOrder: 2, active: true },
      { id: 1, name: 'Size', code: 'SIZE', type: 'SELECT', sortOrder: 1, active: true },
    ]);
    expect(component.attributes[0].code).toBe('SIZE');
    expect(component.attributes[1].code).toBe('COLOR');
  });

  it('should return correct type labels', () => {
    expect(component.typeLabel('TEXT')).toBe('Text');
    expect(component.typeLabel('NUMBER')).toBe('Number');
    expect(component.typeLabel('SELECT')).toBe('Select');
    expect(component.typeLabel('BOOLEAN')).toBe('Boolean');
    expect(component.typeLabel('UNKNOWN')).toBe('UNKNOWN');
  });

  it('should not delete without confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.removeAttribute({ id: 1, name: 'Size' } as any);
    const reqs = httpMock.match(() => true);
    expect(reqs.length).toBe(0);
  });

  it('should delete after confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.removeAttribute({ id: 1, name: 'Size' } as any);
    const req = httpMock.expectOne('/productAttributeDefinitions/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ deleted: 1 });
    expect(component.deleteBusyId).toBeNull();
  });
});
