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

## Что HandleHYP не обещает

Это критически важный раздел, потому что он определяет границы продукта и защищает от неверных ожиданий — как пользователя, так и команды.

HandleHYP **не гарантирует**:

* прибыльность сигналов;
* исполнение по Maker-цене в 100% случаев;
* отсутствие проскальзывания при fallback на Taker;
* работу в условиях экстремальной волатильности без деградации;
* мгновенное исполнение (Maker по определению требует ожидания).

HandleHYP **гарантирует**:

* сигналы генерируются детерминированными правилами на реальных данных Hyperliquid;
* Builder Code применяется server-side и не может быть подменён клиентом;
* система **никогда** не выдаёт Taker-исполнение за Maker;
* пользователь всегда видит, как именно был исполнен его ордер;
* AI не является источником торговых решений.

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

**Ключевое требование:** каждая стратегия должна пройти backtesting на исторических данных Hyperliquid до того, как будет показана первому пользователю. Стратегия без измеренного win rate, average return и drawdown — это не стратегия, а гипотеза.

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
│   ├── strategies/
│   ├── execution/
│   └── backtesting/
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

**Operational note:** Worker — единственный процесс, которому критична низкая латентность до Hyperliquid. Если выйдет решение о co-location или выборе региона VPS, оно принимается именно для Worker, а не для API.

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

## Execution Quality Metrics

Это раздел, без которого Maker execution — это вера, а не инженерия.

Execution Domain обязан собирать и хранить следующие метрики по каждому исполнению:

**Fill metrics:**
* `maker_fill_rate` — доля ордеров, исполненных полностью как Maker;
* `partial_fill_rate` — доля ордеров с частичным исполнением;
* `time_to_fill_ms` — время от отправки Post-Only до fill;
* `time_to_cancel_ms` — время до отмены при неисполнении.

**Cost metrics:**
* `maker_savings_bps` — экономия в базисных пунктах относительно немедленного Taker-исполнения;
* `fallback_slippage_bps` — проскальзывание при переходе на Taker;
* `effective_fee_bps` — фактическая комиссия с учётом Builder Code и rebates.

**Behaviour metrics:**
* `cancel_replace_count` — сколько раз ордер переставлялся;
* `fallback_rate` — доля ордеров, ушедших в fallback;
* `fallback_reason` — timeout / price moved / user cancelled / insufficient liquidity.

Эти метрики:

1. Должны быть доступны пользователю в execution analytics (retention feature).
2. Должны агрегироваться для внутреннего мониторинга качества.
3. Должны использоваться для tuning execution policy.

**Без этих метрик вы не можете доказать пользователю, что ваш Maker execution выгоднее прямого market order.**

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

## Signal Backtesting

Каждая стратегия проходит обязательный цикл валидации **до** попадания в production.

```text
Historical Hyperliquid Data
        │
        ▼
   Replay Engine
        │
        ▼
  Strategy Rules
        │
        ▼
    Signals
        │
        ▼
  Outcome Evaluation
        │
        ▼
  Statistics Report
```

Обязательные метрики для каждой стратегии:

* **Win rate** — доля сигналов, после которых цена пошла в ожидаемом направлении;
* **Average return** — средний возврат на сигнал (в bps);
* **Max drawdown** — максимальная просадка при последовательном следовании сигналам;
* **Signal frequency** — как часто сигнал срабатывает (слишком редкий бесполезен, слишком частый обесценивает);
* **Regime dependency** — работает ли стратегия во всех рыночных режимах или только в тренде / флэте;
* **Decay** — сохраняется ли edge со временем.

Стратегия, не прошедшая backtesting с положительным ожиданием, **не показывается пользователю**, даже если технически работает.

Документация по backtesting framework: `docs/backtesting/`.

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

**Важно:** ставки Builder fee, fee tiers биржи и правила Builder Code — это **конфигурация и данные**, которые проверяются против актуальных правил Hyperliquid. Они не должны быть hard-coded. При изменении правил на стороне Hyperliquid система должна либо адаптироваться, либо явно деградировать, но не продолжать работать по устаревшим допущениям.

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

## Fallback Policy and User Communication

Fallback — это место, где пользователь может потерять деньги, если система не объяснит, что произошло.

**Правила:**

