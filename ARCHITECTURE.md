# Architecture & Technology Stack

## Overview

NgVendeiFull is a full-stack Point-of-Sale (POS) and Inventory Management System built as an Angular single-page application. It provides a touch-friendly checkout interface, product catalog browsing, payment processing, thermal receipt printing, customer management, inventory tracking with lot-level expiry monitoring, and comprehensive sales analytics reports.

## System Architecture

```
┌─────────────────────────────────────────────────┐
│                 Angular SPA (21)                 │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ POS       │  │ Reg/CRUD │  │ Reports &     │  │
│  │ Checkout  │  │ Modules  │  │ Analytics     │  │
│  └─────┬─────┘  └─────┬────┘  └──────┬────────┘  │
│        │              │              │           │
│  ┌─────┴──────────────┴──────────────┴────────┐  │
│  │          HTTP Services (Angular)            │  │
│  └─────────────────────┬───────────────────────┘  │
└────────────────────────┼──────────────────────────┘
                         │ REST API (HTTP)
                         ▼
┌──────────────────────────────────────────────────┐
│          Node.js / Express Backend                │
│            (inventory-nod)                        │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐   │
│  │ Products  │  │ Orders   │  │ Inventory     │   │
│  │ API       │  │ API      │  │ API           │   │
│  └─────┬─────┘  └─────┬────┘  └──────┬────────┘   │
│        │              │              │            │
│  ┌─────┴──────────────┴──────────────┴────────┐   │
│  │           PostgreSQL Database               │   │
│  └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | Angular | 21.2.8 |
| UI Component Library | Angular Material | 21.2.6 |
| Charts | Chart.js | 4.5.1 |
| Icons | Font Awesome | 4.7.0 |
| Language | TypeScript | 5.9 |
| Build Tool | Angular CLI | 21.2.7 |
| Backend | Node.js / Express (inventory-nod) | — |
| Database | PostgreSQL | — |
| Testing | Jasmine + Karma (unit), Protractor (e2e) | — |

## Data Flow

```
User Action → Component → Service (HTTP) → REST API → Database
                                                          │
User ← Component ← Service (HTTP) ← JSON Response ←──────┘
```

1. **Checkout Flow:** User adds products → cart state updated locally → submit order → POST to `/orders` and `/orderDetails` → reduce inventory → clear cart
2. **CRUD Flow:** User creates/edits entity → form validation → REST API call → database persistence → refresh list
3. **Reports Flow:** User selects date range → fetch all sales → client-side filtering → Chart.js rendering

## Database Schema

Key entities managed through the backend API:

| Entity | Description |
|--------|------------|
| Products | Name, code, description, price, category, image |
| Product Presentations | Product variations with different units/prices/images |
| Categories | Product grouping |
| Units of Measure | Sellable quantities (kg, unit, box) |
| Customers | Name, CI, code |
| Orders | POS transactions with payment details |
| Order Details | Individual line items per order |
| Inventory Lots | Stock with expiry dates for perishable goods |

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST | `/products` | Product CRUD |
| GET/POST | `/categories` | Category CRUD |
| GET/POST | `/clients` | Customer CRUD |
| GET/POST | `/orders` | Order management |
| GET/POST | `/orderDetails` | Order line items |
| GET/POST | `/inventory-lots` | Inventory lot tracking |
| GET | `/orders/today-summary` | Daily sales summary |
| POST | `/products/:id/reduce-inventory` | Stock reduction |
| POST | `/products/:id/update-total-selled` | Revenue tracking |

## Installation / Setup

**Prerequisites:** Node.js 18+, Angular CLI, PostgreSQL (via backend)

```bash
# Install frontend dependencies
npm install

# Start the Angular dev server with proxy to backend
ng serve --proxy-config proxy.conf.json

# Or using the full-stack script
bash scripts/run-full-stack.sh
```

The backend ([inventory-nod](https://github.com/kapit4n/inventory-nod)) is expected at a sibling directory.

## Deployment

```bash
# Build for production
ng build --configuration production

# Output is in dist/ — deploy to any static file server
# Configure the backend URL via environment variables
```

## Project Structure

```
src/app/
├── app.module.ts            # Root module with all routes
├── components/auth/login/   # Authentication
├── features/vendei/         # POS feature components
├── pages/                   # Route-level pages
│   ├── main/                # Dashboard hub
│   ├── vendei/              # POS checkout
│   ├── reg/                 # Registration/CRUD modules
│   ├── inv/                 # Inventory management
│   ├── rep/                 # Reports & analytics
│   └── tools/               # Backend API browser
├── services/                # HTTP/data services by domain
└── utils/                   # Shared helpers
```
