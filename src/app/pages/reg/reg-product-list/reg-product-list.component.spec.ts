import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RegProductListComponent } from './reg-product-list.component';
import { RProductService } from '../../../services/reg/r-product.service';
import { of } from 'rxjs';
import { RProductPresentationService } from '../../../services/reg/r-product-presentation.service';
import { VStoreProfileService } from '../../../services/vendei/v-store-profile.service';

const supermarket = { id: 1, name: 'Supermarket', slug: 'supermarket', businessType: 'supermarket', active: true, defaultProfile: true, description: '' };
const chicken = { id: 2, name: 'Chicken Store', slug: 'chicken-store', businessType: 'chicken-store', active: true, defaultProfile: false, description: '' };
const bakery = { id: 3, name: 'Bakery', slug: 'bakery', businessType: 'bakery', active: true, defaultProfile: false, description: '' };

const product = (id: string, storeProfileId: number | string) =>
  ({ id, name: `Product ${id}`, code: id, price: 1, cost: 1, img: '', description: '', categoryId: 'c1', stock: 0, storeProfileId }) as any;

describe('RegProductListComponent', () => {
  let component: RegProductListComponent;
  let fixture: ComponentFixture<RegProductListComponent>;
  /** Mutated by tests; the stub services read it at emit time. */
  let products: any[];
  let profiles: any[];

  /** Reset the fixture with the given data (or the defaults). */
  function build(nextProducts?: any[], nextProfiles?: any[]) {
    products = nextProducts ?? [product('a', 1), product('b', 2)];
    profiles = nextProfiles ?? [supermarket, chicken, bakery];
    fixture = TestBed.createComponent(RegProductListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([])],
      declarations: [RegProductListComponent],
      providers: [
        { provide: RProductService, useValue: { getAll: () => of(products), remove: () => of({}) } },
        { provide: RProductPresentationService, useValue: { getAll: () => of([]), remove: () => of({}) } },
        { provide: VStoreProfileService, useValue: { getProfiles: () => of(profiles) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    build();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('store type chips', () => {
    it('builds one chip per profile that owns products', () => {
      expect(component.storeTypeChips.length).toBe(2);
      expect(component.storeTypeChips.map((c) => c.businessType)).toEqual([
        'chicken-store',
        'supermarket',
      ]);
    });

    it('counts products per business type', () => {
      build([product('a', 1), product('b', 1), product('c', 2)]);
      const chip = component.storeTypeChips.find((c) => c.businessType === 'supermarket');
      expect(chip?.count).toBe(2);
    });

    it('humanizes the chip label', () => {
      const chip = component.storeTypeChips.find((c) => c.businessType === 'chicken-store');
      expect(chip?.label).toBe('Chicken Store');
    });

    it('shows no chips when every product has no known profile', () => {
      build([product('a', 999)]);
      expect(component.storeTypeChips).toEqual([]);
    });

    it('starts unfiltered', () => {
      expect(component.selectedStoreProfileId).toBeNull();
      expect(component.filteredProducts.length).toBe(2);
    });
  });

  describe('filtering', () => {
    it('selectStoreType narrows the table to that profile', () => {
      const chip = component.storeTypeChips.find((c) => c.businessType === 'chicken-store')!;
      component.selectStoreType(chip);
      expect(component.filteredProducts.length).toBe(1);
      expect(component.filteredProducts[0].id).toBe('b');
    });

    it('isStoreTypeActive reflects the selection', () => {
      const chip = component.storeTypeChips.find((c) => c.businessType === 'chicken-store')!;
      expect(component.isStoreTypeActive(chip)).toBe(false);
      component.selectStoreType(chip);
      expect(component.isStoreTypeActive(chip)).toBe(true);
    });

    it('clicking the active chip clears the filter', () => {
      const chip = component.storeTypeChips[0];
      component.selectStoreType(chip);
      component.selectStoreType(chip);
      expect(component.selectedStoreProfileId).toBeNull();
      expect(component.filteredProducts.length).toBe(2);
    });

    it('clearStoreTypeFilter resets to all products', () => {
      component.selectStoreType(component.storeTypeChips[0]);
      component.clearStoreTypeFilter();
      expect(component.selectedStoreProfileId).toBeNull();
      expect(component.filteredProducts.length).toBe(2);
    });

    it('switching chips replaces rather than narrows', () => {
      component.selectStoreType(component.storeTypeChips[0]);
      component.selectStoreType(component.storeTypeChips[1]);
      expect(component.filteredProducts.length).toBe(1);
    });
  });

  describe('reloading', () => {
    it('rebuilds chips when products reload', () => {
      products = [product('a', 3)];
      component.loadProducts();
      expect(component.storeTypeChips.map((c) => c.businessType)).toEqual(['bakery']);
    });

    it('drops a selection whose chip no longer exists', () => {
      component.selectStoreType(component.storeTypeChips[0]);
      products = [product('a', 1)];
      component.loadProducts();
      expect(component.selectedStoreProfileId).toBeNull();
    });

    it('keeps a selection that still has products', () => {
      component.selectStoreType(
        component.storeTypeChips.find((c) => c.businessType === 'supermarket')!
      );
      products = [product('a', 1), product('z', 2)];
      component.loadProducts();
      expect(component.selectedStoreProfileId).toBe(1);
    });
  });

  describe('template rendering', () => {
    const chips = () => fixture.nativeElement.querySelectorAll('.store-type-chips .chip');
    const rows = () => fixture.nativeElement.querySelectorAll('tbody tr');

    it('renders a chip per store type plus All', () => {
      expect(chips().length).toBe(3);
      expect(chips()[0].textContent.trim()).toBe('All');
    });

    it('shows each chip with its product count', () => {
      const text = Array.from(chips()).map((c: any) => c.textContent.trim());
      expect(text.join(' ')).toContain('Chicken Store 1');
    });

    it('renders one table row per unfiltered product', () => {
      expect(rows().length).toBe(2);
    });

    it('drops rows when a chip is clicked', () => {
      // Click the rendered button rather than calling the handler directly:
      // mat-tab-group renders its body in a lazily attached view, and driving
      // it through the DOM event is what exercises the real path.
      (chips()[1] as HTMLElement).click();
      fixture.detectChanges();
      expect(rows().length).toBe(1);
    });

    it('marks only the clicked chip active', () => {
      (chips()[1] as HTMLElement).click();
      fixture.detectChanges();
      const active = Array.from(chips())
        .map((c: any) => c.classList.contains('chip-active'));
      expect(active).toEqual([false, true, false]);
    });

    it('clicking All restores every row', () => {
      (chips()[1] as HTMLElement).click();
      fixture.detectChanges();
      (chips()[0] as HTMLElement).click();
      fixture.detectChanges();
      expect(rows().length).toBe(2);
      expect(chips()[0].classList.contains('chip-active')).toBe(true);
    });
  });

  describe('missing profiles', () => {
    beforeEach(() => {
      build(undefined, []);
    });

    it('hides the chip row', () => {
      expect(component.storeTypeChips).toEqual([]);
      expect(fixture.nativeElement.querySelector('.store-type-filter')).toBeNull();
    });

    it('still lists every product', () => {
      expect(component.filteredProducts.length).toBe(2);
    });
  });
});
