import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PosPaymentPanelComponent } from './pos-payment-panel.component';
import { CustomersDialogComponent } from '../customers-dialog/customers-dialog.component';
import { PaymentType } from '../payment-types';

describe('PosPaymentPanelComponent', () => {
  let component: PosPaymentPanelComponent;
  let fixture: ComponentFixture<PosPaymentPanelComponent>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let payItSpy: jasmine.Spy;
  let removeItemSpy: jasmine.Spy;
  let calTotalsSpy: jasmine.Spy;
  let finalizeOrderSpy: jasmine.Spy;
  let selectCustomerSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as any);

    TestBed.configureTestingModule({
      declarations: [PosPaymentPanelComponent],
      imports: [
        MatIconModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        BrowserAnimationsModule,
      ],
      providers: [
        { provide: MatDialog, useValue: dialogSpy },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    payItSpy = jasmine.createSpy('payIt');
    removeItemSpy = jasmine.createSpy('removeItem');
    calTotalsSpy = jasmine.createSpy('calTotals');
    finalizeOrderSpy = jasmine.createSpy('finalizeOrder');
    selectCustomerSpy = jasmine.createSpy('selectCustomer');

    fixture = TestBed.createComponent(PosPaymentPanelComponent);
    component = fixture.componentInstance;
    component.orderTotal = 100;
    component.totalPayed = 0;
    component.totalDiscount = 0;
    component.totalReturn = 0;
    component.printOrderCount = 0;
    component.payedItems = [];
    component.discountItems = [];
    component.returnItems = [];
    component.selectCustomer = selectCustomerSpy;
    component.finalizeOrder = finalizeOrderSpy;
    component.calTotals = calTotalsSpy;
    component.payIt = payItSpy;
    component.removeItem = removeItemSpy;
    component.selectedCustomer = { id: 1, name: 'Anonymous', ci: null, code: null };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('default incoming method is cash', () => {
      expect(component.incomingMethod).toBe('cash');
    });

    it('has pre-defined quick amounts', () => {
      expect(component.quickAmounts).toEqual([5, 10, 20, 50, 100, 200]);
    });

    it('starts with empty payment lines', () => {
      expect(component.customAmountStr).toBe('');
      expect(component.discountAmountStr).toBe('');
      expect(component.changeAmountStr).toBe('');
    });
  });

  describe('isPrintLocked', () => {
    it('returns false when printOrderCount is 0', () => {
      component.printOrderCount = 0;
      expect(component.isPrintLocked).toBe(false);
    });

    it('returns true when printOrderCount > 0', () => {
      component.printOrderCount = 1;
      expect(component.isPrintLocked).toBe(true);
    });

    it('returns false when printOrderCount is undefined', () => {
      component.printOrderCount = undefined as any;
      expect(component.isPrintLocked).toBe(false);
    });
  });

  describe('readyToSubmit', () => {
    it('returns true when order is fully paid and not locked', () => {
      component.orderTotal = 100;
      component.totalPayed = 100;
      component.totalReturn = 0;
      component.totalDiscount = 0;
      component.printOrderCount = 0;
      expect(component.readyToSubmit).toBe(true);
    });

    it('returns false when amount is still due', () => {
      component.orderTotal = 100;
      component.totalPayed = 50;
      expect(component.readyToSubmit).toBe(false);
    });

    it('returns false when order total is 0', () => {
      component.orderTotal = 0;
      expect(component.readyToSubmit).toBe(false);
    });

    it('returns false when print is locked', () => {
      component.orderTotal = 100;
      component.totalPayed = 100;
      component.printOrderCount = 1;
      expect(component.readyToSubmit).toBe(false);
    });
  });

  describe('amountDue', () => {
    it('calculates remaining balance', () => {
      component.orderTotal = 100;
      component.totalPayed = 70;
      component.totalReturn = 5;
      component.totalDiscount = 10;
      expect(component.amountDue).toBe(25);
    });

    it('returns 0 when fully covered', () => {
      component.orderTotal = 50;
      component.totalPayed = 50;
      expect(component.amountDue).toBe(0);
    });
  });

  describe('customerIdDisplay', () => {
    it('returns "—" when no customer', () => {
      component.selectedCustomer = null;
      expect(component.customerIdDisplay()).toBe('—');
    });

    it('returns ci when present', () => {
      component.selectedCustomer = { ci: '12345', code: '67890' };
      expect(component.customerIdDisplay()).toBe('12345');
    });

    it('falls back to code when ci is null', () => {
      component.selectedCustomer = { ci: null, code: 'ABC' };
      expect(component.customerIdDisplay()).toBe('ABC');
    });

    it('returns "—" when both ci and code are null/empty', () => {
      component.selectedCustomer = { ci: null, code: null };
      expect(component.customerIdDisplay()).toBe('—');
    });
  });

  describe('setIncomingMethod', () => {
    it('switches to cash', () => {
      component.setIncomingMethod('cash');
      expect(component.incomingMethod).toBe('cash');
    });

    it('switches to qr', () => {
      component.setIncomingMethod('qr');
      expect(component.incomingMethod).toBe('qr');
    });

    it('does nothing when print is locked', () => {
      component.printOrderCount = 1;
      component.setIncomingMethod('qr');
      expect(component.incomingMethod).toBe('cash');
    });
  });

  describe('isQrPayment', () => {
    it('returns true for QR payment type', () => {
      expect(component.isQrPayment({ payType: PaymentType.PAYQR })).toBe(true);
    });

    it('returns false for cash payment type', () => {
      expect(component.isQrPayment({ payType: PaymentType.PAYMONEY })).toBe(false);
    });
  });

  describe('addQuickAmount', () => {
    it('calls payIt with correct amount and cash type', () => {
      component.addQuickAmount(50);
      expect(payItSpy).toHaveBeenCalledWith(
        { name: '50.00', value: 50 },
        PaymentType.PAYMONEY
      );
    });

    it('calls payIt with QR type when incoming is qr', () => {
      component.setIncomingMethod('qr');
      component.addQuickAmount(100);
      expect(payItSpy).toHaveBeenCalledWith(
        { name: '100.00', value: 100 },
        PaymentType.PAYQR
      );
    });

    it('does nothing when print is locked', () => {
      component.printOrderCount = 1;
      component.addQuickAmount(50);
      expect(payItSpy).not.toHaveBeenCalled();
    });
  });

  describe('registerIncomingAmount', () => {
    it('calls payIt with parsed custom amount', () => {
      component.customAmountStr = '25.50';
      component.registerIncomingAmount();
      expect(payItSpy).toHaveBeenCalledWith(
        { name: '25.50', value: 25.50 },
        PaymentType.PAYMONEY
      );
      expect(component.customAmountStr).toBe('');
    });

    it('does nothing for invalid amount', () => {
      component.customAmountStr = 'abc';
      component.registerIncomingAmount();
      expect(payItSpy).not.toHaveBeenCalled();
      expect(component.customAmountStr).toBe('abc');
    });

    it('does nothing for zero amount', () => {
      component.customAmountStr = '0';
      component.registerIncomingAmount();
      expect(payItSpy).not.toHaveBeenCalled();
    });

    it('uses QR type when incoming is qr', () => {
      component.setIncomingMethod('qr');
      component.customAmountStr = '30';
      component.registerIncomingAmount();
      expect(payItSpy).toHaveBeenCalledWith(
        { name: '30.00', value: 30 },
        PaymentType.PAYQR
      );
    });

    it('handles comma as decimal separator', () => {
      component.customAmountStr = '12,75';
      component.registerIncomingAmount();
      expect(payItSpy).toHaveBeenCalledWith(
        jasmine.objectContaining({ value: 12.75 }),
        PaymentType.PAYMONEY
      );
    });

    it('does nothing when print is locked', () => {
      component.printOrderCount = 1;
      component.customAmountStr = '20';
      component.registerIncomingAmount();
      expect(payItSpy).not.toHaveBeenCalled();
    });
  });

  describe('registerPendingDue', () => {
    it('pays the exact amount due', () => {
      component.orderTotal = 100;
      component.totalPayed = 70;
      component.totalReturn = 0;
      component.totalDiscount = 10;
      // amountDue = 100 - 10 - 70 = 20
      component.registerPendingDue();
      expect(payItSpy).toHaveBeenCalledWith(
        { name: '20.00', value: 20 },
        PaymentType.PAYMONEY
      );
    });

    it('does nothing when amount due is 0', () => {
      component.orderTotal = 100;
      component.totalPayed = 100;
      component.registerPendingDue();
      expect(payItSpy).not.toHaveBeenCalled();
    });

    it('does nothing when print is locked', () => {
      component.printOrderCount = 1;
      component.registerPendingDue();
      expect(payItSpy).not.toHaveBeenCalled();
    });
  });

  describe('registerDiscountAmount', () => {
    it('registers a discount line', () => {
      component.discountAmountStr = '15';
      component.registerDiscountAmount();
      expect(payItSpy).toHaveBeenCalledWith(
        { name: '15.00', value: 15 },
        PaymentType.DISCOUNT
      );
      expect(component.discountAmountStr).toBe('');
    });

    it('does nothing for invalid amount', () => {
      component.discountAmountStr = '';
      component.registerDiscountAmount();
      expect(payItSpy).not.toHaveBeenCalled();
    });

    it('does nothing when print is locked', () => {
      component.printOrderCount = 1;
      component.discountAmountStr = '10';
      component.registerDiscountAmount();
      expect(payItSpy).not.toHaveBeenCalled();
    });
  });

  describe('registerChangeAmount', () => {
    it('registers a change / return line', () => {
      component.changeAmountStr = '5';
      component.registerChangeAmount();
      expect(payItSpy).toHaveBeenCalledWith(
        { name: '5.00', value: 5 },
        PaymentType.PAYRETURN
      );
      expect(component.changeAmountStr).toBe('');
    });

    it('does nothing for invalid amount', () => {
      component.changeAmountStr = '-1';
      component.registerChangeAmount();
      expect(payItSpy).not.toHaveBeenCalled();
    });

    it('does nothing when print is locked', () => {
      component.printOrderCount = 1;
      component.changeAmountStr = '5';
      component.registerChangeAmount();
      expect(payItSpy).not.toHaveBeenCalled();
    });
  });

  describe('submitOrderClick', () => {
    it('calls finalizeOrder when ready', () => {
      component.orderTotal = 100;
      component.totalPayed = 100;
      component.printOrderCount = 0;
      component.submitOrderClick();
      expect(finalizeOrderSpy).toHaveBeenCalled();
    });

    it('does nothing when not ready', () => {
      component.orderTotal = 0;
      component.submitOrderClick();
      expect(finalizeOrderSpy).not.toHaveBeenCalled();
    });
  });

  describe('openDialog', () => {
    it('opens customer dialog', () => {
      component.openDialog();
      expect(dialogSpy.open).toHaveBeenCalledWith(
        CustomersDialogComponent,
        jasmine.objectContaining({
          width: 'min(92vw, 480px)',
        })
      );
    });

    it('does not open when print is locked', () => {
      component.printOrderCount = 1;
      component.openDialog();
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });
  });

  describe('parsePositiveAmount (private via register methods)', () => {
    it('parses valid positive numbers', () => {
      component.customAmountStr = '42';
      component.registerIncomingAmount();
      expect(payItSpy).toHaveBeenCalledWith(
        jasmine.objectContaining({ value: 42 }),
        jasmine.any(Number)
      );
    });

    it('rejects zero', () => {
      component.customAmountStr = '0';
      component.registerIncomingAmount();
      expect(payItSpy).not.toHaveBeenCalled();
    });

    it('rejects negative', () => {
      component.customAmountStr = '-10';
      component.registerIncomingAmount();
      expect(payItSpy).not.toHaveBeenCalled();
    });
  });
});
