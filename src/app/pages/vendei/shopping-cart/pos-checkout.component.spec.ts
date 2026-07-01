import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PosCheckoutComponent } from './pos-checkout.component';
import { VOrdersService } from '../../../services/vendei/v-orders.service';
import { VInventoryService } from '../../../services/vendei/v-inventory.service';
import { VInvoiceService } from '../../../services/vendei/v-invoice.service';
import { VConfigService } from 'src/app/services/vendei/v-config.service';
import { Router } from '@angular/router';
import { PaymentType } from 'src/app/features/vendei/payment-types';

describe('PosCheckoutComponent', () => {
  let component: PosCheckoutComponent;
  let fixture: ComponentFixture<PosCheckoutComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let ordersSvcSpy: jasmine.SpyObj<VOrdersService>;
  let inventorySvcSpy: jasmine.SpyObj<VInventoryService>;
  let invoiceSvcSpy: jasmine.SpyObj<VInvoiceService>;
  let configSvc: VConfigService;

  const mockProduct = (overrides?: any) => ({
    id: 1,
    productId: 1,
    name: 'Test Product',
    quantity: 1,
    currentPrice: 10.00,
    price: 10.00,
    Product: { id: 1, name: 'Test Product', code: 'T-001', image: '' },
    ...overrides,
  });

  const emptyCustomer = { id: 1, name: 'Anonymous', ci: null, code: null };

  beforeEach(waitForAsync(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    ordersSvcSpy = jasmine.createSpyObj('VOrdersService', ['save', 'saveDetail']);
    inventorySvcSpy = jasmine.createSpyObj('VInventoryService', [
      'reduceInventory',
      'updateTotalSelled',
      'updateQuantitySelled',
    ]);
    invoiceSvcSpy = jasmine.createSpyObj('VInvoiceService', ['generate']);

    TestBed.configureTestingModule({
      declarations: [PosCheckoutComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        VConfigService,
        { provide: Router, useValue: routerSpy },
        { provide: VOrdersService, useValue: ordersSvcSpy },
        { provide: VInventoryService, useValue: inventorySvcSpy },
        { provide: VInvoiceService, useValue: invoiceSvcSpy },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    configSvc = TestBed.inject(VConfigService);
    ordersSvcSpy.save.and.returnValue(of({ id: 99 }));
    ordersSvcSpy.saveDetail.and.returnValue(of({}));
    inventorySvcSpy.reduceInventory.and.returnValue(of({}));
    inventorySvcSpy.updateTotalSelled.and.returnValue(of({}));
    inventorySvcSpy.updateQuantitySelled.and.returnValue(of({}));
    invoiceSvcSpy.generate.and.returnValue('<html>invoice</html>');

    fixture = TestBed.createComponent(PosCheckoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('initial state', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('starts with empty ticket', () => {
      expect(component.selectedProducts).toEqual([]);
      expect(component.total).toBe(0);
      expect(component.totalPayed).toBe(0);
      expect(component.totalDiscount).toBe(0);
      expect(component.totalReturn).toBe(0);
      expect(component.toReturn).toBe(0);
      expect(component.printOrderCount).toBe(0);
    });

    it('starts with anonymous customer', () => {
      expect(component.selectedCustomer.id).toBe(1);
      expect(component.selectedCustomer.name).toBe('Anonymous');
    });

    it('starts with empty payment lines', () => {
      expect(component.payedItems).toEqual([]);
      expect(component.discountItems).toEqual([]);
      expect(component.returnItems).toEqual([]);
    });

    it('exposes pos version', () => {
      expect(component.posVersion).toBe('1.0.0');
    });
  });

  describe('recalTotal', () => {
    it('calculates sum of selectedProducts', () => {
      component.selectedProducts = [
        mockProduct({ id: 1, quantity: 2, currentPrice: 10.50 }),
        mockProduct({ id: 2, quantity: 1, currentPrice: 5.25 }),
      ];
      component.recalTotal();
      expect(component.total).toBe(26.25);
    });

    it('does nothing when printOrderCount > 0', () => {
      component.printOrderCount = 1;
      component.selectedProducts = [mockProduct({ quantity: 5, currentPrice: 10 })];
      component.recalTotal();
      expect(component.total).toBe(0);
    });
  });

  describe('removeProduct', () => {
    it('removes product by id and recalculates', () => {
      const p1 = mockProduct({ id: 1, quantity: 1, currentPrice: 5 });
      const p2 = mockProduct({ id: 2, quantity: 1, currentPrice: 10 });
      component.selectedProducts = [p1, p2];
      component.recalTotal();

      component.removeProduct(p1);
      expect(component.selectedProducts).toEqual([p2]);
      expect(component.total).toBe(10);
    });

    it('does not remove when printOrderCount > 0', () => {
      component.selectedProducts = [mockProduct()];
      component.printOrderCount = 1;
      component.removeProduct(mockProduct());
      expect(component.selectedProducts.length).toBe(1);
    });
  });

  describe('payIt', () => {
    it('adds a cash payment line', () => {
      component.payIt({ name: '50.00', value: 50 }, PaymentType.PAYMONEY);
      expect(component.payedItems.length).toBe(1);
      expect(component.payedItems[0].value).toBe(50);
      expect(component.payedItems[0].payType).toBe(PaymentType.PAYMONEY);
      expect(component.payedItems[0].id).toBeDefined();
    });

    it('adds a QR payment line', () => {
      component.payIt({ name: '100.00', value: 100 }, PaymentType.PAYQR);
      expect(component.payedItems.length).toBe(1);
      expect(component.payedItems[0].payType).toBe(PaymentType.PAYQR);
    });

    it('adds a discount line', () => {
      component.payIt({ name: '5.00', value: 5 }, PaymentType.DISCOUNT);
      expect(component.discountItems.length).toBe(1);
      expect(component.discountItems[0].value).toBe(5);
    });

    it('adds a return / change line', () => {
      component.payIt({ name: '10.00', value: 10 }, PaymentType.PAYRETURN);
      expect(component.returnItems.length).toBe(1);
      expect(component.returnItems[0].value).toBe(10);
    });

    it('does nothing when printOrderCount > 0', () => {
      component.printOrderCount = 1;
      component.payIt({ name: '50.00', value: 50 }, PaymentType.PAYMONEY);
      expect(component.payedItems.length).toBe(0);
    });

    it('assigns incremental ids per category', () => {
      component.payIt({ name: '10', value: 10 }, PaymentType.PAYMONEY);
      component.payIt({ name: '20', value: 20 }, PaymentType.PAYMONEY);
      component.payIt({ name: '5', value: 5 }, PaymentType.DISCOUNT);
      component.payIt({ name: '3', value: 3 }, PaymentType.PAYRETURN);

      expect(component.payedItems[0].id).toBe(1);
      expect(component.payedItems[1].id).toBe(2);
      expect(component.discountItems[0].id).toBe(1);
      expect(component.returnItems[0].id).toBe(1);
    });
  });

  describe('removeItem', () => {
    beforeEach(() => {
      component.payIt({ name: '50', value: 50 }, PaymentType.PAYMONEY);
      component.payIt({ name: '5', value: 5 }, PaymentType.DISCOUNT);
      component.payIt({ name: '10', value: 10 }, PaymentType.PAYRETURN);
    });

    it('removes a cash/QR payment line', () => {
      const item = component.payedItems[0];
      component.removeItem(item);
      expect(component.payedItems.length).toBe(0);
    });

    it('removes a discount line', () => {
      const item = component.discountItems[0];
      component.removeItem(item);
      expect(component.discountItems.length).toBe(0);
    });

    it('removes a return line', () => {
      const item = component.returnItems[0];
      component.removeItem(item);
      expect(component.returnItems.length).toBe(0);
    });

    it('does nothing when printOrderCount > 0', () => {
      component.printOrderCount = 1;
      component.removeItem(component.payedItems[0]);
      expect(component.payedItems.length).toBe(1);
    });
  });

  describe('calTotals', () => {
    it('calculates totals from payment arrays', () => {
      component.total = 100;
      component.payedItems = [
        { id: 1, value: 50 },
        { id: 2, value: 50 },
      ];
      component.returnItems = [{ id: 1, value: 10 }];
      component.discountItems = [{ id: 1, value: 5 }];

      component.calTotals();

      expect(component.totalPayed).toBe(100);
      expect(component.totalReturn).toBe(10);
      expect(component.totalDiscount).toBe(5);
      expect(component.toReturn).toBe(-5); // 100 payed - (100-5 net) - 10 return = -5
    });

    it('toReturn can be negative when payment is less than net', () => {
      component.total = 100;
      component.payedItems = [{ id: 1, value: 20 }];
      component.returnItems = [];
      component.discountItems = [];

      component.calTotals();

      expect(component.toReturn).toBe(-80); // 20 payed - 100 net - 0 return = -80
    });
  });

  describe('get netOrderTotal', () => {
    it('returns total minus discount', () => {
      component.total = 100;
      component.totalDiscount = 15;
      expect(component.netOrderTotal).toBe(85);
    });

    it('never goes below zero', () => {
      component.total = 10;
      component.totalDiscount = 50;
      expect(component.netOrderTotal).toBe(0);
    });
  });

  describe('get effectivePaid', () => {
    it('returns payed minus return', () => {
      component.totalPayed = 100;
      component.totalReturn = 20;
      expect(component.effectivePaid).toBe(80);
    });
  });

  describe('get amountDue', () => {
    it('returns positive balance remaining', () => {
      component.total = 100;
      component.totalPayed = 60;
      component.totalReturn = 5;
      component.totalDiscount = 10;
      expect(component.amountDue).toBe(35);
    });

    it('returns 0 when fully paid', () => {
      component.total = 100;
      component.totalPayed = 100;
      component.totalReturn = 0;
      component.totalDiscount = 0;
      expect(component.amountDue).toBe(0);
    });
  });

  describe('get isOrderPaid', () => {
    it('returns true when fully paid and no print lock', () => {
      component.total = 100;
      component.totalPayed = 100;
      component.totalReturn = 0;
      component.totalDiscount = 0;
      component.printOrderCount = 0;
      expect(component.isOrderPaid).toBe(true);
    });

    it('returns false when total is 0', () => {
      component.total = 0;
      expect(component.isOrderPaid).toBe(false);
    });

    it('returns false when print is locked', () => {
      component.total = 100;
      component.totalPayed = 100;
      component.printOrderCount = 1;
      expect(component.isOrderPaid).toBe(false);
    });
  });

  describe('selectCustomer', () => {
    it('updates selectedCustomer with a copy', () => {
      component.selectCustomer({ id: 5, name: 'Juan', ci: '12345' });
      expect(component.selectedCustomer.id).toBe(5);
      expect(component.selectedCustomer.name).toBe('Juan');
      expect(component.selectedCustomer.ci).toBe('12345');
    });

    it('resets to anonymous when customer is null', () => {
      component.selectCustomer(null);
      expect(component.selectedCustomer.name).toBe('Anonymous');
    });

    it('does nothing when printOrderCount > 0', () => {
      component.printOrderCount = 1;
      component.selectCustomer({ id: 5, name: 'Juan' });
      expect(component.selectedCustomer.name).toBe('Anonymous');
    });
  });

  describe('clearItems / clearTicket', () => {
    it('clears all items and resets customer to anonymous', () => {
      component.selectedProducts = [mockProduct()];
      component.total = 100;
      component.payedItems = [{ id: 1, value: 50 }];
      component.totalPayed = 50;
      component.selectedCustomer = { id: 5, name: 'Juan' };

      component.clearItems();

      expect(component.selectedProducts).toEqual([]);
      expect(component.total).toBe(0);
      expect(component.payedItems).toEqual([]);
      expect(component.discountItems).toEqual([]);
      expect(component.returnItems).toEqual([]);
      expect(component.totalPayed).toBe(0);
      expect(component.totalDiscount).toBe(0);
      expect(component.totalReturn).toBe(0);
      expect(component.toReturn).toBe(0);
      expect(component.printOrderCount).toBe(0);
      expect(component.selectedCustomer.name).toBe('Anonymous');
    });

    it('clearTicket refuses when print locked', () => {
      component.selectedProducts = [mockProduct()];
      component.printOrderCount = 1;
      component.clearTicket();
      expect(component.selectedProducts.length).toBe(1);
    });
  });

  describe('openPosMore', () => {
    it('navigates to /main', () => {
      component.openPosMore();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/main']);
    });
  });

  describe('submitOrder', () => {
    beforeEach(() => {
      component.selectedProducts = [
        mockProduct({ id: 1, quantity: 2, currentPrice: 10 }),
      ];
      component.total = 20;
      component.selectedCustomer = { id: 3, name: 'Maria' };
      component.payedItems = [{ id: 1, value: 20 }];
      component.calTotals();
    });

    it('saves order and details', fakeAsync(() => {
      component.submitOrder();
      tick(800);

      expect(ordersSvcSpy.save).toHaveBeenCalledWith(
        jasmine.objectContaining({
          customerId: 3,
          total: 20,
          paid: true,
          delivered: true,
        })
      );
      expect(ordersSvcSpy.saveDetail).toHaveBeenCalled();
      expect(component.selectedProducts).toEqual([]);
    }));

    it('prints when config.printInvoice is true and printTwice is false', () => {
      spyOn(component, 'printOrder');
      configSvc.printInvoice = true;
      component.printTwice = false;

      component.submitOrder();

      expect(component.printOrder).toHaveBeenCalled();
    });

    it('handles two-pass printing flow', () => {
      spyOn(component, 'printOrder');
      spyOn(component, 'clearItems');
      configSvc.printInvoice = true;
      component.printTwice = true;
      component.printOrderCount = 1;

      component.submitOrder();

      expect(component.printOrder).toHaveBeenCalled();
      expect(component.clearItems).toHaveBeenCalled();
    });

    it('calls printInvoiceAndSave when printInvoiceBeforeSubmit is true', () => {
      spyOn(component, 'printInvoiceAndSave');
      configSvc.printInvoiceBeforeSubmit = true;

      component.submitOrder();

      expect(component.printInvoiceAndSave).toHaveBeenCalled();
    });

    it('calls saveOrder directly when both printInvoice and printInvoiceBeforeSubmit are false', () => {
      spyOn(component, 'saveOrder').and.callThrough();
      configSvc.printInvoice = false;
      configSvc.printInvoiceBeforeSubmit = false;

      component.submitOrder();

      expect(component.saveOrder).toHaveBeenCalled();
    });

    it('printInvoice has priority over printInvoiceBeforeSubmit', () => {
      spyOn(component, 'printOrder');
      spyOn(component, 'printInvoiceAndSave');
      configSvc.printInvoice = true;
      configSvc.printInvoiceBeforeSubmit = true;

      component.submitOrder();

      expect(component.printOrder).toHaveBeenCalled();
      expect(component.printInvoiceAndSave).not.toHaveBeenCalled();
    });
  });

  describe('saveOrder', () => {
    beforeEach(() => {
      component.selectedProducts = [
        mockProduct({ id: 1, quantity: 2, currentPrice: 10 }),
      ];
      component.total = 20;
      component.selectedCustomer = { id: 3, name: 'Maria' };
      component.payedItems = [{ id: 1, value: 20 }];
      component.calTotals();
    });

    it('builds order with correct structure', fakeAsync(() => {
      component.saveOrder();
      tick(800);

      expect(ordersSvcSpy.save).toHaveBeenCalledWith(
        jasmine.objectContaining({
          customerId: 3,
          total: 20,
          paid: true,
          delivered: true,
        })
      );
      expect(ordersSvcSpy.save).toHaveBeenCalledWith(
        jasmine.objectContaining({
          createdDate: jasmine.any(Date),
          deliveryDate: jasmine.any(Date),
        })
      );
    }));

    it('builds details correctly', fakeAsync(() => {
      component.saveOrder();
      tick(800);

      expect(ordersSvcSpy.saveDetail).toHaveBeenCalledWith(
        jasmine.objectContaining({
          productId: 1,
          quantity: 2,
          currentPrice: 10,
          totalPrice: 20,
          discount: 0,
        })
      );
    }));

    it('clears items on complete', fakeAsync(() => {
      component.saveOrder();
      tick(800);

      expect(component.selectedProducts).toEqual([]);
      expect(component.total).toBe(0);
    }));
  });

  describe('printInvoiceAndSave', () => {
    let mockWindow: any;

    beforeEach(() => {
      component.selectedProducts = [
        mockProduct({ id: 1, quantity: 2, currentPrice: 10 }),
      ];
      component.total = 20;
      component.selectedCustomer = { id: 3, name: 'Maria' };
      component.payedItems = [{ id: 1, value: 20 }];
      component.calTotals();

      mockWindow = {
        document: { write: jasmine.createSpy(), close: jasmine.createSpy() },
        print: jasmine.createSpy(),
        closed: false,
        close: jasmine.createSpy(),
      };
    });

    it('generates invoice HTML via invoice service', () => {
      spyOn(window, 'open').and.returnValue(mockWindow);

      component.printInvoiceAndSave();

      expect(invoiceSvcSpy.generate).toHaveBeenCalledWith(
        jasmine.objectContaining({
          total: 20,
          totalPayed: 20,
        })
      );
    });

    it('opens a print window with the generated HTML', () => {
      spyOn(window, 'open').and.returnValue(mockWindow);

      component.printInvoiceAndSave();

      expect(window.open).toHaveBeenCalledWith('', '_blank', 'width=400,height=600');
      expect(mockWindow.document.write).toHaveBeenCalledWith('<html>invoice</html>');
      expect(mockWindow.document.close).toHaveBeenCalled();
      expect(mockWindow.print).toHaveBeenCalled();
    });

    it('sets printOrderCount to 1 while printing', () => {
      spyOn(window, 'open').and.returnValue(mockWindow);

      component.printInvoiceAndSave();

      expect(component.printOrderCount).toBe(1);
    });

    it('falls back to saveOrder when popup is blocked', () => {
      spyOn(window, 'open').and.returnValue(null);
      spyOn(component, 'saveOrder');

      component.printInvoiceAndSave();

      expect(component.saveOrder).toHaveBeenCalled();
      expect(component.printOrderCount).toBe(0);
    });

    it('calls saveOrder when print window is closed', fakeAsync(() => {
      spyOn(window, 'open').and.returnValue(mockWindow);
      spyOn(component, 'saveOrder');

      component.printInvoiceAndSave();

      expect(component.saveOrder).not.toHaveBeenCalled();

      mockWindow.closed = true;
      tick(600);

      expect(component.saveOrder).toHaveBeenCalled();
    }));

    it('calls saveOrder only once even if window closes multiple times', fakeAsync(() => {
      spyOn(window, 'open').and.returnValue(mockWindow);
      spyOn(component, 'saveOrder');

      component.printInvoiceAndSave();
      mockWindow.closed = true;
      tick(600);
      tick(600);

      expect(component.saveOrder).toHaveBeenCalledTimes(1);
    }));

    it('calls saveOrder when onafterprint fires', () => {
      spyOn(window, 'open').and.returnValue(mockWindow);
      spyOn(component, 'saveOrder');

      component.printInvoiceAndSave();

      expect(component.saveOrder).not.toHaveBeenCalled();

      mockWindow.onafterprint();

      expect(component.saveOrder).toHaveBeenCalled();
    });

    it('saves only once when both onafterprint and window close happen', fakeAsync(() => {
      spyOn(window, 'open').and.returnValue(mockWindow);
      spyOn(component, 'saveOrder');

      component.printInvoiceAndSave();

      mockWindow.onafterprint();
      mockWindow.closed = true;
      tick(600);

      expect(component.saveOrder).toHaveBeenCalledTimes(1);
    }));

    it('closes the print window after onafterprint fires', () => {
      spyOn(window, 'open').and.returnValue(mockWindow);
      spyOn(mockWindow, 'close');

      component.printInvoiceAndSave();
      mockWindow.onafterprint();

      expect(mockWindow.close).toHaveBeenCalled();
    });

    it('does not call close on an already-closed window after onafterprint', () => {
      spyOn(window, 'open').and.returnValue(mockWindow);
      spyOn(mockWindow, 'close');

      component.printInvoiceAndSave();
      mockWindow.closed = true;
      mockWindow.onafterprint();

      expect(mockWindow.close).not.toHaveBeenCalled();
    });

    it('resets printOrderCount on save pipeline error', fakeAsync(() => {
      ordersSvcSpy.save.and.returnValue(of({ id: 99 }));
      const err$ = new Observable(sub => sub.error(new Error('save failed')));
      ordersSvcSpy.saveDetail.and.returnValue(err$);
      spyOn(window, 'open').and.returnValue(mockWindow);

      component.printInvoiceAndSave();
      mockWindow.onafterprint();
      tick(800);

      expect(component.printOrderCount).toBe(0);
    }));
  });

  describe('buildOrderAndDetails', () => {
    it('uses productId from p.productId with fallback chain', () => {
      component.selectedProducts = [
        { id: 999, productId: 1, quantity: 1, currentPrice: 10, Product: { id: 2 } },
      ];
      component.total = 10;

      const { details } = component.buildOrderAndDetails();
      expect(details[0].productId).toBe(1);
    });

    it('falls back to Product.id when productId is missing', () => {
      component.selectedProducts = [
        { id: 999, quantity: 1, currentPrice: 10, Product: { id: 2 } },
      ];
      component.total = 10;

      const { details } = component.buildOrderAndDetails();
      expect(details[0].productId).toBe(2);
    });

    it('falls back to p.id as last resort', () => {
      component.selectedProducts = [
        { id: 999, quantity: 1, currentPrice: 10 },
      ];
      component.total = 10;

      const { details } = component.buildOrderAndDetails();
      expect(details[0].productId).toBe(999);
    });
  });
});
