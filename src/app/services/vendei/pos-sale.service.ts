import { Injectable } from '@angular/core';
import { concatMap, forkJoin, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { PaymentType } from '../../features/vendei/payment-types';
import { roundToCents } from '../../utils/money';

import { VInventoryService } from './v-inventory.service';
import { VOrdersService } from './v-orders.service';
import { VStoreProfileService } from './v-store-profile.service';

/** A line on the open ticket. Shape matches what the POS catalog emits. */
export interface TicketLine {
  quantity: number;
  currentPrice: number;
  productId?: unknown;
  variantId?: unknown;
  unitLabel?: string;
  Product?: { id: unknown };
  id?: unknown;
}

/** A payment / discount / return entry on the open ticket. */
export interface PaymentLine {
  payType: PaymentType;
  value: number;
}

export interface SaleDraft {
  customerId: number | null;
  lines: TicketLine[];
  payments: PaymentLine[];
  total: number;
  totalDiscount: number;
  totalReturn: number;
}

export interface OrderPayload {
  customerId: number | null;
  createdDate: Date;
  total: number;
  description: string;
  paid: boolean;
  delivered: boolean;
  deliveryDate: Date;
  paidCash: number;
  paidQr: number;
  totalDiscount: number;
  totalReturn: number;
  storeProfileId?: number;
}

export interface OrderDetailPayload {
  quantity: number;
  currentPrice: number;
  discount: number;
  totalPrice: number;
  productId: unknown;
  orderId: string;
  createdDate?: Date;
  productVariantId?: unknown;
  unitLabel?: string;
}

/**
 * The "sell something" use case.
 *
 * Owns order assembly and the persistence pipeline so the POS component is
 * left with presentation concerns only. The pipeline is deliberately unchanged:
 *
 *   POST /orders
 *     → for each line: POST /orderDetails
 *         → reduceInventory + updateTotalSelled + updateQuantitySelled
 *
 * Note the pipeline is **not** atomic — each step is a separate request. Making
 * it a single server-side transaction belongs to the backend (see
 * `docs/architecture/target-architecture.md`); the backend currently works
 * around the fan-out by serialising SQLite writes.
 */
@Injectable({ providedIn: 'root' })
export class PosSaleService {
  constructor(
    private readonly ordersSvc: VOrdersService,
    private readonly inventorySvc: VInventoryService,
    private readonly profileSvc: VStoreProfileService
  ) {}

  /** Build the order header and its detail lines from the open ticket. */
  buildOrderAndDetails(draft: SaleDraft): { order: OrderPayload; details: OrderDetailPayload[] } {
    const order: OrderPayload = {
      customerId: draft.customerId,
      createdDate: new Date(),
      total: roundToCents(draft.total),
      description: '',
      paid: true,
      delivered: true,
      deliveryDate: new Date(),
      paidCash: roundToCents(sumPaymentType(draft.payments, PaymentType.PAYMONEY)),
      paidQr: roundToCents(sumPaymentType(draft.payments, PaymentType.PAYQR)),
      totalDiscount: roundToCents(draft.totalDiscount),
      totalReturn: roundToCents(draft.totalReturn),
    };

    const activeProfileId = this.profileSvc.getActiveProfileId();
    if (activeProfileId != null) {
      order.storeProfileId = activeProfileId;
    }

    const details: OrderDetailPayload[] = draft.lines.map((line) => {
      const detail: OrderDetailPayload = {
        quantity: line.quantity,
        currentPrice: roundToCents(line.currentPrice),
        discount: 0,
        totalPrice: roundToCents(Number(line.quantity) * Number(line.currentPrice)),
        productId: line.productId ?? line.Product?.id ?? line.id,
        orderId: '0',
      };
      if (line.variantId) {
        detail.productVariantId = line.variantId;
      }
      if (line.unitLabel) {
        detail.unitLabel = line.unitLabel;
      }
      return detail;
    });

    return { order, details };
  }

  /**
   * Persist the sale: order, then every line, then the inventory mutations for
   * that line. Completes once every stock update has been acknowledged.
   */
  submit(draft: SaleDraft): Observable<void> {
    const { order, details } = this.buildOrderAndDetails(draft);

    return this.ordersSvc.save(order).pipe(
      map((saved) => {
        for (const detail of details) {
          detail.orderId = (saved as { id?: unknown })?.id as string;
          detail.createdDate = (saved as { createdDate?: Date })?.createdDate;
        }
        return details;
      }),
      concatMap((savedDetails) =>
        details.length ? forkJoin(savedDetails.map((detail) => this.persistDetail(detail))) : of([] as unknown[])
      ),
      map(() => undefined)
    );
  }

  private persistDetail(detail: OrderDetailPayload): Observable<unknown> {
    const productId = String(detail.productId);
    return this.ordersSvc
      .saveDetail(detail)
      .pipe(
        concatMap(() =>
          forkJoin([
            this.inventorySvc.reduceInventory(productId, detail.quantity),
            this.inventorySvc.updateTotalSelled(productId, detail.totalPrice),
            this.inventorySvc.updateQuantitySelled(productId, detail.quantity),
          ])
        )
      );
  }
}

function sumPaymentType(payments: PaymentLine[], payType: PaymentType): number {
  return payments.filter((p) => p.payType === payType).reduce((sum, p) => sum + (p.value || 0), 0);
}
