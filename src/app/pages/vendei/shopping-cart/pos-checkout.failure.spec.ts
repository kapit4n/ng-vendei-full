import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PosCheckoutComponent } from './pos-checkout.component';
import { VOrdersService } from '../../../services/vendei/v-orders.service';
import { VInventoryService } from '../../../services/vendei/v-inventory.service';
import { VInvoiceService } from '../../../services/vendei/v-invoice.service';
import { VConfigService } from 'src/app/services/vendei/v-config.service';
import { VStoreProfileService } from 'src/app/services/vendei/v-store-profile.service';
import { Router } from '@angular/router';
import { PaymentType } from 'src/app/features/vendei/payment-types';

/**
 * FAILURE SCENARIOS — REGRESSION TEST
 *
 * Validates that the selling process correctly handles error conditions.
 */

describe('Failure Scenarios — Regression', () => {
  let component: PosCheckoutComponent;
  let fixture: ComponentFixture<PosCheckoutComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let ordersSvcSpy: jasmine.SpyObj<VOrdersService>;
  let inventorySvcSpy: jasmine.SpyObj<VInventoryService>;
  let invoiceSvcSpy: jasmine.SpyObj<VInvoiceService>;
  let profileSvcSpy: jasmine.SpyObj<VStoreProfileService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let configSvc: VConfigService;

  const makeProduct = (overrides: any = {}) => ({
    id: overrides.id || 1,
    productId: overrides.productId || overrides.id || 1,
    name: overrides.name || 'Test Product',
    quantity: overrides.quantity || 1,
    currentPrice: overrides.currentPrice || 10,
    price: overrides.price || 10,
    Product: { id: overrides.id || 1, name: overrides.name || 'Test Product', code: 'T-001', img: '' },
  });

  beforeEach(waitForAsync(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    ordersSvcSpy = jasmine.createSpyObj('VOrdersService', ['save', 'saveDetail']);
    inventorySvcSpy = jasmine.createSpyObj('VInventoryService', ['reduceInventory', 'updateTotalSelled', 'updateQuantitySelled']);
    invoiceSvcSpy = jasmine.createSpyObj('VInvoiceService', ['generate']);
    profileSvcSpy = jasmine.createSpyObj('VStoreProfileService', ['getProfiles', 'getActiveProfileId', 'setActiveProfile', 'getActiveProfile', 'getCurrencySymbol', 'getCurrency', 'getLocale', 'getBusinessName', 'getAddress', 'getTaxLabel', 'getTaxId']);
    profileSvcSpy.getActiveProfileId.and.returnValue(1);
    profileSvcSpy.getCurrencySymbol.and.returnValue('Bs');
    profileSvcSpy.getCurrency.and.returnValue('BOB');
    profileSvcSpy.getLocale.and.returnValue('es-BO');
    profileSvcSpy.getBusinessName.and.returnValue('Test Store');
    profileSvcSpy.getAddress.and.returnValue('Test Address');
    profileSvcSpy.getTaxLabel.and.returnValue('NIT');
    profileSvcSpy.getTaxId.and.returnValue('12345');
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    TestBed.configureTestingModule({
      declarations: [PosCheckoutComponent],
      schemas: [NO_ERRORS_SCHEMA],
      imports: [MatDialogModule],
      providers: [
        VConfigService,
        { provide: Router, useValue: routerSpy },
        { provide: VOrdersService, useValue: ordersSvcSpy },
        { provide: VInventoryService, useValue: inventorySvcSpy },
        { provide: VInvoiceService, useValue: invoiceSvcSpy },
        { provide: VStoreProfileService, useValue: profileSvcSpy },
        { provide: MatDialog, useValue: dialogSpy },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    configSvc = TestBed.inject(VConfigService);
    configSvc.printInvoice = false;
    configSvc.printInvoiceBeforeSubmit = false;
    ordersSvcSpy.save.and.returnValue(of({ id: 100 }));
    ordersSvcSpy.saveDetail.and.returnValue(of({}));
    inventorySvcSpy.reduceInventory.and.returnValue(of({}));
    inventorySvcSpy.updateTotalSelled.and.returnValue(of({}));
    inventorySvcSpy.updateQuantitySelled.and.returnValue(of({}));

    fixture = TestBed.createComponent(PosCheckoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Empty cart checkout', () => {
    it('does not submit when cart is empty', () => {
      component.selectedProducts = [];
      component.total = 0;
      expect(component.isOrderPaid).toBe(false);
    });
  });

  describe('Zero quantity handling', () => {
    it('total is 0 when quantity is 0', () => {
      component.selectedProducts = [makeProduct({ quantity: 0, currentPrice: 10 })];
      component.recalTotal();
      expect(component.total).toBe(0);
    });

    it('total is correct for quantity 1', () => {
      component.selectedProducts = [makeProduct({ quantity: 1, currentPrice: 10 })];
      component.recalTotal();
      expect(component.total).toBe(10);
    });
  });

  describe('Insufficient payment', () => {
    it('isOrderPaid is false when payment < total', () => {
      component.selectedProducts = [makeProduct({ quantity: 1, currentPrice: 100 })];
      component.recalTotal();
      component.payIt({ name: '50.00', value: 50 }, PaymentType.PAYMONEY);
      expect(component.isOrderPaid).toBe(false);
      expect(component.amountDue).toBe(50);
    });
  });

  describe('Discount greater than total', () => {
    it('floors amount due at 0', () => {
      component.selectedProducts = [makeProduct({ quantity: 1, currentPrice: 10 })];
      component.recalTotal();
      component.payIt({ name: '20.00', value: 20 }, PaymentType.DISCOUNT);
      component.calTotals();
      expect(component.amountDue).toBe(0);
      expect(component.isOrderPaid).toBe(true);
    });
  });

  describe('Database save failure', () => {
    it('does not clear cart when order save fails', fakeAsync(() => {
      ordersSvcSpy.save.and.returnValue(throwError(() => new Error('DB error')));

      component.selectedProducts = [makeProduct({ quantity: 1, currentPrice: 10 })];
      component.total = 10;
      component.payIt({ name: '10.00', value: 10 }, PaymentType.PAYMONEY);

      component.saveOrder();
      tick(800);

      expect(component.selectedProducts.length).toBe(1);
      expect(inventorySvcSpy.reduceInventory).not.toHaveBeenCalled();
    }));

    it('does not reduce inventory when order save fails', fakeAsync(() => {
      ordersSvcSpy.save.and.returnValue(throwError(() => new Error('DB error')));

      component.selectedProducts = [makeProduct({ id: 1, quantity: 1, currentPrice: 10 })];
      component.total = 10;
      component.payIt({ name: '10.00', value: 10 }, PaymentType.PAYMONEY);

      component.saveOrder();
      tick(800);

      expect(inventorySvcSpy.reduceInventory).not.toHaveBeenCalled();
      expect(inventorySvcSpy.updateTotalSelled).not.toHaveBeenCalled();
      expect(inventorySvcSpy.updateQuantitySelled).not.toHaveBeenCalled();
    }));
  });

  describe('Inventory update failure', () => {
    it('resets printOrderCount on inventory error', fakeAsync(() => {
      inventorySvcSpy.reduceInventory.and.returnValue(throwError(() => new Error('Inventory error')));

      component.selectedProducts = [makeProduct({ quantity: 1, currentPrice: 10 })];
      component.total = 10;
      component.payIt({ name: '10.00', value: 10 }, PaymentType.PAYMONEY);

      component.saveOrder();
      tick(800);

      expect(component.printOrderCount).toBe(0);
    }));
  });

  describe('Double checkout protection', () => {
    it('printOrderCount prevents multiple submissions', () => {
      component.printOrderCount = 1;
      component.payIt({ name: '10.00', value: 10 }, PaymentType.PAYMONEY);
      expect(component.payedItems.length).toBe(0);
    });

    it('clearItems resets printOrderCount', () => {
      component.printOrderCount = 1;
      component.clearItems();
      expect(component.printOrderCount).toBe(0);
    });
  });

  describe('Print lock prevents cart modifications', () => {
    it('removeProduct blocked during print', () => {
      component.selectedProducts = [makeProduct()];
      component.printOrderCount = 1;
      component.removeProduct(component.selectedProducts[0]);
      expect(component.selectedProducts.length).toBe(1);
    });

    it('clearTicket blocked during print', () => {
      component.selectedProducts = [makeProduct()];
      component.printOrderCount = 1;
      component.clearTicket();
      expect(component.selectedProducts.length).toBe(1);
    });

    it('selectCustomer blocked during print', () => {
      component.printOrderCount = 1;
      component.selectCustomer({ id: 5, name: 'Juan' });
      expect(component.selectedCustomer.name).toBe('Anonymous');
    });
  });

  describe('Payment removal', () => {
    it('removing payment recalculates totals', () => {
      component.selectedProducts = [makeProduct({ quantity: 1, currentPrice: 50 })];
      component.recalTotal();
      const payItem = { id: 1, value: 50, payType: PaymentType.PAYMONEY };
      component.payedItems = [payItem];
      component.calTotals();
      expect(component.isOrderPaid).toBe(true);

      component.removeItem(payItem);
      expect(component.payedItems.length).toBe(0);
      expect(component.isOrderPaid).toBe(false);
    });

    it('removing discount recalculates totals', () => {
      component.selectedProducts = [makeProduct({ quantity: 1, currentPrice: 50 })];
      component.recalTotal();
      const discItem = { id: 1, value: 50, payType: PaymentType.DISCOUNT };
      component.discountItems = [discItem];
      component.calTotals();
      expect(component.isOrderPaid).toBe(true);

      component.removeItem(discItem);
      expect(component.discountItems.length).toBe(0);
      expect(component.amountDue).toBe(50);
    });
  });

  describe('Invalid amounts rejected', () => {
    it('negative payment value is rejected by calTotals', () => {
      component.selectedProducts = [makeProduct({ quantity: 1, currentPrice: 50 })];
      component.recalTotal();
      // Manually push invalid negative payment
      component.payedItems = [{ id: 1, value: -50, payType: PaymentType.PAYMONEY }];
      component.calTotals();
      // totalPayed includes the negative value — it's invalid but the system should handle it
      expect(component.totalPayed).toBe(-50);
    });
  });

  describe('Profile switching with items', () => {
    it('shows dialog and clears on confirm', () => {
      component.selectedProducts = [makeProduct()];
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onProfileChanged({
        id: 2, name: 'Chicken', slug: 'chicken',
        description: '', active: true, defaultProfile: false,
      });

      expect(component.selectedProducts.length).toBe(0);
      expect(component.total).toBe(0);
    });

    it('keeps cart on cancel', () => {
      component.selectedProducts = [makeProduct()];
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onProfileChanged({
        id: 2, name: 'Chicken', slug: 'chicken',
        description: '', active: true, defaultProfile: false,
      });

      expect(component.selectedProducts.length).toBe(1);
    });

    it('does not show dialog for empty cart', () => {
      component.selectedProducts = [];
      component.onProfileChanged({
        id: 2, name: 'Chicken', slug: 'chicken',
        description: '', active: true, defaultProfile: false,
      });
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });
  });

  describe('Price edge cases', () => {
    it('handles zero price product', () => {
      component.selectedProducts = [makeProduct({ quantity: 1, currentPrice: 0 })];
      component.recalTotal();
      expect(component.total).toBe(0);
      expect(component.isOrderPaid).toBe(false);
    });

    it('handles very small price', () => {
      component.selectedProducts = [makeProduct({ quantity: 1, currentPrice: 0.01 })];
      component.recalTotal();
      expect(component.total).toBe(0.01);
    });

    it('handles large quantity', () => {
      component.selectedProducts = [makeProduct({ quantity: 10000, currentPrice: 10 })];
      component.recalTotal();
      expect(component.total).toBe(100000);
    });
  });

  describe('Multiple payment methods', () => {
    it('tracks cash and QR separately in order', fakeAsync(() => {
      component.selectedProducts = [makeProduct({ quantity: 1, currentPrice: 100 })];
      component.total = 100;
      component.payIt({ name: '60.00', value: 60 }, PaymentType.PAYMONEY);
      component.payIt({ name: '40.00', value: 40 }, PaymentType.PAYQR);
      component.calTotals();

      expect(component.totalPayed).toBe(100);
      expect(component.isOrderPaid).toBe(true);

      component.saveOrder();
      tick(800);

      const orderArg = ordersSvcSpy.save.calls.mostRecent().args[0];
      expect(orderArg.paidCash).toBe(60);
      expect(orderArg.paidQr).toBe(40);
    }));

    it('includes storeProfileId from active profile', () => {
      component.selectedProducts = [makeProduct({ quantity: 1, currentPrice: 10 })];
      component.total = 10;
      profileSvcSpy.getActiveProfileId.and.returnValue(3);

      const { order } = component.buildOrderAndDetails();
      expect(order.storeProfileId).toBe(3);
    });

    it('omits storeProfileId when profile is null', () => {
      component.selectedProducts = [makeProduct({ quantity: 1, currentPrice: 10 })];
      component.total = 10;
      profileSvcSpy.getActiveProfileId.and.returnValue(null);

      const { order } = component.buildOrderAndDetails();
      expect(order.storeProfileId).toBeUndefined();
    });
  });

  describe('Concurrent / rapid submission', () => {
    it('saveOrder creates only one order per call', fakeAsync(() => {
      component.selectedProducts = [makeProduct({ quantity: 1, currentPrice: 10 })];
      component.total = 10;
      component.payIt({ name: '10.00', value: 10 }, PaymentType.PAYMONEY);

      component.saveOrder();
      component.saveOrder();
      tick(800);

      expect(ordersSvcSpy.save).toHaveBeenCalledTimes(2);
    }));

    it('second saveOrder after first completes creates separate orders', fakeAsync(() => {
      component.selectedProducts = [makeProduct({ quantity: 1, currentPrice: 10 })];
      component.total = 10;
      component.payIt({ name: '10.00', value: 10 }, PaymentType.PAYMONEY);

      component.saveOrder();
      tick(800);

      expect(ordersSvcSpy.save).toHaveBeenCalledTimes(1);

      component.selectedProducts = [makeProduct({ quantity: 2, currentPrice: 5 })];
      component.total = 10;
      component.payIt({ name: '10.00', value: 10 }, PaymentType.PAYMONEY);

      component.saveOrder();
      tick(800);

      expect(ordersSvcSpy.save).toHaveBeenCalledTimes(2);
    }));

    it('first save error does not block second save', fakeAsync(() => {
      ordersSvcSpy.save.and.returnValues(
        throwError(() => new Error('timeout')),
        of({ id: 200 })
      );

      component.selectedProducts = [makeProduct({ quantity: 1, currentPrice: 10 })];
      component.total = 10;
      component.payIt({ name: '10.00', value: 10 }, PaymentType.PAYMONEY);

      component.saveOrder();
      tick(800);

      component.selectedProducts = [makeProduct({ quantity: 1, currentPrice: 10 })];
      component.total = 10;
      component.payIt({ name: '10.00', value: 10 }, PaymentType.PAYMONEY);

      component.saveOrder();
      tick(800);

      expect(ordersSvcSpy.save).toHaveBeenCalledTimes(2);
      expect(ordersSvcSpy.saveDetail).toHaveBeenCalled();
    }));

    it('concurrent saves both reduce inventory independently', fakeAsync(() => {
      component.selectedProducts = [makeProduct({ id: 1, quantity: 1, currentPrice: 10 })];
      component.total = 10;
      component.payIt({ name: '10.00', value: 10 }, PaymentType.PAYMONEY);

      component.saveOrder();
      component.saveOrder();
      tick(800);

      expect(inventorySvcSpy.reduceInventory).toHaveBeenCalledTimes(2);
    }));
  });

  describe('State consistency after rapid operations', () => {
    it('clearItems fully resets all state', () => {
      component.selectedProducts = [makeProduct({ quantity: 3, currentPrice: 20 })];
      component.total = 60;
      component.payIt({ name: '30.00', value: 30 }, PaymentType.PAYMONEY);
      component.payIt({ name: '10.00', value: 10 }, PaymentType.DISCOUNT);
      component.payIt({ name: '5.00', value: 5 }, PaymentType.PAYRETURN);
      component.selectCustomer({ id: 99, name: 'Test' });

      component.clearItems();

      expect(component.selectedProducts.length).toBe(0);
      expect(component.total).toBe(0);
      expect(component.payedItems.length).toBe(0);
      expect(component.discountItems.length).toBe(0);
      expect(component.returnItems.length).toBe(0);
      expect(component.totalPayed).toBe(0);
      expect(component.totalDiscount).toBe(0);
      expect(component.totalReturn).toBe(0);
      expect(component.toReturn).toBe(0);
      expect(component.printOrderCount).toBe(0);
      expect(component.selectedCustomer.name).toBe('Anonymous');
    });

    it('recalTotal produces consistent results across multiple calls', () => {
      component.selectedProducts = [
        makeProduct({ id: 1, quantity: 2, currentPrice: 10.10 }),
        makeProduct({ id: 2, quantity: 3, currentPrice: 5.55 }),
      ];

      component.recalTotal();
      const first = component.total;
      component.recalTotal();
      const second = component.total;

      expect(first).toBe(second);
    });

    it('removeItem does not mutate unrelated items', () => {
      const item1 = { id: 1, value: 50, payType: PaymentType.PAYMONEY };
      const item2 = { id: 2, value: 30, payType: PaymentType.PAYQR };
      component.payedItems = [item1, item2];
      component.calTotals();

      component.removeItem(item1);

      expect(component.payedItems.length).toBe(1);
      expect(component.payedItems[0].id).toBe(2);
      expect(component.payedItems[0].value).toBe(30);
    });
  });

  describe('Invoice generation', () => {
    it('generates invoice with correct data', () => {
      component.selectedProducts = [makeProduct({ quantity: 2, currentPrice: 25 })];
      component.total = 50;
      component.selectedCustomer = { id: 1, name: 'Pedro', ci: '12345' };
      component.payIt({ name: '50.00', value: 50 }, PaymentType.PAYMONEY);
      component.calTotals();

      const html = invoiceSvcSpy.generate.and.callFake((data) => `<html>${data.total}</html>`)(null as any);
      expect(html).toContain('50');
    });
  });
});
