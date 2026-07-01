import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { PosTicketLinesComponent, PosTicketLineEditDialog, DialogData } from './pos-ticket-lines.component';

describe('PosTicketLinesComponent', () => {
  let component: PosTicketLinesComponent;
  let fixture: ComponentFixture<PosTicketLinesComponent>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockProduct = (overrides?: any) => ({
    id: 1,
    quantity: 2,
    currentPrice: 10.00,
    price: 10.00,
    img: '',
    Product: {
      name: 'Red Apple',
      code: 'A-001',
      img: '/uploads/product.jpg',
      unitLabel: null,
      packLabel: null,
      subtitle: null,
    },
    ...overrides,
  });

  const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);

  beforeEach(waitForAsync(() => {
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    dialogSpy.open.and.returnValue(mockDialogRef);
    mockDialogRef.afterClosed.and.returnValue(of(null));

    TestBed.configureTestingModule({
      declarations: [PosTicketLinesComponent],
      imports: [MatIconModule, MatDialogModule],
      providers: [
        { provide: MatDialog, useValue: dialogSpy },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PosTicketLinesComponent);
    component = fixture.componentInstance;
    component.selectedProducts = [mockProduct()];
    component.removeProduct = () => {};
    component.recalTotal = () => {};
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('lineDisplayName', () => {
    it('returns Product.name when available', () => {
      expect(component.lineDisplayName(mockProduct())).toBe('Red Apple');
    });

    it('falls back to name', () => {
      expect(component.lineDisplayName({ name: 'Banana' })).toBe('Banana');
    });

    it('returns "Item" as last resort', () => {
      expect(component.lineDisplayName({})).toBe('Item');
    });
  });

  describe('lineTitle', () => {
    it('strips parenthetical suffix', () => {
      const p = mockProduct({ Product: { name: 'Banana (1 lb)' } });
      expect(component.lineTitle(p)).toBe('Banana');
    });

    it('returns full name if no parentheses', () => {
      expect(component.lineTitle(mockProduct())).toBe('Red Apple');
    });
  });

  describe('lineLabel', () => {
    it('returns parenthetical suffix from name', () => {
      const p = mockProduct({ Product: { name: 'Banana (1 lb)' } });
      expect(component.lineLabel(p)).toBe('(1 lb)');
    });

    it('returns null when no suffix', () => {
      expect(component.lineLabel(mockProduct())).toBeNull();
    });

    it('uses productLabelFromFields when no suffix in name', () => {
      const p = mockProduct({
        Product: { name: 'Orange Juice', unitLabel: '500 ml' },
      });
      expect(component.lineLabel(p)).toBe('(500 ml)');
    });
  });

  describe('lineImageUrl', () => {
    it('uses presentation image first', () => {
      const url = component.lineImageUrl({
        img: '/uploads/presentation.jpg',
        Product: { img: '/uploads/product.jpg' },
      });
      expect(url).toContain('presentation');
    });

    it('falls back to product image', () => {
      const url = component.lineImageUrl({ img: '', Product: { img: '/uploads/product.jpg' } });
      expect(url).toContain('product');
    });

    it('returns placeholder when no images', () => {
      const url = component.lineImageUrl({ img: '', Product: {} });
      expect(url).toContain('placeholders');
    });
  });

  describe('openDialog', () => {
    it('opens edit dialog with product data', () => {
      component.openDialog(mockProduct());
      expect(dialogSpy.open).toHaveBeenCalledWith(
        PosTicketLineEditDialog,
        jasmine.objectContaining({
          width: '250px',
          data: jasmine.objectContaining({
            id: 1,
            name: 'Red Apple',
            quantity: 2,
            price: 10.00,
          }),
        })
      );
    });

    it('updates product when dialog returns result', () => {
      mockDialogRef.afterClosed.and.returnValue(of({
        id: 1,
        quantity: 5,
        price: 8.50,
      }));

      component.openDialog(mockProduct());

      const updated = component.selectedProducts[0];
      expect(updated.quantity).toBe(5);
      expect(updated.currentPrice).toBe(8.50);
      expect((updated as any).price).toBe(8.50);
    });

    it('does nothing when dialog returns null', () => {
      component.openDialog(mockProduct());
      const updated = component.selectedProducts[0];
      expect(updated.quantity).toBe(2);
    });

    it('calls recalTotal after update', () => {
      const recalSpy = jasmine.createSpy('recalTotal');
      component.recalTotal = recalSpy;
      mockDialogRef.afterClosed.and.returnValue(of({
        id: 1,
        quantity: 3,
        price: 10.00,
      }));

      component.openDialog(mockProduct());
      expect(recalSpy).toHaveBeenCalled();
    });
  });
});

describe('PosTicketLineEditDialog', () => {
  let component: PosTicketLineEditDialog;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<PosTicketLineEditDialog>>;

  const testData: DialogData = {
    id: '1',
    name: 'Test Product',
    img: '/test.jpg',
    quantity: 2,
    price: 10.50,
  };

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    component = new PosTicketLineEditDialog(dialogRefSpy, testData);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exposes dialog data', () => {
    expect(component.data).toBe(testData);
  });

  it('onNoClick closes dialog', () => {
    component.onNoClick();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });
});
