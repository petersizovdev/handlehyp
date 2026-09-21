# HandleHYP

Telegram Mini App — мобильный торговый терминал для Hyperliquid.

HandleHYP объединяет:
- Telegram WebApp frontend;
- backend API;
- realtime workers;
- Hyperliquid API/WebSocket;
- trailing stop;
- whale tracking;
- trading analytics;
- Builder Code для торговых ордеров.

---

## Architecture

HandleHYP строится как monorepo с разделением frontend, API и background workers.

Главный принцип:

```text
Telegram Mini App
        │
        │ HTTPS / WebSocket
        ▼
   ┌───────────┐
   │    API    │
   │  Fastify  │
   └─────┬─────┘
         │
   ┌─────┼─────────────┐
   │     │             │
   ▼     ▼             ▼
PostgreSQL Redis      Worker
                       │
                ┌──────┼──────┐
                │      │      │
                ▼      ▼      ▼
             Market Trading Whale
               WS      WS    Tracker
                │      │      │
                └──────┼──────┘
                       ▼
                 Hyperliquid
```
---

## Monorepo

    handlehyp/
    ├── apps/
    │   ├── web/
    │   ├── api/
    │   └── worker/
    │
    ├── packages/
    │   ├── ui/
    │   ├── shared/
    │   ├── hyperliquid/
    │   ├── trading/
    │   ├── telegram/
    │   └── config/
    │
    ├── infra/
    │   ├── docker/
    │   ├── nginx/
    │   └── monitoring/
    │
    ├── docs/
    │   ├── architecture/
    │   ├── api/
    │   └── trading/
    │
    ├── .github/
    │   └── workflows/
    │
    ├── package.json
    ├── pnpm-workspace.yaml
    ├── turbo.json
    ├── docker-compose.yml
    └── README.md

---

## Frontend

The frontend is a lightweight Telegram Mini App.

Stack:

- React
- TypeScript
- Vite
- Zustand
- TanStack Query
- Lightweight Charts
- Tailwind CSS
- Telegram WebApp SDK

Frontend responsibilities:

- trading terminal UI;
- charts;
- order form;
- orderbook;
- positions;
- orders;
- fills;
- whale events;
- trailing-stop configuration;
- realtime state rendering.

The frontend must not contain trusted trading logic.

In particular:

- Telegram identity is verified by backend;
- Builder Code is attached by backend;
- Hyperliquid requests are constructed by backend/domain layer;
- frontend cannot be trusted with authorization decisions.

---

## Backend API

Stack:

- Node.js
- TypeScript
- Fastify
- WebSocket
- Zod

The API is responsible for:

- Telegram authentication;
- user/account management;
- trading commands;
- validation;
- permissions;
- REST endpoints;
- WebSocket connections to the frontend;
- reading/writing persistent state;
- communicating with trading domain services.

The API must not become the main realtime market-data process.

Long-running Hyperliquid connections and background processing belong to the Worker.

---

## Worker

Worker is a separate process.

Responsibilities:

- Hyperliquid market WebSockets;
- user/account realtime state;
- trailing-stop monitoring;
- whale tracking;
- analytics;
- background jobs;
- event processing.

Example:

    Hyperliquid
          │
          ▼
        Worker
          │
          ├── Redis
          │
          └── PostgreSQL

The Worker should continue operating independently from the HTTP API lifecycle.

---

## Hyperliquid integration

All Hyperliquid-specific communication is isolated inside:

    packages/hyperliquid/

The rest of the application should depend on our abstraction rather than directly calling Hyperliquid endpoints.

Conceptually:

    HandleHYP domain
           │
           ▼
    Hyperliquid abstraction
           │
           ▼
    Hyperliquid API / WebSocket

This prevents Hyperliquid-specific implementation details from leaking into the entire codebase.

---

## Trading domain

Trading-specific business logic belongs in:

    packages/trading/

Examples:

- order validation;
- order construction;
- position logic;
- risk checks;
- trailing-stop rules;
- trading state;
- order lifecycle;
- exchange-independent trading concepts.

Exchange transport details remain inside `packages/hyperliquid/`.

---

## Builder Code

Every user order must go through the backend trading flow.

    Mini App
       │
       │ place order
       ▼
      API
       │
       │ authenticate / validate
       ▼
    Trading domain
       │
       │ construct final order
       │ attach Builder information
       ▼
    Hyperliquid client
       │
       ▼
    Hyperliquid

The frontend must never be responsible for deciding whether Builder information is attached.

