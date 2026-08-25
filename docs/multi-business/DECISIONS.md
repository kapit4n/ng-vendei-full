# Architectural Decision Records

## ADR-MB-001 — Extend StoreProfile into BusinessProfile

**Date:** 2026-08-25

**Context:**
The existing StoreProfile model acts as a soft tenant, filtering products and categories via query parameters. It has 6 fields: id, name, slug, description, active, defaultProfile. We need to evolve it to support multi-business configuration without breaking existing data.

**Decision:**
Extend StoreProfile in-place rather than creating a separate BusinessProfile entity. The existing `storeProfiles` API endpoint and `?storeProfileId=X` query parameter pattern are preserved. New fields are additive.

**Alternatives Considered:**
1. Create a new `BusinessProfile` table with FK to StoreProfile — adds join complexity
2. Replace StoreProfile entirely — breaks existing data and API contracts
3. Extend StoreProfile in-place — additive, backward-compatible

**Reason:**
Option 3 is the only approach that guarantees zero breaking changes. Existing store profiles continue working with default values for new fields. The API endpoint, query parameter, and localStorage key all remain unchanged.

**Consequences:**
- Existing store profiles get null/empty values for new fields (businessType, capabilities, etc.)
- A migration/default-value strategy is needed for existing records
- The frontend service (`VStoreProfileService`) needs type extension, not replacement

**Status:** ACCEPTED

---

## ADR-MB-002 — Product Attributes via Definition/Value Pattern

**Date:** 2026-08-25

**Context:**
Different business types need different product attributes (clothing needs Size/Color, chicken needs Portion/Preparation, hardware needs Brand/Voltage). We need a flexible system without creating separate tables per business.

**Decision:**
Use a three-table pattern: `ProductAttributeDefinition` (what attributes exist), `ProductAttributeValue` (what value a product has for an attribute), and `ProductVariant` (a sellable combination of attribute values).

**Alternatives Considered:**
1. JSON column on Product — loses queryability and validation
2. EAV (Entity-Attribute-Value) only — no variant support
3. Separate tables per business type — defeats the purpose of generic platform
4. Definition/Value/Variant pattern — flexible, queryable, supports variants

**Reason:**
Option 4 supports all use cases: simple attributes (product has a color), variant selection (T-Shirt XL Black), and POS filtering (show only Size XL). It's a proven pattern used by Shopify, WooCommerce, and other commerce platforms.

**Consequences:**
- Three new database tables needed
- Backend API for attribute CRUD
- Frontend attribute management UI
- POS needs variant selection flow

**Status:** ACCEPTED

---

## ADR-MB-003 — Capabilities as String Array on Profile

**Date:** 2026-08-25

**Context:**
We need a way to control which POS features are enabled per business type. A butcher needs weight-based selling; a clothing store needs variant selection; a supermarket needs barcode scanning.

**Decision:**
Store capabilities as a `string[]` array directly on the BusinessProfile. Each capability is a string constant like `'BARCODE'`, `'WEIGHT'`, `'VARIANTS'`. The frontend checks `profile.capabilities.includes('WEIGHT')` to show/hide features.

**Alternatives Considered:**
1. Separate Capability table with join — more normalized but adds query complexity
2. BusinessType table with default capabilities — adds indirection
3. String array on profile — simple, direct, easy to query

**Reason:**
Option 3 is the simplest approach that meets requirements. Capabilities are stable constants (not user-generated data), so a string array is appropriate. The backend can validate against an enum. The frontend can check inclusion efficiently.

**Consequences:**
- New business types are created by setting the right capabilities
- No separate capability management UI needed initially
- Capabilities can be migrated to a separate table later if needed

**Status:** ACCEPTED

---

## ADR-MB-004 — Add storeProfileId to Orders

**Date:** 2026-08-25

**Context:**
Currently, orders have no `storeProfileId` field. This means we cannot attribute sales to a specific business, cannot filter reports by business, and cannot isolate inventory per business.

**Decision:**
Add `storeProfileId` as a required field on the Order model. The frontend populates it from the active profile at checkout time. Existing orders get a default profile ID via migration.

