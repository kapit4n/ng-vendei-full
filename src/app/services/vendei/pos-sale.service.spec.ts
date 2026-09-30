import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import { PosSaleService } from './pos-sale.service';
import { VInventoryService } from './v-inventory.service';
import { VOrdersService } from './v-orders.service';
import { VStoreProfileService } from './v-store-profile.service';
import { PaymentType } from '../../features/vendei/payment-types';

describe('PosSaleService', () => {
  let svc: PosSaleService;
  let orders: jasmine.SpyObj<VOrdersService>;
  let inventory: jasmine.SpyObj<VInventoryService>;
  let profile: jasmine.SpyObj<VStoreProfileService>;

  const line = (over: Record<string, unknown> = {}) =>
    ({ quantity: 2, currentPrice: 10, productId: 5, ...over }) as never;

  const draft = (over: Record<string, unknown> = {}) => ({
    customerId: 3,
    lines: [line()],
    payments: [
      { payType: PaymentType.PAYMONEY, value: 15 },
      { payType: PaymentType.PAYQR, value: 5 },
    ],
    total: 20,
    totalDiscount: 0,
    totalReturn: 0,
    ...over,
  });

  beforeEach(() => {
    orders = jasmine.createSpyObj('VOrdersService', ['save', 'saveDetail']);
    inventory = jasmine.createSpyObj('VInventoryService', [
      'reduceInventory',
      'updateTotalSelled',
      'updateQuantitySelled',
    ]);
    profile = jasmine.createSpyObj('VStoreProfileService', ['getActiveProfileId']);
    profile.getActiveProfileId.and.returnValue(1);

    orders.save.and.returnValue(of({ id: 77, createdDate: new Date() }) as never);
    orders.saveDetail.and.returnValue(of({ id: 1 }) as never);
    for (const m of [inventory.reduceInventory, inventory.updateTotalSelled, inventory.updateQuantitySelled]) {
      m.and.returnValue(of({}) as never);
    }

    TestBed.configureTestingModule({
      providers: [
        PosSaleService,
        { provide: VOrdersService, useValue: orders },
        { provide: VInventoryService, useValue: inventory },
        { provide: VStoreProfileService, useValue: profile },
      ],
    });
    svc = TestBed.inject(PosSaleService);
  });

  describe('buildOrderAndDetails', () => {
    it('records the customer on the order', () => {
      expect(svc.buildOrderAndDetails(draft()).order.customerId).toBe(3);
    });

    it('splits payment by type into paidCash and paidQr', () => {
      const { order } = svc.buildOrderAndDetails(draft());
      expect(order.paidCash).toBe(15);
      expect(order.paidQr).toBe(5);
    });

    it('rounds the order total to cents', () => {
      const { order } = svc.buildOrderAndDetails(draft({ total: 10.005 }));
      expect(order.total).toBe(10.01);
    });

    it('stamps the active store profile', () => {
      expect(svc.buildOrderAndDetails(draft()).order.storeProfileId).toBe(1);
    });

    it('omits the store profile when none is active', () => {
      profile.getActiveProfileId.and.returnValue(null);
      expect(svc.buildOrderAndDetails(draft()).order.storeProfileId).toBeUndefined();
    });

    it('builds one detail per line with the line total', () => {
      const { details } = svc.buildOrderAndDetails(draft());
      expect(details.length).toBe(1);
      expect(details[0].totalPrice).toBe(20);
    });

    it('prefers line.productId, then Product.id, then line.id', () => {
      const fallback = svc.buildOrderAndDetails(
        draft({ lines: [{ quantity: 1, currentPrice: 1, id: 9, Product: { id: 4 } } as never] })
      );
      expect(fallback.details[0].productId).toBe(4);

      const last = svc.buildOrderAndDetails(draft({ lines: [{ quantity: 1, currentPrice: 1, id: 9 } as never] }));
      expect(last.details[0].productId).toBe(9);
    });

    it('carries the variant through only when present', () => {
      const withVariant = svc.buildOrderAndDetails(draft({ lines: [line({ variantId: 8 })] }));
      expect(withVariant.details[0].productVariantId).toBe(8);

      const without = svc.buildOrderAndDetails(draft());
      expect(without.details[0].productVariantId).toBeUndefined();
    });
  });

  describe('submit', () => {
    it('stamps the saved order id onto every detail', (done) => {
      svc.submit(draft()).subscribe({
        complete: () => {
          expect(orders.saveDetail).toHaveBeenCalledTimes(1);
          expect(orders.saveDetail.calls.mostRecent().args[0].orderId).toBe(77 as never);
          done();
        },
      });
    });

    it('reduces inventory and updates sold totals per line', (done) => {
      svc.submit(draft({ lines: [line(), line({ productId: 6 })] })).subscribe({
        complete: () => {
          expect(inventory.reduceInventory).toHaveBeenCalledTimes(2);
          expect(inventory.updateTotalSelled).toHaveBeenCalledTimes(2);
          expect(inventory.updateQuantitySelled).toHaveBeenCalledTimes(2);
          expect(inventory.reduceInventory).toHaveBeenCalledWith('6', 2 as never);
          done();
        },
      });
    });

    it('completes without touching inventory for an empty ticket', (done) => {
      svc.submit(draft({ lines: [] })).subscribe({
        complete: () => {
          expect(orders.save).toHaveBeenCalled();
          expect(inventory.reduceInventory).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('propagates a failed order save instead of silently clearing the cart', (done) => {
      orders.save.and.returnValue(throwError(() => new Error('offline')) as never);
      svc.submit(draft()).subscribe({
        error: (err: Error) => {
          expect(err.message).toBe('offline');
          expect(orders.saveDetail).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('propagates a failed detail save', (done) => {
      orders.saveDetail.and.returnValue(throwError(() => new Error('detail down')) as never);
      svc.submit(draft()).subscribe({
        error: (err: Error) => {
          expect(err.message).toBe('detail down');
          done();
        },
      });
    });

    it('propagates a failed inventory update', (done) => {
      inventory.reduceInventory.and.returnValue(throwError(() => new Error('stock race')) as never);
      svc.submit(draft()).subscribe({
        error: (err: Error) => {
          expect(err.message).toBe('stock race');
          done();
        },
      });
    });
  });
});
