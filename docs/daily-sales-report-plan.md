# Daily Sales Report — Implementation Plan

## Problem

The POS records payments as **Cash** (`PAYMONEY`) or **QR** (`PAYQR`) during checkout, but this breakdown is **never saved to the database**. Once the order is submitted, the payment method data is lost. There is no way to answer:

> *How much entered the bank account (QR) vs how much is in cash today?*

## Current State

| Aspect | Current behavior |
|--------|-----------------|
| Payment tracking | `payedItems[]` holds `{value, payType}` in-memory only (`payType`: 1=Cash, 4=QR) |
| Order save | Sends `{customerId, total, paid, delivered, ...}` — no payment breakdown |
| Orders table | No column for payment method, `paidCash`, or `paidQr` |
| Existing reports | `RepSellsComponent` shows line-item sales by date range but no payment split |
| `RepOrdersComponent` | Stub exists at `src/app/pages/rep/rep-orders/` but not routed |

---

## Implementation Plan

### Phase 1 — Backend: Store payment breakdown

#### 1.1 Database migration

Create a new migration file in `inventory-nod/migrations/`:

**`20260701120000-add-payments-to-orders.js`**

Add columns to the `Orders` table:

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `paidCash` | FLOAT | `0` | Total cash received for this order |
| `paidQr` | FLOAT | `0` | Total QR received for this order |
| `totalDiscount` | FLOAT | `0` | Discount amount |
| `totalReturn` | FLOAT | `0` | Change returned |

#### 1.2 Update order model

**File**: `inventory-nod/models/order.js`

Add the four new fields to the `Order.init()` definition.

#### 1.3 Update order controller

**File**: `inventory-nod/controllers/orders.js`

Update `pickOrderBody()` to include:
- `paidCash`: from `req.body.paidCash`
- `paidQr`: from `req.body.paidQr`
- `totalDiscount`: from `req.body.totalDiscount`
- `totalReturn`: from `req.body.totalReturn`

#### 1.4 Add daily summary endpoint

**File**: `inventory-nod/controllers/orders.js`

Add a new controller method:

```
GET /orders/today-summary
```

Returns:
```json
{
  "date": "2026-07-01",
  "orderCount": 42,
  "totalSales": 1250.50,
  "totalCash": 800.00,
  "totalQr": 450.50,
  "totalDiscount": 25.00,
  "totalReturn": 30.00
}
```

Implementation:
```javascript
exports.todaySummary = async function (req, res, next) {
  const Op = require('sequelize').Op;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const rows = await Order.findAll({
    where: {
      createdAt: { [Op.gte]: today, [Op.lt]: tomorrow },
      paid: true,
    },
  });

  const summary = rows.reduce(
    (acc, o) => {
      acc.orderCount++;
      acc.totalSales += Number(o.total) || 0;
      acc.totalCash += Number(o.paidCash) || 0;
      acc.totalQr += Number(o.paidQr) || 0;
      acc.totalDiscount += Number(o.totalDiscount) || 0;
      acc.totalReturn += Number(o.totalReturn) || 0;
      return acc;
    },
    { orderCount: 0, totalSales: 0, totalCash: 0, totalQr: 0, totalDiscount: 0, totalReturn: 0 }
  );

  summary.date = today.toISOString().split('T')[0];
  summary.netCash = summary.totalCash - summary.totalReturn;
  res.json(summary);
};
```

#### 1.5 Register route

**File**: `inventory-nod/routes/orders.js`

Add `router.get('/today-summary', ordersCtrl.todaySummary);`

---

### Phase 2 — Frontend: Save payment breakdown

#### 2.1 Update `pos-checkout.component.ts`

**File**: `src/app/pages/vendei/shopping-cart/pos-checkout.component.ts`

Modify `buildOrderAndDetails()` to compute payment breakdown from `payedItems`:

```typescript
buildOrderAndDetails() {
  const { order, details } = this.buildOrderAndDetails();
  
  // Compute payment breakdown
  const cashTotal = this.payedItems
    .filter(p => p.payType === PaymentType.PAYMONEY)
    .reduce((sum, p) => sum + (p.value || 0), 0);
  const qrTotal = this.payedItems
    .filter(p => p.payType === PaymentType.PAYQR)
    .reduce((sum, p) => sum + (p.value || 0), 0);
  
  order.paidCash = roundToCents(cashTotal);
  order.paidQr = roundToCents(qrTotal);
  order.totalDiscount = roundToCents(this.totalDiscount);
  order.totalReturn = roundToCents(this.totalReturn);
  
  return { order, details };
}
```

#### 2.2 Create `VOrdersService.getTodaySummary()` method

**File**: `src/app/services/vendei/v-orders.service.ts` (or a new service)

Add:
```typescript
getTodaySummary(): Observable<any> {
  return this.http.get(`${this.ordersUrl()}/today-summary`);
}
```

---

### Phase 3 — Frontend: Daily sales report page

