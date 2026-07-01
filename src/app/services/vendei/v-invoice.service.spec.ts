import { TestBed } from '@angular/core/testing';
import { VInvoiceService } from './v-invoice.service';
import { PaymentType } from 'src/app/features/vendei/payment-types';

describe('VInvoiceService', () => {
  let service: VInvoiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VInvoiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('generate', () => {
    const mockData = () => ({
      products: [
        {
          quantity: 2,
          currentPrice: 10.5,
          Product: { name: 'Product A' },
        },
        {
          quantity: 1,
          currentPrice: 25.0,
          Product: { name: 'Product B' },
        },
      ],
      customer: { name: 'Juan Perez', ci: '1234567' },
      total: 46,
      totalPayed: 50,
      totalDiscount: 0,
      totalReturn: 4,
      payedItems: [{ name: '50.00', value: 50, payType: PaymentType.PAYMONEY }],
    });

    it('returns a string containing DOCTYPE html', () => {
      const html = service.generate(mockData());
      expect(html).toContain('<!DOCTYPE html>');
    });

    it('includes product names in the table', () => {
      const html = service.generate(mockData());
      expect(html).toContain('Product A');
      expect(html).toContain('Product B');
    });

    it('includes the total amount', () => {
      const html = service.generate(mockData());
      expect(html).toContain('46.00');
    });

    it('includes customer name', () => {
      const html = service.generate(mockData());
      expect(html).toContain('Juan Perez');
    });

    it('includes customer ID', () => {
      const html = service.generate(mockData());
      expect(html).toContain('1234567');
    });

    it('includes payment lines', () => {
      const html = service.generate(mockData());
      expect(html).toContain('Cash');
      expect(html).toContain('50.00');
    });

    it('shows discount line when discount > 0', () => {
      const data = mockData();
      data.totalDiscount = 5;
      data.total = 46;
      const html = service.generate(data);
      expect(html).toContain('Discount');
      expect(html).toContain('5.00');
    });

    it('does not show discount line when discount is 0', () => {
      const html = service.generate(mockData());
      expect(html).not.toContain('Discount');
    });

    it('shows change line when return > 0', () => {
      const data = mockData();
      data.totalReturn = 4;
      const html = service.generate(data);
      expect(html).toContain('Change');
      expect(html).toContain('4.00');
    });

    it('handles missing Product.name gracefully', () => {
      const data = mockData();
      data.products[0] = { quantity: 1, currentPrice: 10, name: 'Fallback Name' } as any;
      const html = service.generate(data);
      expect(html).toContain('Fallback Name');
    });

    it('handles customer with code instead of ci', () => {
      const data = mockData();
      data.customer = { name: 'Maria', code: 'C-001' } as any;
      const html = service.generate(data);
      expect(html).toContain('C-001');
    });

    it('handles empty customer gracefully', () => {
      const data = mockData();
      data.customer = {} as any;
      const html = service.generate(data);
      expect(html).toContain('INVOICE');
    });

    it('includes footer text', () => {
      const html = service.generate(mockData());
      expect(html).toContain('Thank you for your purchase');
    });
  });
});