Builder configuration belongs to the Hyperliquid integration layer and should be validated before an order is submitted.

---

## Authentication

Telegram identity and Hyperliquid trading identity are separate concepts.

    Telegram User
          │
          ▼
    HandleHYP User
          │
       ┌──┴──┐
       ▼     ▼
    Account A
    Account B

Telegram Mini App `initData` must be validated by the backend.

The backend must not trust a Telegram user ID supplied by the frontend without cryptographic validation.

A future user may have multiple Hyperliquid accounts/wallets.

---

## Data layer

### PostgreSQL

Persistent data:

- users;
- Hyperliquid accounts;
- orders;
- positions;
- trading settings;
- trailing-stop configuration;
- whale subscriptions;
- user preferences;
- analytics metadata.

PostgreSQL should not be treated as the primary realtime market-data transport.

### Redis

Runtime/realtime data:

- market state;
- user state;
- WebSocket state;
- trailing-stop state;
- cache;
- rate limiting;
- pub/sub;
- internal event distribution.

---

## Realtime architecture

There are two separate realtime flows.

### Hyperliquid → Backend

    Hyperliquid WebSocket
            │
            ▼
          Worker
            │
            ▼
       Redis / events

### Backend → Mini App

    Redis / internal events
            │
            ▼
           API
            │
            ▼
       WebSocket
            │
            ▼
       Telegram Mini App

Frontend realtime data can include:

- ticker;
- orderbook;
- trades;
- positions;
- orders;
- fills;
- liquidation events;
- whale events;
- trailing-stop state.

---

## Trading command flow

    Mini App
       │
       │ Create Order
       ▼
      API
       │
       ├── authenticate
       ├── validate user
       ├── validate account
       ├── validate order
       │
       ▼
    Trading domain
       │
       ├── construct order
       ├── apply Builder Code
       │
       ▼
    Hyperliquid
       │
       ▼
    Worker / realtime state
       │
       ▼
    Redis
       │
       ▼
    API WebSocket
       │
       ▼
    Mini App

---

## Folder responsibilities

### apps/web

Telegram Mini App.

### apps/api

HTTP/WebSocket backend.

### apps/worker

Long-running background/realtime processes.

### packages/ui

Reusable UI components.

### packages/shared

Shared TypeScript types, schemas and constants.

### packages/hyperliquid

Hyperliquid API, exchange requests, WebSockets and exchange-specific models.

### packages/trading

Trading domain and business rules.

### packages/telegram

Telegram WebApp integration and authentication-related utilities.

### packages/config

Shared configuration conventions.

---

## Technology stack

### Frontend

React + TypeScript + Vite

### Backend

Node.js + TypeScript + Fastify

### Realtime

WebSocket

### State

Zustand + TanStack Query

### Charts

Lightweight Charts

### Validation

Zod

### Database

PostgreSQL

### Runtime/cache

Redis

### Monorepo

pnpm + Turborepo

### Infrastructure

Docker + Nginx/Caddy + GitHub Actions

---

## Architectural principles

1. Frontend is untrusted.
2. Trading authorization happens on the backend.
3. Builder Code is applied server-side.
4. Hyperliquid integration is isolated.
5. API and realtime workers are separate processes.
6. PostgreSQL stores persistent state.
7. Redis handles realtime/runtime state.
8. Long-running WebSocket connections belong to workers.
9. Shared domain types live in packages/shared.
10. Exchange-specific details must not leak into frontend code.
11. The architecture should remain lightweight enough for a small VPS.
12. Features should be added without breaking the separation between UI, API, workers and domain logic.

---

## Development direction

The project should be developed in layers:

1. Repository foundation
2. Shared types/configuration
3. Hyperliquid client
4. Backend API
5. Telegram authentication
6. Trading domain
7. Builder Code integration
8. Realtime Worker
9. Unified account/position state
10. Frontend terminal
11. Trailing stop
12. Whale tracking
13. Analytics
14. Production infrastructure

Do not implement everything at once.

Each layer should have a clear responsibility and tests before the next layer becomes dependent on it.

---

## Core rule

HandleHYP is not simply a Telegram UI connected directly to Hyperliquid.

It is a small trading system:

    Telegram
       │
       ▼
    Frontend
       │
       ▼
    API
       │
       ├── Trading domain
       ├── Auth
       └── Commands
       │
       ▼
    Worker
       │
       ├── Realtime
       ├── Trailing
       ├── Whale tracking
       └── Analytics
       │
       ▼
    Hyperliquid

The architecture should preserve this separation as the project grows.
