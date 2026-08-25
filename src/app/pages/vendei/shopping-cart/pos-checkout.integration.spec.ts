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
 * SELLING PROCESS CONTRACT — INTEGRATION TEST
 *
 * This test suite validates the critical end-to-end selling flow:
 *
 *   Product → Cart → Quantity → Pricing → Payment → Sale → Inventory → History
 *
 * Any regression in this flow MUST be detected by these tests.
 */

describe('Selling Process Contract — Integration', () => {
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
    name: overrides.name || 'Chicken Breast',
    quantity: overrides.quantity || 1,
    currentPrice: overrides.currentPrice || 32.00,
    price: overrides.price || 32.00,
    Product: {
      id: overrides.id || 1,
      name: overrides.name || 'Chicken Breast',
      code: overrides.code || 'CH-001',
      img: '',
      categoryId: overrides.categoryId || 1,
    },
    ...overrides,
  });

  beforeEach(waitForAsync(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    ordersSvcSpy = jasmine.createSpyObj('VOrdersService', ['save', 'saveDetail', 'getAll']);
    inventorySvcSpy = jasmine.createSpyObj('VInventoryService', [
      'reduceInventory', 'updateTotalSelled', 'updateQuantitySelled',
    ]);
    invoiceSvcSpy = jasmine.createSpyObj('VInvoiceService', ['generate']);
    profileSvcSpy = jasmine.createSpyObj('VStoreProfileService', [
      'getProfiles', 'getActiveProfileId', 'setActiveProfile', 'getActiveProfile',
    ]);
    profileSvcSpy.getActiveProfileId.and.returnValue(1);
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
    ordersSvcSpy.saveDetail.and.returnValue(of({ id: 1 }));
    inventorySvcSpy.reduceInventory.and.returnValue(of({}));
    inventorySvcSpy.updateTotalSelled.and.returnValue(of({}));
    inventorySvcSpy.updateQuantitySelled.and.returnValue(of({}));
    invoiceSvcSpy.generate.and.returnValue('<html>invoice</html>');

    fixture = TestBed.createComponent(PosCheckoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ─── CONTRACT: Add product to cart ───
  describe('1. Add product to cart', () => {
    it('adds a product with quantity 1', () => {
      const product = makeProduct({ id: 1, currentPrice: 32 });
      component.selectedProducts.push({ ...product, quantity: 1 });
      component.recalTotal();

      expect(component.selectedProducts.length).toBe(1);
      expect(component.selectedProducts[0].quantity).toBe(1);
      expect(component.total).toBe(32);
    });

    it('increments quantity when same product added twice', () => {
      const product = makeProduct({ id: 1, currentPrice: 32 });
      component.selectedProducts.push({ ...product, quantity: 1 });
      component.recalTotal();

      const existing = component.selectedProducts.find(p => p.id === product.id);
      if (existing) {
        existing.quantity = Number(existing.quantity) + 1;
      }
      component.recalTotal();

      expect(component.selectedProducts.length).toBe(1);
      expect(component.selectedProducts[0].quantity).toBe(2);
      expect(component.total).toBe(64);
    });
  });

  // ─── CONTRACT: Quantity changes recalculate subtotal ───
  describe('2. Quantity changes recalculate subtotal', () => {
    it('subtotals are correct for various quantities', () => {
      const product = makeProduct({ id: 1, currentPrice: 10 });

      // Quantity = 1
      component.selectedProducts = [{ ...product, quantity: 1 }];
      component.recalTotal();
      expect(component.total).toBe(10);

      // Quantity = 3
      component.selectedProducts = [{ ...product, quantity: 3 }];
      component.recalTotal();
      expect(component.total).toBe(30);

      // Quantity = 5
      component.selectedProducts = [{ ...product, quantity: 5 }];
      component.recalTotal();
      expect(component.total).toBe(50);
    });
  });

  // ─── CONTRACT: Multiple products total ───
  describe('3. Multiple products cart total', () => {
    it('calculates correct total for mixed cart', () => {
      component.selectedProducts = [
        makeProduct({ id: 1, name: 'Chicken Breast', currentPrice: 32, quantity: 2 }),
        makeProduct({ id: 2, name: 'French Fries', currentPrice: 15, quantity: 1, productId: 2 }),
        makeProduct({ id: 3, name: 'Drink', currentPrice: 8, quantity: 2, productId: 3 }),
      ];
      component.recalTotal();

      // 2*32 + 1*15 + 2*8 = 64 + 15 + 16 = 95
      expect(component.total).toBe(95);
    });
  });

  // ─── CONTRACT: Payment validation ───
  describe('4. Payment validation', () => {
    it('isOrderPaid is false when no payment', () => {
      component.selectedProducts = [makeProduct({ quantity: 1, currentPrice: 50 })];
      component.recalTotal();
      expect(component.isOrderPaid).toBe(false);
    });

    it('isOrderPaid is true when exact cash payment', () => {
      component.selectedProducts = [makeProduct({ quantity: 1, currentPrice: 50 })];
      component.recalTotal();
      component.payIt({ name: '50.00', value: 50 }, PaymentType.PAYMONEY);
      expect(component.isOrderPaid).toBe(true);
    });

    it('isOrderPaid is true when overpaid', () => {
      component.selectedProducts = [makeProduct({ quantity: 1, currentPrice: 50 })];
      component.recalTotal();
      component.payIt({ name: '100.00', value: 100 }, PaymentType.PAYMONEY);
      expect(component.isOrderPaid).toBe(true);
    });

    it('isOrderPaid is false when underpaid', () => {
      component.selectedProducts = [makeProduct({ quantity: 1, currentPrice: 50 })];
      component.recalTotal();
      component.payIt({ name: '30.00', value: 30 }, PaymentType.PAYMONEY);
      expect(component.isOrderPaid).toBe(false);
    });

    it('isOrderPaid is true when discount covers total', () => {
      component.selectedProducts = [makeProduct({ quantity: 1, currentPrice: 50 })];
      component.recalTotal();
      component.payIt({ name: '50.00', value: 50 }, PaymentType.DISCOUNT);
      expect(component.isOrderPaid).toBe(true);
    });
  });

  // ─── CONTRACT: Cash change calculation ───
  describe('5. Cash change calculation', () => {
    it('calculates correct change for overpayment', () => {
      component.selectedProducts = [makeProduct({ quantity: 1, currentPrice: 50 })];
      component.recalTotal();
      component.payIt({ name: '100.00', value: 100 }, PaymentType.PAYMONEY);
      component.calTotals();

      expect(component.toReturn).toBe(50);
    });

    it('returns 0 change for exact payment', () => {
      component.selectedProducts = [makeProduct({ quantity: 1, currentPrice: 50 })];
      component.recalTotal();
      component.payIt({ name: '50.00', value: 50 }, PaymentType.PAYMONEY);
      component.calTotals();

      expect(component.toReturn).toBe(0);
    });
  });

  // ─── CONTRACT: Discount reduces total ───
  describe('6. Discount reduces total', () => {
    it('applies discount correctly', () => {
      component.selectedProducts = [makeProduct({ quantity: 1, currentPrice: 100 })];
      component.recalTotal();
      component.payIt({ name: '10.00', value: 10 }, PaymentType.DISCOUNT);
      component.calTotals();

      expect(component.totalDiscount).toBe(10);
      expect(component.amountDue).toBe(90);
    });
  });

  // ─── CONTRACT: Complete checkout creates sale ───
  describe('7. Complete checkout creates sale', () => {
    it('saves order with correct structure', fakeAsync(() => {
      component.selectedProducts = [
        makeProduct({ id: 1, quantity: 2, currentPrice: 32 }),
      ];
      component.total = 64;
      component.selectedCustomer = { id: 5, name: 'Maria', ci: '12345' };
      component.payIt({ name: '64.00', value: 64 }, PaymentType.PAYMONEY);
      component.calTotals();

      component.saveOrder();
      tick(800);

      expect(ordersSvcSpy.save).toHaveBeenCalledWith(
        jasmine.objectContaining({
          customerId: 5,
          total: 64,
          paid: true,
          delivered: true,
          storeProfileId: 1,
        })
      );
    }));

    it('creates order detail with snapshotted price', fakeAsync(() => {
      component.selectedProducts = [
        makeProduct({ id: 1, quantity: 2, currentPrice: 32 }),
      ];
      component.total = 64;
      component.selectedCustomer = { id: 1, name: 'Anonymous' };
      component.payIt({ name: '64.00', value: 64 }, PaymentType.PAYMONEY);
      component.calTotals();

      component.saveOrder();
      tick(800);

      expect(ordersSvcSpy.saveDetail).toHaveBeenCalledWith(
        jasmine.objectContaining({
          productId: 1,
          quantity: 2,
          currentPrice: 32,
          totalPrice: 64,
          discount: 0,
        })
      );
    }));
  });

  // ─── CONTRACT: Sale with multiple items ───
  describe('8. Sale with multiple items', () => {
    it('creates detail for each cart item', fakeAsync(() => {
      component.selectedProducts = [
        makeProduct({ id: 1, name: 'Chicken', quantity: 2, currentPrice: 32 }),
        makeProduct({ id: 2, name: 'Fries', quantity: 1, currentPrice: 15, productId: 2 }),
      ];
      component.total = 79;
      component.selectedCustomer = { id: 1, name: 'Anonymous' };
      component.payIt({ name: '79.00', value: 79 }, PaymentType.PAYMONEY);
      component.calTotals();

      component.saveOrder();
      tick(800);

      expect(ordersSvcSpy.saveDetail).toHaveBeenCalledTimes(2);
    }));
  });

  // ─── CONTRACT: Inventory is reduced after sale ───
  describe('9. Inventory is reduced after sale', () => {
    it('calls reduceInventory for each item', fakeAsync(() => {
      component.selectedProducts = [
        makeProduct({ id: 1, quantity: 3, currentPrice: 32 }),
      ];
      component.total = 96;
      component.selectedCustomer = { id: 1, name: 'Anonymous' };
      component.payIt({ name: '96.00', value: 96 }, PaymentType.PAYMONEY);
      component.calTotals();

      component.saveOrder();
      tick(800);

      expect(inventorySvcSpy.reduceInventory).toHaveBeenCalledWith('1', 3);
    }));

    it('calls updateTotalSelled for each item', fakeAsync(() => {
      component.selectedProducts = [
        makeProduct({ id: 1, quantity: 2, currentPrice: 32 }),
      ];
      component.total = 64;
      component.selectedCustomer = { id: 1, name: 'Anonymous' };
      component.payIt({ name: '64.00', value: 64 }, PaymentType.PAYMONEY);
      component.calTotals();

      component.saveOrder();
      tick(800);

      expect(inventorySvcSpy.updateTotalSelled).toHaveBeenCalledWith('1', 64);
    }));

    it('calls updateQuantitySelled for each item', fakeAsync(() => {
      component.selectedProducts = [
        makeProduct({ id: 1, quantity: 2, currentPrice: 32 }),
      ];
      component.total = 64;
      component.selectedCustomer = { id: 1, name: 'Anonymous' };
      component.payIt({ name: '64.00', value: 64 }, PaymentType.PAYMONEY);
      component.calTotals();

      component.saveOrder();
      tick(800);

      expect(inventorySvcSpy.updateQuantitySelled).toHaveBeenCalledWith('1', 2);
    }));
  });

  // ─── CONTRACT: Cart is cleared after successful sale ───
  describe('10. Cart is cleared after successful sale', () => {
    it('clears all items after order pipeline completes', fakeAsync(() => {
      component.selectedProducts = [
        makeProduct({ id: 1, quantity: 2, currentPrice: 32 }),
      ];
      component.total = 64;
      component.selectedCustomer = { id: 1, name: 'Anonymous' };
      component.payIt({ name: '64.00', value: 64 }, PaymentType.PAYMONEY);
      component.calTotals();

      component.saveOrder();
      tick(800);

      expect(component.selectedProducts).toEqual([]);
      expect(component.total).toBe(0);
      expect(component.payedItems).toEqual([]);
      expect(component.discountItems).toEqual([]);
      expect(component.returnItems).toEqual([]);
      expect(component.totalPayed).toBe(0);
      expect(component.totalDiscount).toBe(0);
      expect(component.totalReturn).toBe(0);
      expect(component.toReturn).toBe(0);
      expect(component.selectedCustomer.name).toBe('Anonymous');
    }));
  });

  // ─── CONTRACT: Failed sale must not modify inventory ───
  describe('11. Failed sale does not modify inventory', () => {
    it('does not clear cart when save fails', fakeAsync(() => {
      ordersSvcSpy.save.and.returnValue(throwError(() => new Error('DB error')));

      component.selectedProducts = [
        makeProduct({ id: 1, quantity: 2, currentPrice: 32 }),
      ];
      component.total = 64;
      component.selectedCustomer = { id: 1, name: 'Anonymous' };
      component.payIt({ name: '64.00', value: 64 }, PaymentType.PAYMONEY);
      component.calTotals();

      component.saveOrder();
      tick(800);

      expect(component.selectedProducts.length).toBe(1);
      expect(inventorySvcSpy.reduceInventory).not.toHaveBeenCalled();
    }));

    it('does not clear cart when detail save fails', fakeAsync(() => {
      ordersSvcSpy.saveDetail.and.returnValue(throwError(() => new Error('DB error')));

      component.selectedProducts = [
        makeProduct({ id: 1, quantity: 2, currentPrice: 32 }),
      ];
      component.total = 64;
      component.selectedCustomer = { id: 1, name: 'Anonymous' };
      component.payIt({ name: '64.00', value: 64 }, PaymentType.PAYMONEY);
      component.calTotals();

      component.saveOrder();
      tick(800);

      expect(component.printOrderCount).toBe(0);
    }));

    it('does not clear cart when inventory update fails', fakeAsync(() => {
      inventorySvcSpy.reduceInventory.and.returnValue(throwError(() => new Error('Inventory error')));

      component.selectedProducts = [
        makeProduct({ id: 1, quantity: 2, currentPrice: 32 }),
      ];
      component.total = 64;
      component.selectedCustomer = { id: 1, name: 'Anonymous' };
      component.payIt({ name: '64.00', value: 64 }, PaymentType.PAYMONEY);
      component.calTotals();

      component.saveOrder();
      tick(800);

      expect(component.printOrderCount).toBe(0);
    }));
  });

  // ─── CONTRACT: Order detail snapshots price at time of sale ───
  describe('12. Order detail snapshots price at time of sale', () => {
    it('stores currentPrice in detail, not original price', fakeAsync(() => {
      const product = makeProduct({ id: 1, quantity: 1, currentPrice: 32, price: 30 });
      component.selectedProducts = [product];
      component.total = 32;
      component.selectedCustomer = { id: 1, name: 'Anonymous' };
      component.payIt({ name: '32.00', value: 32 }, PaymentType.PAYMONEY);
      component.calTotals();

      component.saveOrder();
      tick(800);

      const detailCall = ordersSvcSpy.saveDetail.calls.mostRecent().args[0];
      expect(detailCall.currentPrice).toBe(32);
      expect(detailCall.totalPrice).toBe(32);
    }));
  });

  // ─── CONTRACT: Customer is recorded on sale ───
  describe('13. Customer is recorded on sale', () => {
    it('includes customerId in order', () => {
      component.selectedProducts = [makeProduct({ quantity: 1, currentPrice: 10 })];
      component.total = 10;
      component.selectCustomer({ id: 7, name: 'Pedro', ci: '99999' });
      component.payIt({ name: '10.00', value: 10 }, PaymentType.PAYMONEY);
      component.calTotals();

      const { order } = component.buildOrderAndDetails();
      expect(order.customerId).toBe(7);
    });
  });

  // ─── CONTRACT: Payment split (cash + QR) ───
  describe('14. Payment split (cash + QR)', () => {
    it('records both cash and QR amounts', fakeAsync(() => {
      component.selectedProducts = [makeProduct({ quantity: 1, currentPrice: 100 })];
      component.total = 100;
      component.selectedCustomer = { id: 1, name: 'Anonymous' };
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
  });

  // ─── CONTRACT: Remove product from cart ───
  describe('15. Remove product from cart', () => {
    it('removes product and recalculates total', () => {
      const p1 = makeProduct({ id: 1, quantity: 1, currentPrice: 32 });
      const p2 = makeProduct({ id: 2, quantity: 1, currentPrice: 15, productId: 2 });
      component.selectedProducts = [p1, p2];
      component.recalTotal();
      expect(component.total).toBe(47);

      component.removeProduct(p1);
      expect(component.selectedProducts.length).toBe(1);
      expect(component.total).toBe(15);
    });
  });

  // ─── CONTRACT: Profile switching clears cart ───
  describe('16. Profile switching clears cart', () => {
    it('does not clear cart without confirmation dialog', () => {
      component.selectedProducts = [makeProduct()];
      component.total = 32;

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onProfileChanged({
        id: 2, name: 'Chicken Store', slug: 'chicken-store',
        description: '', active: true, defaultProfile: false,
      });

      expect(component.selectedProducts.length).toBe(1);
    });

    it('clears cart when user confirms', () => {
      component.selectedProducts = [makeProduct()];
      component.total = 32;

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onProfileChanged({
        id: 2, name: 'Chicken Store', slug: 'chicken-store',
        description: '', active: true, defaultProfile: false,
      });

      expect(component.selectedProducts.length).toBe(0);
      expect(component.total).toBe(0);
    });
  });

  // ─── CONTRACT: Price precision ───
  describe('17. Price precision', () => {
    it('handles cents correctly in subtotals', () => {
      component.selectedProducts = [
        makeProduct({ id: 1, quantity: 3, currentPrice: 10.55 }),
      ];
      component.recalTotal();
      expect(component.total).toBe(31.65);
    });

    it('handles rounding across multiple items', () => {
      component.selectedProducts = [
        makeProduct({ id: 1, quantity: 2, currentPrice: 10.335 }),
        makeProduct({ id: 2, quantity: 1, currentPrice: 5.665, productId: 2 }),
      ];
      component.recalTotal();
      // 2 * roundToCents(10.335) + 1 * roundToCents(5.665) = 2*10.34 + 5.67 = 26.35
      expect(component.total).toBe(26.35);
    });
  });

  // ─── CONTRACT: Order paidCash and paidQr breakdown ───
  describe('18. Order paidCash and paidQr breakdown', () => {
    it('builds order with correct payment breakdown', fakeAsync(() => {
      component.selectedProducts = [makeProduct({ quantity: 1, currentPrice: 100 })];
      component.total = 100;
      component.selectedCustomer = { id: 1, name: 'Anonymous' };
      component.payIt({ name: '50.00', value: 50 }, PaymentType.PAYMONEY);
      component.payIt({ name: '50.00', value: 50 }, PaymentType.PAYQR);
      component.calTotals();

      const { order } = component.buildOrderAndDetails();
      expect(order.paidCash).toBe(50);
      expect(order.paidQr).toBe(50);
      expect(order.total).toBe(100);
    }));
  });

  // ─── CONTRACT: Build order and details structure ───
  describe('19. Build order and details structure', () => {
    it('order has all required fields', () => {
      component.selectedProducts = [makeProduct({ quantity: 1, currentPrice: 50 })];
      component.total = 50;
      component.selectedCustomer = { id: 3, name: 'Ana' };

      const { order } = component.buildOrderAndDetails();

      expect(order.customerId).toBe(3);
      expect(order.total).toBe(50);
      expect(order.paid).toBe(true);
      expect(order.delivered).toBe(true);
      expect(order.createdDate).toBeTruthy();
      expect(order.deliveryDate).toBeTruthy();
    });

    it('detail has all required fields', () => {
      component.selectedProducts = [makeProduct({ id: 1, quantity: 2, currentPrice: 15 })];
      component.total = 30;

      const { details } = component.buildOrderAndDetails();

      expect(details.length).toBe(1);
      expect(details[0].quantity).toBe(2);
      expect(details[0].currentPrice).toBe(15);
      expect(details[0].totalPrice).toBe(30);
      expect(details[0].discount).toBe(0);
      expect(details[0].productId).toBe(1);
    });

    it('order includes storeProfileId from active profile', () => {
      component.selectedProducts = [makeProduct({ quantity: 1, currentPrice: 10 })];
      component.total = 10;
      profileSvcSpy.getActiveProfileId.and.returnValue(2);

      const { order } = component.buildOrderAndDetails();
      expect(order.storeProfileId).toBe(2);
    });

    it('order omits storeProfileId when no active profile', () => {
      component.selectedProducts = [makeProduct({ quantity: 1, currentPrice: 10 })];
      component.total = 10;
      profileSvcSpy.getActiveProfileId.and.returnValue(null);

      const { order } = component.buildOrderAndDetails();
      expect(order.storeProfileId).toBeUndefined();
    });
  });
});
