# rfc-502-playground

A runnable prototype of [RFC 502 — Explicit Dependency Injection](https://github.com/emberjs/rfcs/pull/502),
built to check the proposal's ergonomics against real `ember-source` 7 rather than
to be shipped.

## The implementation

The owner is the container, so there is no second container here — the whole
mechanism is a `WeakMap` keyed on the owner, using `getOwner` and `setOwner` from
`@ember/owner`. 130 lines: `app/di/index.ts` is `lookup` / `register` /
`unregister` and `service` in all its forms, `app/di/key.ts` is what counts as a key.

Interface / shape matching is out of scope for the RFC, so it isn't implemented here
either. A library whose dependency the app supplies keeps a string key.

## The demos

Each demo is one folder holding its services, its component, and its test — which is
only possible because a class key makes the import the registration. `pnpm test`
runs 23 tests.

| folder               | shows                                                       |
| -------------------- | ----------------------------------------------------------- |
| `app/demos/counter/` | a service extending nothing; both injection forms; stubbing |
| `app/demos/cycle/`   | two services injecting each other across a module cycle     |
| `app/demos/cookies/` | an abstract key with the implementation chosen at boot      |
| `app/demos/interop/` | a string key and a class key in the same class              |

Two things deliberately sit outside that structure:

- `app/di/di-test.ts` — the registry semantics, next to the implementation
- `app/services/feature-flags.ts` — a string-keyed service, which _has_ to live in
  `app/services/` for the resolver to find it. That contrast is the point.

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

## In the browser

`pnpm start`, then open the app — `app/templates/application.gts` renders every demo.

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