#### 3.1 Create `RepDailySalesComponent`

**Files**:
- `src/app/pages/rep/rep-daily-sales/rep-daily-sales.component.ts`
- `src/app/pages/rep/rep-daily-sales/rep-daily-sales.component.html`
- `src/app/pages/rep/rep-daily-sales/rep-daily-sales.component.css`

**Component structure**:

```
┌─────────────────────────────────────────┐
│  Daily Sales Report — 01/07/2026       │
├─────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │Orders│ │Sales │ │ Cash │ │ QR   │  │
│  │  42  │ │1250.5│ │800.00│ │450.50│  │
│  └──────┘ └──────┘ └──────┘ └──────┘  │
├─────────────────────────────────────────┤
│  ┌─ Cash vs QR (bar chart) ──────────┐ │
│  │  ████████████████████  800.00 Cash│ │
│  │  ██████████          450.50 QR    │ │
│  └───────────────────────────────────┘ │
├─────────────────────────────────────────┤
│  Summary                                │
│  ─────────────────────────────────────  │
│  Net sales (after discounts): 1225.50   │
│  Total collected:             1250.50   │
│  Change given:                  30.00   │
│  Net deposit (QR):             450.50   │
│  Net cash:                     770.00   │
│  ─────────────────────────────────────  │
│  Expected bank deposit: Bs 450.50      │
│  Cash in drawer:            Bs 770.00   │
└─────────────────────────────────────────┘
```

**Key features**:
- KPI cards: Order count, Total sales, Total cash, Total QR
- Bar chart comparing cash vs QR (use Chart.js like existing reports)
- Summary section showing net figures
- Auto-refreshes on page load
- Date display for current day

#### 3.2 Create `RepDailySalesService`

**File**: `src/app/services/rep/rep-daily-sales.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class RepDailySalesService {
  constructor(private http: HttpClient, private configSvc: RepConfigService) {}
  
  getTodaySummary(): Observable<any> {
    return this.http.get(`${this.configSvc.baseUrl}/orders/today-summary`);
  }
}
```

---

### Phase 4 — Routing & Navigation

#### 4.1 Register component in `app.module.ts`

Add import for `RepDailySalesComponent` and add to `declarations`.

#### 4.2 Add route

In the `appRoutes` array in `app.module.ts`:
```typescript
{ path: 'rep/daily-sales', component: RepDailySalesComponent },
```

#### 4.3 Update main hub navigation

**File**: `src/app/pages/main/main.component.ts`

Add a new tile to the "Reports" section:
```typescript
{
  title: 'Daily sales',
  description: 'Today cash vs QR breakdown',
  path: '/rep/daily-sales',
  matIcon: 'payments',
},
```

---

### Phase 5 — Testing

| Test area | Description |
|-----------|-------------|
| `RepDailySalesService` | Mock HTTP call, verify returns summary |
| `RepDailySalesComponent` | Test rendering with mock data, verify KPI values |
| Backend `/today-summary` | Test aggregation with seeded orders |
| Migration | Test up/down rollback |
| POS save | Verify `paidCash`/`paidQr` are sent with order |

---

## Files Summary

| File | Action |
|------|--------|
| `inventory-nod/migrations/20260701120000-add-payments-to-orders.js` | **Create** — migration |
| `inventory-nod/models/order.js` | **Modify** — add new fields |
| `inventory-nod/controllers/orders.js` | **Modify** — update `pickOrderBody`, add `todaySummary` |
| `inventory-nod/routes/orders.js` | **Modify** — add route |
| `src/app/pages/vendei/shopping-cart/pos-checkout.component.ts` | **Modify** — add payment breakdown to order |
| `src/app/services/rep/rep-daily-sales.service.ts` | **Create** — daily summary service |
| `src/app/pages/rep/rep-daily-sales/rep-daily-sales.component.ts` | **Create** — component logic |
| `src/app/pages/rep/rep-daily-sales/rep-daily-sales.component.html` | **Create** — template |
| `src/app/pages/rep/rep-daily-sales/rep-daily-sales.component.css` | **Create** — styles |
| `src/app/pages/rep/rep-daily-sales/rep-daily-sales.component.spec.ts` | **Create** — tests |
| `src/app/app.module.ts` | **Modify** — register component, add route |
| `src/app/pages/main/main.component.ts` | **Modify** — add nav tile |

---

## Edge Cases

| Case | Handling |
|------|----------|
| No orders today | Show zeros, no chart |
| Partial payments | `paidCash` + `paidQr` may not equal `total` if the order isn't fully paid (but `isOrderPaid` gate prevents submission) |
| Discounts > 0 | `totalDiscount` is stored and reflected in net figures |
| Change/return given | `totalReturn` is stored and deducted from cash |
| Mixed payment (Cash + QR) | Both `paidCash` and `paidQr` are populated; component shows both |
| Backend not migrated | `paidCash`/`paidQr` will default to `null` → summary returns 0 — safe fallback |
