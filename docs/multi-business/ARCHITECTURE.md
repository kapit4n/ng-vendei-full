# Multi-Business Architecture

## Target Architecture

```text
                         VENDEI PLATFORM
                               |
              +----------------+----------------+
              |                                 |
       Commerce Engine                    Business Profile
              |                                 |
      +-------+--------+             +----------+----------+
      |       |        |             |          |          |
     POS   Inventory  Sales       Template   Features   Settings
      |       |        |
      +-------+--------+
              |
        Product Engine
              |
       +------+------+------+
       |      |      |      |
     Units Variants Attributes Presentations
```

## Business Profile Model

```text
BusinessProfile
      |
      +-- id: number
      +-- name: string
      +-- slug: string
      +-- description: string
      +-- active: boolean
      +-- defaultProfile: boolean
      |
      +-- businessType: string          (NEW)
      +-- capabilities: string[]        (NEW)
      +-- currency: string              (NEW)
      +-- currencySymbol: string        (NEW)
      +-- locale: string                (NEW)
      +-- taxId: string                 (NEW)
      +-- address: string               (NEW)
      +-- businessName: string          (NEW)
      +-- receiptConfig: object         (NEW)
      +-- posConfig: object             (NEW)
```

## Entity Relationship

```text
BusinessProfile (1) ──── filters ────> (N) ProductPresentation
BusinessProfile (1) ──── filters ────> (N) Category
BusinessProfile (1) ──── owns ────> (N) Order           (NEW relationship)
BusinessProfile (1) ──── has ────> (N) Capability       (NEW)

Category (1) <──── (N) Product
                        |
                        | productId
                        v
              ProductPresentation ──── unitOfMeasureId ────> UnitOfMeasure
              (sellable variant)
                        |
                        | attributes (NEW)
                        v
              ProductVariant (NEW)
                        |
                        +-- ProductAttributeValue (NEW)
                              |
                              +-- ProductAttributeDefinition (NEW)

                    OrderDetail ───── productId ────> Product
                        |
                        | orderId
                        v
                      Order ───── customerId ────> Customer
                      Order ───── storeProfileId ────> BusinessProfile  (NEW)

                    Order (1) ───── (N) OrderDetail

Product (1) ───── (N) InventoryLot     (lot-level stock, optional FEFO)
Product (1) ───── (N) PurchaseItem     (receipt records)
```

## Current Architecture (As-Is)

### StoreProfile (existing)

```typescript
interface StoreProfile {
  id: number;
  name: string;
  slug: string;
  description: string;
  active: boolean;
  defaultProfile: boolean;
}
```

**Usage:** Filters products and categories via `?storeProfileId=X` query parameter.
**Gap:** Not on orders, customers, reports, or inventory.

### Product (existing)

```typescript
interface IProduct {
  id: string;
  name: string;
  code: string;
  price: number;
  cost: number;
  img: string;
  description: string;
  categoryId: string;
  stock: number;
  UnitOfMeasures?: IUnitOfMeasure[];
  unitOfMeasureIds?: (string | number)[];
  trackExpiry?: boolean;
  defaultShelfLifeDays?: number | null;
}
```

### ProductPresentation (existing)

```typescript
interface IProductPresentation {
  id: string;
  code: string;
  currentPrice: number;
  img: string;
  unitOfMeasure: string;
  unitOfMeasureId?: string | number | null;
  productId: string;
  quantity: number;
  brand: string;
}
```

**Role:** The sellable variant. The POS fetches presentations, not raw products.

### Category (existing)

```typescript
interface ICategory {
  id?: number | string;
  name: string;
  description: string;
  img: string;
  code: string;
}
```

### UnitOfMeasure (existing)

```typescript
interface IUnitOfMeasure {
  id: string | number;
  code: string;
  name: string;
}
```

### Order (existing)

```typescript
// Built in PosCheckoutComponent.buildOrderAndDetails()
order = {
  id: undefined,
  customerId: number,
  createdDate: Date,
  total: number,
  description: string,
  paid: true,
  delivered: true,
  deliveryDate: Date,
  paidCash: number,
  paidQr: number,
  totalDiscount: number,
  totalReturn: number,
  // MISSING: storeProfileId
}
```

### OrderDetail (existing)

```typescript
detail = {
  quantity: number,
  currentPrice: number,
  discount: number,
  totalPrice: number,
  productId: string,
  orderId: "0",
  createdDate: Date,
}
```

### Customer (existing)

```typescript
interface ICustomer {
  id?: string | number;
  name: string;
  code: string;
  address: string;
}
```

### PaymentType (existing)

