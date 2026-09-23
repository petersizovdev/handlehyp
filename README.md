# HandleHYP

**Telegram Mini App for Hyperliquid with strategy signals and automated Maker execution.**

HandleHYP — это не просто торговый терминал и не обычный бот с сигналами.

Это небольшая торговая система, построенная вокруг одной основной задачи:

> **привести торговый поток пользователя в HandleHYP и исполнить его максимально выгодным для пользователя способом.**

Основой монетизации является **Builder Code + Maker execution**.

---

## Product

HandleHYP рассчитан на обычных розничных трейдеров Hyperliquid, которые:

* торгуют со смартфона;
* хотят быстро принимать торговые решения;
* не хотят разбираться в microstructure;
* не хотят вручную управлять Maker/Taker исполнением;
* хотят получать готовые торговые идеи вместо сложного терминала.

Пользователь не должен думать о том, как именно устроена инфраструктура.

Он видит:

```text
Signal
   ↓
Why this signal?
   ↓
Buy / Sell
   ↓
HandleHYP executes
```

Вся сложность находится внутри backend и worker infrastructure.

---

# Core Product Model

HandleHYP состоит из четырёх основных уровней ценности.

### 1. Execution

**Builder Code + Maker execution**

Это экономическое ядро продукта.

HandleHYP принимает торговое намерение пользователя и пытается исполнить его через Maker-механику.

Пользователь нажимает обычную кнопку:

```text
BUY
```

а система самостоятельно занимается:

* созданием лимитного ордера;
* Post-Only;
* контролем цены;
* ожиданием исполнения;
* partial fills;
* cancel/replace;
* fallback policy;
* Builder Code;
* tracking execution status.

Пользователь не обязан знать, что происходит внутри.

---

### 2. Strategies

Strategy Engine генерирует торговые сигналы на основании реальных данных Hyperliquid.

Примеры:

* Whale Accumulation
* OI Anomaly
* Volume Spike
* Liquidation Cascade
* Funding Rate Extreme
* Price/OI divergence
* другие rule-based market events

Strategy Engine **не использует LLM для генерации сигналов**.

Сигнал появляется из детерминированных правил и market data.

---

### 3. AI

AI — дополнительный платный слой.

LLM не является источником торговых сигналов.

AI получает уже существующий сигнал и может:

* объяснить контекст;
* структурировать аргументы;
* оценить дополнительные факторы;
* сформировать сценарий;
* предложить параметры входа/выхода;
* объяснить риски.

AI доступен только в рамках соответствующего тарифа и работает с ограничениями стоимости:

* caching;
* rate limits;
* дешёвые модели для простых задач;
* ограниченное количество AI-запросов.

---

### 4. Retention Features

Дополнительные функции увеличивают полезность продукта и удержание пользователя:

* trailing stop;
* whale tracking;
* trading analytics;
* execution analytics;
* position tracking;
* historical signal performance.

Они не должны превращать HandleHYP в очередной перегруженный trading terminal.

---

# Product Principle

Главный вопрос для любой новой функции:

> **Увеличивает ли она торговый поток через HandleHYP или удержание пользователя?**

Если нет — функция не является приоритетной.

---

# User Flow

Основной пользовательский сценарий:

```text
Telegram
   │
   ▼
Mini App
   │
   ▼
Signal Catalog
   │
   ▼
Signal
   │
   ├── Why?
   ├── Market context
   └── AI enrichment (paid)
   │
   ▼
BUY / SELL
   │
   ▼
API
   │
   ▼
Trading Domain
   │
   ▼
Execution Domain
   │
   ├── Maker attempt
   ├── Post-Only
   ├── Fill monitoring
   └── Fallback policy
   │
   ▼
Hyperliquid
   │
   ▼
Worker
   │
   ▼
Realtime state
   │
   ▼
Mini App
```

---

# Architecture

```text
                         ┌──────────────────┐
                         │ Telegram Mini App│
                         └────────┬─────────┘
                                  │
                            HTTPS / WS
                                  │
                                  ▼
                         ┌──────────────────┐
                         │       API        │
                         │     Fastify      │
                         └────────┬─────────┘
                                  │
             ┌────────────────────┼────────────────────┐
             │                    │                    │
             ▼                    ▼                    ▼
        Trading Domain      Subscription          PostgreSQL
             │
             ▼
       Execution Domain
             │
             ▼
      Hyperliquid Client
             │
             ▼
        Hyperliquid


                         ┌──────────────────┐
                         │      Worker      │
                         └────────┬─────────┘
                                  │
                    Hyperliquid WebSockets
                                  │
             ┌────────────────────┼────────────────────┐
             │                    │                    │
             ▼                    ▼                    ▼
       Market Data          Strategy Engine       Whale Tracker
                                  │
                                  ▼
                              Signals
                                  │
                                  ▼
                                Redis
                                  │
                                  ▼
                                API
                                  │
                                  ▼
                            Mini App
```

