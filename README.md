# rfc-502-playground

A runnable prototype of [RFC 502 — Explicit Dependency Injection](https://github.com/emberjs/rfcs/pull/502),
built to check the proposal's ergonomics against real `ember-source` 7 rather than
to be shipped.

## The implementation

228 lines in `app/di/`. The owner is the container, so there is no second container
here — the whole mechanism is a `WeakMap` keyed on the owner, using `getOwner` and
`setOwner` from `@ember/owner`.

| file              | lines | what                                                                                                               |
| ----------------- | ----- | ------------------------------------------------------------------------------------------------------------------ |
| `app/di/index.ts` | 136   | `lookup` / `register` / `unregister`, and `service` in all its forms                                               |
| `app/di/shape.ts` | 84    | "lookup by shape" — the [polaris-service#19](https://github.com/chancancode/ember-polaris-service/issues/19) solve |
| `app/di/key.ts`   | 8     | what counts as a key                                                                                               |

## What each RFC claim is tested by

`pnpm test` — 41 tests.

| claim                                                                   | test                                     |
| ----------------------------------------------------------------------- | ---------------------------------------- |
| the RFC's own `register`/`lookup` examples run                          | `tests/unit/di/rfc-examples-test.ts`     |
| lazy self-registration, subclass override, hierarchy check, destruction | `tests/unit/di/registry-test.ts`         |
| an app satisfies a library's token with no initializer                  | `tests/unit/di/shape-test.ts`            |
| ambiguous shapes are an error, declared beats structural                | `tests/unit/di/ambiguity-test.ts`        |
| mutually-dependent services across a module cycle                       | `tests/unit/di/cycle-test.ts`            |
| all four injection forms resolve to one instance; stubbing              | `tests/rendering/counter-demo-test.gts`  |
| the library talks to the app's implementation                           | `tests/rendering/provider-demo-test.gts` |
| the whole thing boots; instance-initializer selection; interop          | `tests/application/di-test.ts`           |

## Where the findings went

The prototype disagreed with the RFC draft in several places, and the RFC text now
records each one. The short list:

- the non-decorator `service(this, Key)` form resolves eagerly, and can only be made
  lazy by returning a stand-in — which a Proxy cannot be, since `#private` access
  throws when the receiver is a Proxy
- the acceptance-test example's `owner.application.inject(...)` step is unnecessary
- `hasRegistration` has no sensible meaning for a class key
- the hierarchy check on `register` conflicts with structural matching
- `abstract` members leave nothing at runtime, so such a key cannot be shape-matched
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
