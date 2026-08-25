import { PaymentType } from './payment-types';

describe('PaymentType enum', () => {
  it('PAYMONEY is 1', () => {
    expect(PaymentType.PAYMONEY).toBe(1);
  });

  it('PAYRETURN is 2', () => {
    expect(PaymentType.PAYRETURN).toBe(2);
  });

  it('DISCOUNT is 3', () => {
    expect(PaymentType.DISCOUNT).toBe(3);
  });

  it('PAYQR is 4', () => {
    expect(PaymentType.PAYQR).toBe(4);
  });

  it('has exactly 4 members', () => {
    const keys = Object.keys(PaymentType).filter(k => isNaN(Number(k)));
    expect(keys.length).toBe(4);
  });

  it('numeric values are stable (changing breaks API contract)', () => {
    expect(PaymentType.PAYMONEY).toBe(1);
    expect(PaymentType.PAYRETURN).toBe(2);
    expect(PaymentType.DISCOUNT).toBe(3);
    expect(PaymentType.PAYQR).toBe(4);
  });
});