API и Worker являются отдельными процессами.

API не должен становиться основным realtime market-data процессом.

Worker владеет долгоживущими WebSocket-соединениями и background processing.

---

# Monorepo

```text
handlehyp/
│
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
│   ├── strategies/
│   ├── execution/
│   ├── ai/
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
│   ├── trading/
│   └── strategies/
│
├── .github/
│   └── workflows/
│
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── docker-compose.yml
└── README.md
```

---

# Packages

## `apps/web`

Telegram Mini App.

Responsibilities:

* signal catalog;
* signal cards;
* trading actions;
* positions;
* orders;
* fills;
* execution status;
* charts where necessary;
* whale events;
* trailing stop;
* AI explanations.

Frontend is **untrusted**.

Frontend never controls:

* authorization;
* Builder Code;
* execution policy;
* trading permissions;
* trusted account configuration.

---

## `apps/api`

Fastify backend.

Responsibilities:

* Telegram authentication;
* user management;
* account management;
* REST API;
* WebSocket connections to frontend;
* trading commands;
* subscription checks;
* request validation;
* strategy/signal API;
* communication with domain services.

API does not own long-lived market-data connections.

---

## `apps/worker`

Long-running background process.

Responsibilities:

* Hyperliquid WebSockets;
* market state;
* account state;
* Strategy Engine;
* signal generation;
* signal evaluation;
* execution monitoring;
* trailing stop;
* whale tracking;
* analytics;
* background jobs;
* event processing;
* AI enrichment jobs.

Worker must operate independently from the HTTP API lifecycle.

---

# `packages/hyperliquid`

All Hyperliquid-specific implementation lives here.

Responsibilities:

* Info API;
* Exchange API;
* WebSocket;
* market metadata;
* signing;
* nonce management;
* order wire construction;
* Builder Code;
* Hyperliquid-specific models;
* transport;
* exchange execution boundary.

Other domains should not directly depend on Hyperliquid wire formats.

Conceptually:

```text
Application
     │
     ▼
Domain abstraction
     │
     ▼
Hyperliquid package
     │
     ▼
Hyperliquid API / WebSocket
```

---

# `packages/trading`

Exchange-independent trading domain.

Responsibilities:

* order intents;
* order validation;
* trading state;
* position concepts;
* order lifecycle;
* risk checks;
* account concepts;
* exchange-independent trading types.

Hyperliquid-specific transport remains outside this package.

---

# `packages/execution`

Execution is a separate domain because execution is a core part of the product economics.

Responsibilities:

* Maker execution;
* Post-Only orders;
* limit-first execution;
* order slicing;
* partial fills;
* cancel/replace;
* execution timeout;
* fallback policy;
* execution state;
* Maker/Taker classification;
* execution cost;
* estimated savings;
* Builder Code orchestration.

Conceptually:

```text
Trading Intent
      │
      ▼
Execution Domain
      │
      ├── Maker attempt
      │
      ├── Monitor
      │
      ├── Partial fill
      │
      ├── Cancel / replace
      │
      └── Fallback
             │
             ▼
         Hyperliquid
```

Execution policy must be deterministic and testable.

---

# `packages/strategies`

Strategy domain.

Responsibilities:

* strategy definitions;
* signal generation;
* signal lifecycle;
* signal metadata;
* signal history;
* signal evaluation;
* post-factum performance statistics.

Strategy Engine is **rule-based**.

Example:

```text
Market Data
     │
     ├── Price
     ├── Volume
     ├── OI
     ├── Funding
     ├── Liquidations
     └── Whale activity
            │
            ▼
      Strategy Engine
            │
            ▼
          Signal
```

Example strategies:

### Whale Accumulation

Detect unusual accumulation behaviour.

### OI Anomaly

Detect abnormal Open Interest changes relative to price movement.

### Volume Spike

Detect abnormal volume without proportional price movement.

### Liquidation Cascade

Detect conditions associated with liquidation activity.

### Funding Extreme

Detect abnormal funding conditions.

The initial implementation should favour deterministic rules that can be tested and measured.

---

# `packages/ai`

AI enrichment layer.

AI does not create the underlying trading signal.

```text
Market Data
     │
     ▼
Strategy Engine
     │
     ▼
Signal
     │
     ▼
AI
     │
     ▼
Explanation / Context
```

Responsibilities:

* signal explanation;
* context generation;
* scenario construction;
* additional factor analysis;
* user-facing text;
* subscription limits;
* caching;
* rate limiting;
* model selection;
* cost control.

AI must remain optional.

The core product must function without LLM availability.

---

# Builder Code

Builder Code is a core economic component of HandleHYP.

The frontend must never provide trusted Builder configuration.

The flow is:

```text
Mini App
   │
   ▼
API
   │
   ▼
Trading Domain
   │
   ▼
Execution Domain
   │
   ▼
Builder Configuration
   │
   ▼
Hyperliquid Client
   │
   ▼
Hyperliquid
```

Builder information is attached server-side.

The system must guarantee that every eligible user order follows the configured Builder policy.

Builder configuration must not be user-controlled.

---

# Maker Execution

HandleHYP should attempt to execute eligible trades using Maker-compatible execution.

Typical flow:

```text
User clicks BUY
       │
       ▼
Create execution intent
       │
       ▼
Calculate Maker price
       │
       ▼
Post-Only order
       │
       ├──────────────┐
       │              │
       ▼              ▼
   Filled         Not filled
       │              │
       │              ▼
       │        cancel/replace
       │              │
       │              ▼
       │          timeout
       │              │
       │              ▼
       │       fallback policy
       │
       ▼
Execution result
```

Fallback behaviour must be explicit.

The system must never silently represent a Taker execution as Maker execution.

---

# Trading Economics

The economic model is based on trading volume passing through HandleHYP.

Conceptually:

```text
User
 │
 │ trading volume
 ▼
HandleHYP
 │
 ├── Maker execution
 │
 └── Builder Code
 │
 ▼
Hyperliquid
```

HandleHYP's revenue comes from the configured Builder fee on eligible executions.

The exact fee rates, exchange fee tiers and Builder Code rules must always be treated as configuration/data that is verified against the current Hyperliquid rules rather than hard-coded assumptions.

---

# Authentication

Telegram identity and Hyperliquid trading identity are separate.

```text
Telegram User
      │
      ▼
HandleHYP User
      │
      ├── Account A
      ├── Account B
      └── Account C
```

Telegram Mini App `initData` must be cryptographically validated by the backend.

The frontend cannot simply submit a Telegram user ID and have it trusted.

Future versions may support multiple Hyperliquid accounts per HandleHYP user.

---

# Data Layer

## PostgreSQL

Persistent state:

* users;
* accounts;
* orders;
* positions;
* fills;
* execution records;
* trading settings;
* trailing-stop configuration;
* strategies;
* signals;
* signal history;
* signal statistics;
* subscriptions;
* analytics metadata.

PostgreSQL is not the primary realtime transport.

---

## Redis

Runtime state:

* market state;
* account state;
* signal state;
* execution state;
* WebSocket state;
* trailing-stop state;
* cache;
* rate limiting;
* pub/sub;
* internal events.

Redis should be used for fast transient state and event distribution rather than becoming an uncontrolled second database.

---

# Realtime

## Hyperliquid → HandleHYP

```text
Hyperliquid WebSocket
        │
        ▼
      Worker
        │
        ├── Market State
        │
        ├── Strategy Engine
        │
        ├── Whale Tracking
        │
        ├── Execution Monitoring
        │
        └── Analytics
        │
        ▼
      Redis
```

## HandleHYP → Mini App

```text
Redis / Events
      │
      ▼
     API
      │
      ▼
WebSocket
      │
      ▼
 Mini App
```

Realtime frontend events may include:

* market updates;
* new signals;
* signal updates;
* positions;
* orders;
* fills;
* execution status;
* Maker/Taker status;
* whale events;
* trailing-stop state.

---

# Frontend Philosophy

HandleHYP should not attempt to reproduce a professional desktop trading terminal.

The primary interface should answer:

```text
What is happening?

Why does it matter?

What can I do?

What happened to my order?
```

The UI should minimise the amount of market microstructure knowledge required from the user.

Complexity belongs in the backend.

---

# Strategy Philosophy

Signals are not promises.

A signal represents a detected market condition.

For example:

```text
BTC
OI +12%
Price +1.1%
Volume +240%
Funding increasing

        ↓

OI Anomaly detected
```

The system should expose the evidence behind the signal.

It should not represent a signal as a guaranteed prediction.

Signal quality is measured retrospectively using actual market outcomes.

---

# AI Philosophy

AI is an enhancement layer, not the trading engine.

Bad architecture:

```text
Market Data
     ↓
    LLM
     ↓
"BUY BTC"
```

HandleHYP architecture:

```text
Market Data
     ↓
Rule-based Strategy
     ↓
Signal
     ↓
LLM
     ↓
Explanation / Context
```

This keeps:

* signal generation deterministic;
* costs predictable;
* behaviour testable;
* AI optional;
* the core product functional without an LLM.

---

# Non-Goals

HandleHYP is not intended to become:

* another TradingView clone;
* a complex desktop terminal;
* an LLM trading bot;
* a guaranteed-profit service;
* a copy-trading platform by default;
* a collection of unrelated crypto features.

Do not add features merely because they are technically interesting.

---

# Architectural Principles