1. Fallback **всегда** требует явного решения системы, а не происходит автоматически по умолчанию.
2. Пользователь **видит** в реальном времени: «Maker attempt in progress», «Partial fill», «Fallback to Taker, reason: timeout».
3. После исполнения пользователь получает **diff**: цена Maker-попытки vs. фактическая цена исполнения, в bps.
4. Если fallback привёл к ухудшению цены относительно момента нажатия кнопки, это отображается явно.

**Пример UX-сообщения:**

```text
Maker attempt failed (timeout 30s)
Fallback: Taker execution
Executed: 2 341.50
Requested: 2 340.10
Slippage: +6.0 bps
```

**Запрещено:**

* показывать «Executed» без указания Maker/Taker;
* скрывать slippage при fallback;
* автоматически переставлять ордер бесконечно без таймаута.

Fallback policy должна быть конфигурируемой на уровне execution domain и тестируемой как state machine.

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

**Экономическая реальность:**

* Maker execution даёт пользователю экономию на комиссии и потенциально лучшую цену.
* Builder fee взимается с eligible executions и является основным источником выручки.
* Если fill rate Maker низкий, объём падает, и экономика рушится.
* Поэтому **execution quality — это не техническая деталь, а основа бизнес-модели.**

---

# Competitive Landscape

HandleHYP работает в плотной экосистеме Hyperliquid, где уже есть:

* торговые терминалы (Hyperdash, Hypurrscan);
* copy-trading платформы;
* сигнальные боты;
* Builder Code-интегрированные приложения.

**Чем HandleHYP отличается:**

1. **Rule-based сигналы с backtesting**, а не «AI-предсказания».
2. **Maker execution как ядро продукта**, а не как дополнительная функция.
3. **AI как enrichment**, а не как источник решений.
4. **Mobile-first через Telegram**, а не desktop terminal.

**Риск:** если Maker execution не даёт измеримого преимущества (fill rate, savings), продукт превращается в «ещё один сигнальный бот» без экономического рва.

**Ров:** execution quality metrics + накопленная статистика сигналов + retention через analytics.

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
* **execution quality metrics;**
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
19. **Every strategy must pass backtesting before production.**
20. **Execution quality is measured, not assumed.**

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

**Exit criteria:** execution domain покрыт unit-тестами как state machine, включая все ветки fallback, timeout и partial fill.

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

## Phase 6 — Backtesting

**Этот этап идёт до Strategy Engine.**

Create:

```text
packages/backtesting/
```

Implement:

* historical data ingestion;
* replay engine;
* strategy evaluation harness;
* statistics report (win rate, average return, drawdown, frequency, decay);
* сравнительные отчёты по стратегиям.

Без этого этапа Phase 7 не имеет смысла.

---

## Phase 7 — Strategy Engine

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
* post-factum evaluation;
* **backtesting report.**

---

## Phase 8 — Backend API

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

## Phase 9 — Frontend

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

## Phase 10 — AI

Add:

* signal enrichment;
* explanations;
* context;
* subscription limits;
* caching;
* cost controls.

AI remains optional and never becomes the source of the underlying signal.

---

## Phase 11 — Retention Features

Add:

* trailing stop;
* whale tracking;
* analytics;
* execution analytics;
* signal statistics;
* historical performance.

Only features with measurable product value should be prioritised.

---

## Phase 12 — Production

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

# Testing Strategy

| Layer | Что тестируется | Как |
| :--- | :--- | :--- |
| `hyperliquid` | signing, nonce, wire format | unit + integration на testnet |
| `trading` | order validation, risk checks | unit |
| `execution` | state machine, fallback, timeout | unit + mocked exchange |
| `strategies` | правила генерации | unit + backtesting |
| `backtesting` | корректность replay, метрики | unit + известные датасеты |
| `ai` | rate limits, caching, cost | unit |
| `api` | auth, permissions, validation | integration |
| `worker` | WebSocket lifecycle, event distribution | integration |
| `web` | UI flow | e2e (Playwright) |

**Правило:** execution domain и strategies не считаются готовыми без покрытия соответствующих тестов. Всё остальное может деградировать до integration-тестов.

---

# Failure Modes

Система должна явно обрабатывать следующие сценарии:

| Failure | Поведение |
| :--- | :--- |
| Hyperliquid WebSocket disconnected | Worker переподключается с exponential backoff, market state помечается stale |
| Redis unavailable | API деградирует до REST без realtime, Worker буферизует события |
| PostgreSQL unavailable | API возвращает 503, Worker продолжает сбор market data |
| Builder fee rejected | Ордер не отправляется, пользователь видит явную ошибку |
| Maker fill timeout | Fallback policy срабатывает, пользователь видит diff |
| AI provider unavailable | AI enrichment отключается, сигналы продолжают работать |
| Strategy produces no signals | UI показывает empty state, не fake signals |

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

---

# Open Questions

Разделы, которые требуют решения до Phase 4:

1. **Co-location:** нужен ли Worker на сервере, близком к Hyperliquid, или VPS в Европе достаточен для приемлемого fill rate?
2. **Cancel/replace policy:** сколько раз переставлять ордер до fallback, и по какому критерию (time, price movement, liquidity)?
3. **Partial fill handling:** считать ли частичный fill успехом, или продолжать добирать объём?
4. **Builder fee tiers:** как менять ставку в зависимости от объёма пользователя, и нужно ли это вообще?
5. **Signal transparency:** показывать ли пользователю backtesting-отчёт по каждой стратегии, или только агрегированные метрики?
6. **AI cost ceiling:** какой максимальный расход на AI на пользователя в месяц допустим, чтобы тариф оставался прибыльным?

---

# Roadmap
✅ Сделано (фактически реализовано)
Фаза	Название	Статус	Что внутри
1	Foundation	✅ Полностью	pnpm-workspace.yaml, turbo.json, TypeScript 5.8, ESLint, vitest, монорепо packages/* + apps/*
2	Hyperliquid Foundation	✅ Полностью	packages/hyperliquid — Info API, Exchange API, WebSocket, signing (L1 signer), nonce, order wire, market registry, transport, builder fee service, integration tests
3	Builder Code	⚠️ Частично	packages/trading/src/domain/builder-code.ts — базовая валидация адреса и fee rate, createBuilderCodeConfig, createOrderExecutionRequest. Нет конфигурации tiers или динамического изменения
4	Execution Domain	⚠️ Частично	packages/execution/ — intent, maker-policy, state-machine, fallback-policy, price-selection, execution metrics, ports. Есть unit-тесты на state machine и fallback. Нет интеграции с реальным Hyperliquid и нет метрик качества
5	Worker	⚠️ Частично	apps/worker/src/ — HyperliquidWebSocketClient, MarketStateTracker, RedisEventBus, InMemorySignalStore, StrategyEngine. Подписка на allMids, генерация сигналов. Нет полноценного monitoring, analytics worker'ов (analytics/, trailing-stop/, user-positions/, whale-tracker/ — заглушки)
6	Backtesting	❌ Не сделано	docs/backtesting/ — пустой .gitkeep. Нет replay engine, нет исторических данных, нет framework
7	Strategy Engine	⚠️ Частично	packages/strategies/ — 5 стратегий (FundingExtreme, LiquidationCascade, OIAnomaly, VolumeSpike, WhaleAccumulation), StrategyEngine, SignalStore. Есть unit-тесты для каждой стратегии. Но нет backtesting-отчётов, нет интеграции с историческими данными
8	Backend API	⚠️ Частично	apps/api/src/ — Fastify, routes (auth, auth-me, markets, signals, execution), middleware, schemas. Есть Telegram auth, Zod-схемы, тесты. Нет полноценной базы данных (infrastructure/database/ — заглушка), нет subscription-проверок, нет WebSocket-сервера к фронту
9	Frontend	⚠️ Частично	apps/web/src/ — React 18 + Vite, страницы (Terminal, Positions, Orders, Settings, Whale), компоненты (SignalCard, TradingAction, PositionCard), hooks, stores (market, trading, user). Нет Telegram Mini App интеграции, нет реального WebSocket-подключения к API
10	AI	❌ Не сделано	packages/ai — отсутствует в репозитории. Нет signal enrichment, нет LLM-слоя, нет rate limits или caching
11	Retention Features	❌ Не сделано	packages/ui — пустой (только .gitkeep и базовый index.ts). docs/architecture/, docs/trading/ — пустые. Нет trailing stop analytics, нет whale tracking analytics, нет execution analytics для пользователя
12	Production	❌ Не сделано	infra/docker/, infra/nginx/, infra/monitoring/ — пустые .gitkeep. Нет docker-compose, нет nginx конфигурации, нет мониторинга, нет CI/CD (.github/workflows/ — пустой)