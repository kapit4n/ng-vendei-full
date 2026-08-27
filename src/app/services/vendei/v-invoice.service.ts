import { Injectable } from '@angular/core';
import { PaymentType } from 'src/app/features/vendei/payment-types';
import { roundToCents } from 'src/app/utils/money';
import { VStoreProfileService } from './v-store-profile.service';

export interface InvoiceData {
  products: any[];
  customer: any;
  total: number;
  totalPayed: number;
  totalDiscount: number;
  totalReturn: number;
  payedItems: any[];
}

@Injectable({
  providedIn: 'root',
})
export class VInvoiceService {
  constructor(private readonly profileSvc: VStoreProfileService) {}

  generate(data: InvoiceData): string {
    const now = new Date();
    const locale = this.profileSvc.getLocale();
    const dateStr = now.toLocaleDateString(locale);
    const timeStr = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

    const currencySymbol = this.profileSvc.getCurrencySymbol();
    const businessName = this.profileSvc.getBusinessName() || 'Codigo Casero';
    const address = this.profileSvc.getAddress() || 'Cochabamba Bolivia, Times St 1414';
    const taxLabel = this.profileSvc.getTaxLabel();
    const taxId = this.profileSvc.getTaxId();

    const receiptConfig = this.profileSvc.getReceiptConfig();
    const paperWidth = receiptConfig.paperWidth || 80;
    const headerLines = receiptConfig.headerLines || [];
    const footerLines = receiptConfig.footerLines?.length
      ? receiptConfig.footerLines
      : ['Quality software developed by experienced developers.', 'Thank you for your purchase!'];

    const productRows = data.products
      .map(
        (p) => `
          <tr>
            <td class="qty">${p.quantity}${p.unitLabel ? ' ' + p.unitLabel : ''}</td>
            <td class="desc">${p.Product?.name ?? p.name ?? ''}</td>
            <td class="price">${roundToCents(p.currentPrice).toFixed(2)}</td>
            <td class="total">${roundToCents(Number(p.quantity) * Number(p.currentPrice)).toFixed(2)}</td>
          </tr>`
      )
      .join('');

    const paymentLines = data.payedItems
      .map((p) => {
        const label =
          p.payType === PaymentType.PAYQR ? 'QR' : p.payType === PaymentType.PAYMONEY ? 'Cash' : '';
        return `
          <tr>
            <td colspan="3">${label}</td>
            <td class="total">${roundToCents(p.value).toFixed(2)}</td>
          </tr>`;
      })
      .join('');

    const customerName = data.customer?.name ?? '';
    const customerId = data.customer?.ci ?? data.customer?.code ?? '';

    const taxLine = taxId ? `${taxLabel}: ${taxId}` : `${taxLabel}: —`;

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Invoice</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    width: ${paperWidth}mm;
    padding: 10px 15px;
    color: #222;
  }
  .center { text-align: center; }
  .header { margin-bottom: 8px; }
  .header h2 { font-size: 16px; margin-bottom: 2px; }
  .header p { font-size: 11px; color: #555; line-height: 1.4; }
  .header-extra { font-size: 10px; color: #666; line-height: 1.3; }
  .invoice-title { font-size: 14px; font-weight: bold; margin: 6px 0; }
  hr { border: none; border-top: 1px dashed #999; margin: 6px 0; }
  .info-line { font-size: 11px; margin: 2px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { text-align: left; border-bottom: 1px solid #222; padding: 3px 2px; }
  td { padding: 3px 2px; vertical-align: top; }
  .qty, .price, .total { text-align: right; width: 15%; }
  .desc { text-align: left; }
  .total-col { text-align: right; width: 20%; }
  .totals table { margin-top: 2px; }
  .totals td:first-child { text-align: right; font-weight: bold; padding-right: 8px; }
  .totals td:last-child { text-align: right; }
  .grand-total { font-size: 14px; font-weight: bold; }
  .footer { text-align: center; margin-top: 10px; font-size: 10px; color: #888; }
  @media print {
    @page { margin: 0; size: ${paperWidth}mm auto; }
    body { width: auto; }
  }
</style>
</head>
<body>
  <div class="center header">
    <h2>${businessName}</h2>
    <p>${address}<br>${taxLine}</p>
    ${headerLines.map(l => `<p class="header-extra">${l}</p>`).join('\n    ')}
  </div>
  <hr>
  <div class="center invoice-title">INVOICE</div>
  <div class="info-line">Date: ${dateStr} ${timeStr}</div>
  <div class="info-line">${customerName ? `Customer: ${customerName}` : ''}${customerId ? ` (ID: ${customerId})` : ''}</div>
  <hr>
  <table>
    <thead>
      <tr><th class="qty">Qty</th><th class="desc">Product</th><th class="price">Price</th><th class="total">Total</th></tr>
    </thead>
    <tbody>
      ${productRows}
    </tbody>
  </table>
  <hr>
  <div class="totals">
    <table>
      <tr><td>Total</td><td class="total-col">${data.total.toFixed(2)}</td></tr>
      ${data.totalDiscount > 0 ? `<tr><td>Discount</td><td class="total-col">\u2212${data.totalDiscount.toFixed(2)}</td></tr>` : ''}
    </table>
    <hr>
    <table>
      <tr class="grand-total"><td>Net Total</td><td class="total-col">${roundToCents(data.total - data.totalDiscount).toFixed(2)}</td></tr>
    </table>
    <hr>
    <table>
      <tr><td>Paid</td><td class="total-col">${data.totalPayed.toFixed(2)}</td></tr>
      ${data.totalReturn > 0 ? `<tr><td>Change</td><td class="total-col">\u2212${data.totalReturn.toFixed(2)}</td></tr>` : ''}
      <tr><td>Amount paid</td><td class="total-col">${roundToCents(data.totalPayed - data.totalReturn).toFixed(2)}</td></tr>
    </table>
    ${paymentLines ? `<hr><table><tbody>${paymentLines}</tbody></table>` : ''}
  </div>
  <hr>
  <div class="footer">
    ${footerLines.map(l => `<p>${l}</p>`).join('\n    ')}
  </div>
</body>
</html>`;
  }
}