1. **Frontend is untrusted.**
2. **Trading authorization happens server-side.**
3. **Builder Code is applied server-side.**
4. **Execution is a first-class domain.**
5. **Maker execution is central to the product economics.**
6. **Hyperliquid-specific code stays inside `packages/hyperliquid`.**
7. **API and Worker are separate processes.**
8. **Realtime market data belongs to Worker.**
9. **Strategy Engine is rule-based.**
10. **AI only enriches existing signals.**
11. **PostgreSQL stores persistent state.**
12. **Redis stores runtime/realtime state.**
13. **Execution results must distinguish Maker and Taker.**
14. **The system must remain lightweight enough for a small VPS.**
15. **Every major domain must be independently testable.**
16. **Do not build features without a clear product purpose.**
17. **HandleHYP does not guarantee trading results.**
18. **The product optimises for trading flow and user retention.**

---

# Development Roadmap

Development happens in layers.

The order matters.

## Phase 1 — Foundation

* monorepo;
* pnpm;
* Turborepo;
* TypeScript;
* shared configuration;
* lint;
* typecheck;
* tests.

**Status: complete.**

---

## Phase 2 — Hyperliquid Foundation

* Info API;
* market metadata;
* market registry;
* exchange transport;
* signing;
* nonce;
* order construction;
* execution boundary;
* integration tests.

**Status: complete / being finalised.**

---

## Phase 3 — Builder Code

* Builder configuration;
* Builder fee validation;
* `maxBuilderFee`;
* Builder approval;
* approval state;
* server-side Builder injection;
* Builder-aware execution tests.

**Goal:**

```text
Every eligible order
        ↓
Builder Code
        ↓
Hyperliquid
```

---

## Phase 4 — Execution Domain

Create:

```text
packages/execution/
```

Implement:

* execution intent;
* Maker policy;
* Post-Only;
* limit-first execution;
* price selection;
* partial fills;
* cancel/replace;
* timeout;
* fallback policy;
* execution lifecycle;
* Maker/Taker classification;
* execution metrics.

This phase establishes the economic core of HandleHYP.

---

## Phase 5 — Worker

Implement:

* Hyperliquid WebSockets;
* market state;
* Redis runtime state;
* event distribution;
* execution monitoring.

Worker becomes the long-running realtime process.

---

## Phase 6 — Strategy Engine

Create:

```text
packages/strategies/
```

Implement the first deterministic signals:

* OI Anomaly;
* Volume Spike;
* Funding Extreme;
* Whale Accumulation;
* Liquidation Cascade.

Every strategy should have:

* clear inputs;
* deterministic rules;
* output schema;
* tests;
* signal lifecycle;
* post-factum evaluation.

---

## Phase 7 — Backend API

Implement:

* Telegram authentication;
* users;
* accounts;
* trading commands;
* subscriptions;
* signals API;
* execution API;
* WebSocket;
* permissions.

---

## Phase 8 — Frontend

Build the Mini App around the actual product flow:

```text
Signal
  ↓
Context
  ↓
Action
  ↓
Execution
  ↓
Result
```

Not around a traditional terminal-first UI.

---

## Phase 9 — AI

Add:

* signal enrichment;
* explanations;
* context;
* subscription limits;
* caching;
* cost controls.

AI remains optional and never becomes the source of the underlying signal.

---

## Phase 10 — Retention Features

Add:

* trailing stop;
* whale tracking;
* analytics;
* execution analytics;
* signal statistics;
* historical performance.

Only features with measurable product value should be prioritised.

---

## Phase 11 — Production

* Docker;
* reverse proxy;
* monitoring;
* logging;
* backups;
* deployment;
* security hardening;
* CI/CD.

The deployment should remain lightweight and suitable for a small VPS.

---

# Development Rule

Do not implement everything simultaneously.

Each layer must be:

* independently testable;
* type-safe;
* isolated;
* documented;
* verified before the next layer depends on it.

The project should prefer a small amount of correct infrastructure over a large amount of unfinished functionality.

---

# Core Product Rule

Every major engineering decision should answer one question:

> **Does this increase the amount of trading flowing through HandleHYP or improve user retention?**

If the answer is no, it should not be prioritised.

---

# Core Architecture

```text
                         HANDLEHYP
                             │
              ┌──────────────┴──────────────┐
              │                             │
         USER VALUE                    ECONOMIC CORE
              │                             │
              ▼                             ▼
       Strategy Signals              Maker Execution
              │                             │
              ▼                             ▼
        AI Enrichment                  Builder Code
              │                             │
              └──────────────┬──────────────┘
                             │
                             ▼
                        Hyperliquid
                             │
                             ▼
                           Volume
```

HandleHYP should remain small, fast and focused.

The product is not the UI.

The product is the **system that turns a user's trading intent into a simple, automated and economically efficient execution flow**.