**Alternatives Considered:**
1. Make it optional — preserves existing data but loses attribution
2. Make it required — forces migration but ensures data integrity
3. Add it as optional with a default — compromise approach

**Reason:**
Option 3 (optional with default) is the safest approach for backward compatibility. Existing orders continue working. New orders get the active profile ID. A future migration can backfill.

**Consequences:**
- Backend needs to accept storeProfileId on order creation
- Reports can filter by business profile
- Inventory can be scoped per profile (future)
- Migration script needed for existing orders

**Status:** ACCEPTED

---

## ADR-MB-005 — Configuration over Business-Specific Code

**Date:** 2026-08-25

**Context:**
The temptation exists to create `if (businessType === 'CHICKEN') { ... }` logic. This must be avoided.

**Decision:**
All business-specific behavior is controlled through configuration: capabilities, attributes, selling modes, POS config, receipt config. The POS engine is generic and reads configuration from the active BusinessProfile.

**Alternatives Considered:**
1. Strategy pattern with business-specific implementations — over-engineered
2. Plugin system — too complex for this scale
3. Configuration-driven behavior — simple, extensible, testable

**Reason:**
Option 3 aligns with the principle that adding a new business type should be a configuration task, not a development task. The POS engine checks capabilities and config, not business type strings.

**Consequences:**
- New business types are added via database records, not code changes
- POS components read config to determine behavior
- Testing covers config combinations, not business type permutations

**Status:** ACCEPTED

---

## ADR-MB-006 — Migration Strategy for Existing Data

**Date:** 2026-08-25

**Context:**
Existing StoreProfiles, Products, Categories, and Orders need to work correctly after the schema extension. The migration must not lose data and must assign sensible defaults.

**Decision:**
Apply a three-layer migration strategy:

1. **Schema extension** — Add all new columns as nullable with SQL `DEFAULT` values. Existing rows automatically get defaults via the database engine.
2. **Backfill** — UPDATE existing rows to set explicit business config defaults (businessType: 'supermarket', currency: 'BOB', etc.) for rows where the new columns are NULL.
3. **Frontend fallback** — `VStoreProfileService` helper methods return hardcoded defaults when profile fields are undefined/null, ensuring the UI works even if the backend hasn't been migrated yet.

**Defaults Applied:**

| Field | Default | Rationale |
|-------|---------|-----------|
| businessType | `'supermarket'` | Preserves current behavior |
| businessName | `null` | Falls back to `name` field |
| currency | `'BOB'` | Current hardcoded currency |
| currencySymbol | `'Bs'` | Current hardcoded symbol |
| locale | `'es-BO'` | Current hardcoded locale |
| taxId | `null` | No default — business-specific |
| taxLabel | `'NIT'` | Current hardcoded label |
| address | `null` | No default — business-specific |
| capabilities | `["BARCODE","DISCOUNTS","CUSTOMERS"]` | Minimum safe set |
| receiptConfig | `{paperWidth:80, headerLines:[], footerLines:[]}` | Standard receipt |
| posConfig | `{catalogColumns:4, showProductImages:true, quickProducts:[], defaultSellingMode:'UNIT'}` | Current POS layout |

**Rollback Strategy:**
- Migration `down()` drops all 11 columns in reverse order
- No data loss since columns are additive (nullable)
- Original 6 columns are untouched

**Alternatives Considered:**
1. Nullable without defaults — simpler but UI breaks for existing profiles
2. Required with migration — forces data entry, risky for existing deployments
3. Nullable with SQL DEFAULT + backfill — safe, backward-compatible

**Reason:**
Option 3 is the safest approach. The SQL DEFAULT handles the schema change instantly. The backfill ensures existing rows have meaningful values. The frontend fallback ensures the UI works even if the backend is temporarily out of sync.

**Consequences:**
- Existing profiles get supermarket defaults automatically
- New profiles can be created with any business type
- No user intervention required for existing data
- Frontend and backend can be deployed independently (frontend first is safe)

**Status:** ACCEPTED
