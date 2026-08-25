# Multi-Business Progress

Last Updated: 2026-08-25

Current Phase: Phase 1

Current Task: MB-007 (Backend — separate repo) / MB-009 (Migration)

Overall Progress: 45%

## Completed

- MB-001: Baseline Architecture Analysis
- MB-002: Run Test Suite and Record Baseline
- MB-003: Document Hardcoded Business Assumptions
- MB-004: Extend StoreProfile Interface with Business Configuration
- MB-005: Add storeProfileId to Order Model
- MB-006: Make Hardcoded Values Configurable Through Profile
  - All 27 hardcoded 'Bs' across 4 HTML templates replaced with `{{ currencySymbol }}`
  - VInvoiceService uses profile for business name, address, tax label, locale
  - pos-checkout printOrder() uses profile for business name, address, locale
  - Chart labels/tooltips in rep-sells, rep-products use profile currency symbol
  - Fallback to defaults for legacy profiles without new fields
- MB-008: Frontend Service Updates for BusinessProfile (completed as part of MB-004/005)

## In Progress

- None in this repo

## Blocked

- MB-007: Backend API Endpoints — requires separate `inventory-nod` repo changes
- MB-009: Migration Strategy — requires backend coordination

## Next Task

Phase 1 frontend work is complete. Next steps:
1. MB-007: Backend API to store/serve extended profile fields (separate repo)
2. MB-009: Migration strategy + ADR for existing data defaults
3. Phase 2: Product attributes (Definition/Value/Variant) — requires backend API

## Tests

Unit:
- 526 tests
- Pre-existing failures only (scaffold + makeProduct falsy bug + print window tests)
- No regressions from MB-004 through MB-006

Build:
- PASS (1.69 MB initial, 344.96 kB compressed)

## Important Decisions

1. **ADR-MB-001**: Extend StoreProfile in-place
2. **ADR-MB-002**: Product attributes via Definition/Value/Variant pattern
3. **ADR-MB-003**: Capabilities as string array on profile
4. **ADR-MB-004**: Add storeProfileId to Orders (optional with default)
5. **ADR-MB-005**: Configuration over business-specific code

## Notes for Next Session

1. Phase 1 frontend work is DONE (MB-001 through MB-006, MB-008)
2. MB-007 requires backend repo (inventory-nod) — schema migration + API changes
3. MB-009 requires backend coordination for data migration
4. Phase 2 can start once backend supports extended profile fields
5. Read TASKS.md for remaining tasks
