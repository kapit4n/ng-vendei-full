import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { CatalogTemplatesComponent } from './catalog-templates.component';
import { VCatalogTemplateService } from '../../../services/vendei/v-catalog-template.service';

describe('CatalogTemplatesComponent', () => {
  let component: CatalogTemplatesComponent;
  let fixture: ComponentFixture<CatalogTemplatesComponent>;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [CatalogTemplatesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogTemplatesComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load templates on init', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/catalogTemplates');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, name: 'Bakery', slug: 'bakery', businessType: 'bakery', description: 'A bakery', active: true, categories: [], products: [] }]);
    expect(component.templates.length).toBe(1);
    expect(component.loading).toBeFalsy();
  });

  it('should handle empty templates', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/catalogTemplates');
    req.flush([]);
    expect(component.templates.length).toBe(0);
    expect(component.loading).toBeFalsy();
  });

  it('should filter by businessType', () => {
    component.templates = [];
    component.loadTemplates();
    const req = httpMock.expectOne((r) => r.url === '/catalogTemplates');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should set selectedTemplate on viewTemplate', () => {
    const t = { id: 2, name: 'Butcher', slug: 'butcher', businessType: 'butcher', description: 'Fresh meat', active: true } as any;
    component.viewTemplate(t);
    expect(component.selectedTemplate).toBe(t);
    expect(component.applyName).toBe('Butcher');
    expect(component.applySlug).toContain('butcher-');
  });

  it('should clear selectedTemplate on closeDetail', () => {
    component.selectedTemplate = { id: 1 } as any;
    component.closeDetail();
    expect(component.selectedTemplate).toBeNull();
  });

  it('should apply template and navigate', () => {
    const t = { id: 5, name: 'Clothing', slug: 'clothing', businessType: 'clothing', description: 'Fashion', active: true } as any;
    component.viewTemplate(t);
    component.applyName = 'My Shop';
    component.applySlug = 'my-shop';
    component.applyBusinessName = 'My Shop Inc';

    component.applyTemplate();
    const req = httpMock.expectOne('/catalogTemplates/5/apply');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.name).toBe('My Shop');
    req.flush({ id: 99 });

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/reg/products'], { queryParams: { storeProfileId: 99 } });
    expect(component.selectedTemplate).toBeNull();
  });

  it('should handle apply error', () => {
    const t = { id: 3, name: 'Bakery', slug: 'bakery', businessType: 'bakery', description: 'Bread', active: true } as any;
    component.viewTemplate(t);
    component.applyTemplate();
    const req = httpMock.expectOne('/catalogTemplates/3/apply');
    req.flush({ error: 'Name taken' }, { status: 400, statusText: 'Bad Request' });
    expect(component.applyError).toBe('Name taken');
    expect(component.applying).toBeFalsy();
  });

  it('should return correct icon for business types', () => {
    expect(component.businessTypeIcon('supermarket')).toBe('shopping_cart');
    expect(component.businessTypeIcon('bakery')).toBe('cake');
    expect(component.businessTypeIcon('clothing')).toBe('checkroom');
    expect(component.businessTypeIcon('unknown')).toBe('store');
  });

  it('should not apply if no template selected', () => {
    component.selectedTemplate = null;
    component.applyTemplate();
    const reqs = httpMock.match(() => true);
    expect(reqs.length).toBe(0);
  });
});
