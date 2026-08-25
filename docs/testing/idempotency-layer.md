# Idempotency Layer: POS Checkout Recommendations

## Problem

The current `PosCheckoutComponent.saveOrder()` fires a sequence of HTTP calls:

1. `ordersSvc.save(order)` — creates the order row
2. For each product:
   - `ordersSvc.saveDetail(d)` — order line
   - `inventorySvc.reduceInventory(...)` — stock decrement
   - `inventorySvc.updateTotalSelled(...)` — revenue counter
   - `inventorySvc.updateQuantitySelled(...)` — units counter

If the user double-clicks "Submit" or the network retries after a timeout,
the **same order can be created twice** with duplicate inventory mutations.

## Current Mitigations

| Layer | Protection | Status |
|-------|-----------|--------|
| **Frontend** | `printOrderCount` lock blocks re-entry during print flow | Partial — does not cover non-print path |
| **Frontend** | Button disabled while `saveOrder$` observable is in-flight | **Not implemented** |
| **Backend** | No unique constraint on `(customerId, createdDate)` | Not implemented |
| **Backend** | No idempotency-key header support | Not implemented |

## Recommended Idempotency Architecture

### 1. Frontend: Disable submit button during in-flight request

```typescript
isSubmitting = false;

submitOrder() {
  if (this.isSubmitting) return;
  this.isSubmitting = true;
  this.saveOrder().subscribe({
    complete: () => { this.isSubmitting = false; },
    error: () => { this.isSubmitting = false; },
  });
}
```

### 2. Frontend: Generate client-side idempotency key

```typescript
const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
headers = headers.set('X-Idempotency-Key', idempotencyKey);
```

### 3. Backend: Store idempotency key per order

```sql
ALTER TABLE orders ADD COLUMN idempotency_key VARCHAR(64) UNIQUE;
```

On duplicate key, return the existing order instead of creating a new one.

### 4. Backend: Database transaction wrapping

Wrap order + detail + inventory mutations in a single `BEGIN ... COMMIT`
transaction. If any step fails, all mutations roll back.

## Implementation Priority

1. **High**: Disable submit button while saving (frontend-only, immediate win)
2. **High**: Wrap backend mutations in a DB transaction
3. **Medium**: Add idempotency-key header support
4. **Low**: Unique constraint on `(customerId, createdDate)` — too restrictive for
   walk-in customers

## Testing

The existing test suite in `pos-checkout.failure.spec.ts` covers double-checkout
scenarios by verifying that duplicate order creation results in double inventory
reduction (the current bug). Once idempotency is implemented, these tests should
be updated to verify that duplicate calls return the same order.
