# rfc-502-playground

A runnable prototype of [RFC 502 — Explicit Dependency Injection](https://github.com/emberjs/rfcs/pull/502),
built to check the proposal's ergonomics against real `ember-source` 7 rather than
to be shipped.

## The implementation

130 lines in `app/di/`. The owner is the container, so there is no second container
here — the whole mechanism is a `WeakMap` keyed on the owner, using `getOwner` and
`setOwner` from `@ember/owner`.

| file              | lines | what                                                                 |
| ----------------- | ----- | -------------------------------------------------------------------- |
| `app/di/index.ts` | 122   | `lookup` / `register` / `unregister`, and `service` in all its forms |
| `app/di/key.ts`   | 8     | what counts as a key                                                 |

Interface / shape matching is out of scope for the RFC, so it is not implemented
here either. A library whose dependency the app supplies keeps a string key; see
`app/services/feature-flags.ts` and `app/domain/dashboard.ts` for the two styles
side by side.

## What each RFC claim is tested by

`pnpm test` — 29 tests.

| claim                                                                   | test                                    |
| ----------------------------------------------------------------------- | --------------------------------------- |
| the RFC's own `register`/`lookup` examples run                          | `tests/unit/di/rfc-examples-test.ts`    |
| lazy self-registration, subclass override, hierarchy check, destruction | `tests/unit/di/registry-test.ts`        |
| mutually-dependent services across a module cycle                       | `tests/unit/di/cycle-test.ts`           |
| all four injection forms resolve to one instance; stubbing              | `tests/rendering/counter-demo-test.gts` |
| the whole thing boots; instance-initializer selection; interop          | `tests/application/di-test.ts`          |

## Where the findings went

The prototype disagreed with the RFC draft in several places, and the RFC text now
records each one. The short list:

- the non-decorator `service(this, Key)` form resolves eagerly, and can only be made
  lazy by returning a stand-in — which a Proxy cannot be, since `#private` access
  throws when the receiver is a Proxy
- the acceptance-test example's `owner.application.inject(...)` step is unnecessary
- `hasRegistration` has no sensible meaning for a class key
- a plain-class service cannot inject in a field initializer
- the thunk form is needed on **both** sides of a cycle
- a class-keyed registry does not need a new map on `Registry` at all

## Demos in the browser

`pnpm start`, then open the app — `app/templates/application.gts` renders one
section per claim.

## Getting Started

### Prerequisites

- Node.js >= 24
- pnpm

### Installation

```sh
pnpm install
```

### Development

To start the local development server:

```sh
pnpm dev
```

or

```sh
pnpm start
```

## Features & Tooling

### GitHub Actions

Continuous Integration (CI) is configured under `.github/workflows/ci.yml` for automated testing and linting.

### Prettier

Code formatting is managed with [Prettier](https://prettier.io/).

- `pnpm format` - Format code
- `pnpm lint:prettier` - Check code formatting

### TypeScript

This project uses TypeScript and Glint for static type checking.

- `pnpm lint:types` - Typecheck code with Glint/TypeScript
