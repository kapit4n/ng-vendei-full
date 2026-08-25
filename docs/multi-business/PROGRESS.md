# Multi-Business Progress

Last Updated: 2026-08-25

Current Phase: Phase 1

Current Task: MB-006

Overall Progress: 30%

## Completed

- MB-001: Baseline Architecture Analysis
  - All domain models analyzed
  - StoreProfile architecture understood
  - Target architecture designed (extend StoreProfile in-place)
  - 5 architectural decisions recorded (ADR-MB-001 through ADR-MB-005)
  - 9 hardcoded assumptions cataloged

- MB-002: Run Test Suite and Record Baseline
  - Unit tests: 494 tests, 3 pre-existing failures
  - E2E: 9 Playwright tests, all passing
  - Build: PASS (fixed deprecated `extractCss`)
  - Baseline recorded in TESTING.md

- MB-003: Document Hardcoded Business Assumptions
  - 9 hardcoded assumptions documented in ARCHITECTURE.md
  - Migration strategy per assumption documented

- MB-004: Extend StoreProfile Interface with Business Configuration
  - StoreProfile interface extended (all new fields optional, backward-compatible)
  - VStoreProfileService: 12 helper methods + CAPABILITIES constant
  - 28 new tests covering all helpers + capability checks
  - Fixed 2 additional scaffold test mocks (InvProductsInv, CustomerList)

- MB-005: Add storeProfileId to Order Model
  - PosCheckoutComponent now tags orders with storeProfileId from active profile
  - 4 new tests (integration + failure specs)
  - Fixed VStoreProfileService helper methods to fall back to active profile
  - 526 tests total, 3 pre-existing failures, no regressions

- MB-008: Frontend Service Updates for BusinessProfile
  - Completed as part of MB-004 + MB-005

## In Progress

- MB-006: Make Hardcoded Values Configurable Through Profile
  - Replace hardcoded 'Bs', address, business name, locale in components

## Blocked

- None

## Next Task

MB-006: Make Hardcoded Values Configurable Through Profile (Phase 1)

Then: MB-007 — Add Backend API Endpoints (requires backend repo)

## Tests

Unit:
- 57 spec files
- 526 tests
- 3 pre-existing failures (printInvoice + submitOrder scaffold)
- Disconnect at ~135/526 (pre-existing afterAll error)

E2E:
- 2 Playwright spec files
- 9 tests
- PASS

Build:
- PASS (1.69 MB initial, 344.59 kB compressed)

## Important Decisions

1. **ADR-MB-001**: Extend StoreProfile in-place (not separate BusinessProfile table)
2. **ADR-MB-002**: Product attributes via Definition/Value/Variant pattern
3. **ADR-MB-003**: Capabilities as string array on profile
4. **ADR-MB-004**: Add storeProfileId to Orders (optional with default)
5. **ADR-MB-005**: Configuration over business-specific code

## Risks

1. **Backend coordination** — Extended profile fields require backend changes in separate repo
2. **Data migration** — Existing orders need storeProfileId backfill
3. **Test stability** — Karma disconnect issue may mask test failures
4. **Single NgModule** — All 35+ components in one module limits lazy loading

## Notes for Next Session

1. Start by reading PROGRESS.md (this file)
2. Check TASKS.md for the next task (MB-006)
3. Run the test suite to verify no regressions
4. MB-006: Replace hardcoded currency/location/business name with profile values
5. The existing POS checkout is the regression safety net
6. Read DECISIONS.md before making architectural choices