```typescript
enum PaymentType {
  PAYMONEY = 1,    // Cash
  PAYRETURN = 2,   // Change/return
  DISCOUNT = 3,    // Discount
  PAYQR = 4,       // QR payment (Bolivia-specific)
}
```

## Target Architecture (To-Be)

### BusinessProfile (extended from StoreProfile)

```typescript
interface BusinessProfile extends StoreProfile {
  // Business identity
  businessType: string;        // 'supermarket' | 'chicken' | 'butcher' | etc.
  businessName: string;        // Display name for invoices/receipts
  
  // Localization
  currency: string;            // 'BOB', 'USD', 'EUR'
  currencySymbol: string;      // 'Bs', '$', '€'
  locale: string;              // 'es-BO', 'en-US'
  
  // Legal/tax
  taxId: string;               // NIT, EIN, VAT number
  taxLabel: string;            // 'NIT', 'EIN', 'RFC', etc.
  address: string;             // Business address for receipts
  
  // Capabilities
  capabilities: string[];      // ['BARCODE', 'WEIGHT', 'LOTS', 'VARIANTS']
  
  // Receipt configuration
  receiptConfig: {
    paperWidth: number;        // 58, 80 (mm)
    logo?: string;             // URL/path to logo
    headerLines: string[];     // Custom header text
    footerLines: string[];     // Custom footer text
  };
  
  // POS configuration
  posConfig: {
    catalogColumns: number;    // Grid columns
    showProductImages: boolean;
    quickProducts: number[];   // Product IDs for quick access
    defaultSellingMode: string;
  };
}
```

### ProductAttributeDefinition (new)

```typescript
interface ProductAttributeDefinition {
  id: string;
  name: string;                // 'Size', 'Color', 'Portion', etc.
  code: string;                // 'SIZE', 'COLOR', 'PORTION'
  type: string;                // 'text', 'number', 'select'
  options?: string[];          // For 'select' type: ['S', 'M', 'L', 'XL']
  businessType: string;        // Which business type this belongs to
}
```

### ProductAttributeValue (new)

```typescript
interface ProductAttributeValue {
  id: string;
  attributeDefinitionId: string;
  productId: string;
  value: string;               // 'XL', 'Black', 'Breast', etc.
}
```

### ProductVariant (new)

```typescript
interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  barcode?: string;
  price: number;
  attributeValues: ProductAttributeValue[];
}
```

### Capability (new)

```typescript
interface Capability {
  id: string;
  name: string;
  description: string;
  category: string;            // 'inventory', 'selling', 'checkout', 'reporting'
}
```

### SellingMode (new concept, not necessarily a table)

```typescript
type SellingMode = 'UNIT' | 'WEIGHT' | 'VARIABLE_QTY' | 'VARIANT' | 'COMBO';
```

## Frontend/Backend Responsibilities

### Frontend (this repo)

- Business profile management UI
- Profile-aware catalog display
- Profile-aware POS checkout
- Capability-gated UI elements
- Variant selection UI
- Configurable receipt generation

### Backend (inventory-nod repo)

- Business profile CRUD API
- Profile-scoped product/category queries
- Profile-scoped order creation
- Attribute/variant CRUD API
- Template application API
- Profile-aware reporting

## Hardcoded Assumptions to Address

| Assumption | Current Location | Migration Strategy |
|-----------|-----------------|-------------------|
| Currency `Bs` | `rep-sells.component.ts`, `rep-products.component.ts` | Read from BusinessProfile.currencySymbol |
| Location `Cochabamba Bolivia` | `v-invoice.service.ts:92`, `pos-checkout.component.ts:112` | Read from BusinessProfile.address |
| Business name `Codigo Casero` | `v-invoice.service.ts:91`, `pos-checkout.component.ts:109` | Read from BusinessProfile.businessName |
| Anonymous customer `id: 1` | `pos-checkout.component.ts:31` | Make configurable per profile or use sentinel value |
| Locale `es-ES` | `v-invoice.service.ts:21`, `pos-checkout.component.ts:113` | Read from BusinessProfile.locale |
| Payment types Cash+QR | `payment-types.ts` | Extend with profile-enabled payment methods |
| Tax ID `NIT: --` | `v-invoice.service.ts:92` | Read from BusinessProfile.taxId/taxLabel |
| Printer 80mm | `v-invoice.service.ts:61`, `pos-checkout.component.ts:146` | Read from BusinessProfile.receiptConfig.paperWidth |
| Print logo path | `pos-checkout.component.ts:108` | Read from BusinessProfile.receiptConfig.logo |
