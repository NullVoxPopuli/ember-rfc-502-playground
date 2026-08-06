/**
 * RFC 502 -- "lookup by shape".
 *
 * This is the part of the RFC that solves the problem in
 * https://github.com/chancancode/ember-polaris-service/issues/19
 *
 * The problem: a library publishes a well-known key (a token / abstract class)
 * and the *app* provides the implementation. With nominal-only lookup, someone
 * has to run `owner.register(Key, Impl)` before first use, which means:
 *
 *   1. the app's provider file has to be pulled into the build at all -- nothing
 *      imports it, so a tree-shaking build drops it, and
 *   2. the registration has to be guaranteed to happen *before* the first
 *      lookup.
 *
 * Today's workaround is to import the provider file from `app.js`, which throws
 * away the laziness that was the point of the exercise.
 *
 * Shape lookup removes the initializer entirely:
 *
 *   1. discovery comes from the resolver's directory convention -- `app/services/**`
 *      is in the build because the app's module map says so, not because
 *      anything imported it, and
 *   2. binding happens on *first lookup*, which is by definition before first
 *      use, so there is no ordering hazard and nothing is eager.
 *
 * Two matching strategies are implemented, in order of decreasing safety:
 *
 * - **declared** (`static provides = [Key]`): the candidate names the key it
 *   satisfies. Nominal, unambiguous, and survives minification.
 * - **structural**: the candidate has every member the key declares. This is
 *   the literal `shapeOf` / `lookupServiceByShape` from the RFC. It needs no
 *   cooperation from the candidate at all, and it is correspondingly fuzzy --
 *   see `matchByShape` for the failure modes.
 */
import { assert } from "@ember/debug";

import { isClassKey, type Key } from "./key.ts";

/**
 * Marks a class as satisfying one or more keys.
 *
 * ```ts
 * export default class AppCookies extends Service {
 *   static provides = [CookieStore];
 * }
 * ```
 */
export interface Provider {
  provides?: readonly Key[];
}

/**
 * The candidate pool: every module the app's resolver knows about, keyed by
 * module path. This is `import.meta.glob('./services/**', { eager: true })` --
 * i.e. exactly the set of modules that the *existing* string-based resolver can
 * already reach without anybody importing them.
 */
export type Candidates = Record<string, unknown>;

const POOLS: Candidates[] = [];

/**
 * Contribute a module map to the candidate pool. Called once from `app.ts`.
 *
 * The point of issue #19's problem (1) is that this glob is what puts the
 * provider in the build. Shape lookup piggybacks on it rather than requiring an
 * import from the app entrypoint.
 */
export function addCandidates(candidates: Candidates): void {
  POOLS.push(candidates);
}

/**
 * Withdraw a previously added pool.
 *
 * Only needed by tests that want to observe matching against a synthetic pool
 * without disturbing the app's. In a real implementation the pool is the
 * resolver's module map and is not mutable at all.
 */
export function removeCandidates(candidates: Candidates): void {
  const at = POOLS.indexOf(candidates);

  if (at !== -1) POOLS.splice(at, 1);
}

/** Reset the pool. Tests only. */
export function clearCandidates(): void {
  POOLS.length = 0;
}

interface Candidate {
  moduleName: string;
  klass: Key & Provider;
}

function* eachCandidate(): Generator<Candidate> {
  for (const pool of POOLS) {
    for (const [moduleName, module] of Object.entries(pool)) {
      if (typeof module !== "object" || module === null) continue;

      const exported = (module as { default?: unknown }).default;

      if (exported && isClassKey(exported)) {
        yield { moduleName, klass: exported };
      }
    }
  }
}

/**
 * The runtime shape of a key: the member names it declares.
 *
 * TypeScript's `abstract` members do not exist at runtime, so a key class that
 * wants to be structurally matchable has to declare its members in a way that
 * survives to runtime. The practical pattern is a method body that throws:
 *
 * ```ts
 * export class CookieStore {
 *   get(key: string): string | undefined { throw notImplemented('get'); }
 * }
 * ```
 *
 * Those *are* on `CookieStore.prototype`, so they are readable here. This is
 * the single biggest ergonomic cost of structural matching and it is worth
 * being explicit about in the RFC: `abstract` alone is not enough.
 */
export function shapeOf(key: Key): string[] {
  const names = new Set<string>();

  let proto: object | null = key.prototype as object;

  while (proto && proto !== Object.prototype) {
    for (const name of Object.getOwnPropertyNames(proto)) {
      if (name === "constructor") continue;
      names.add(name);
    }

    proto = Object.getPrototypeOf(proto) as object | null;
  }

  return [...names];
}

function satisfiesShape(candidate: Key, shape: string[]): boolean {
  if (shape.length === 0) return false;

  return shape.every((name) => name in (candidate.prototype as object));
}

export interface Match {
  klass: Key;
  moduleName: string;
  /** How the candidate was matched -- reported in assertion messages. */
  via: "declared" | "subclass" | "structural";
}

/**
 * Find the single candidate that satisfies `key`, or `undefined`.
 *
 * Ambiguity is an error rather than a coin flip: if two modules both satisfy a
 * key, no answer is defensible and silently picking one produces a bug that
 * only shows up as "the wrong service" much later.
 */
export function matchByShape(key: Key): Match | undefined {
  const declared: Match[] = [];
  const subclasses: Match[] = [];
  const structural: Match[] = [];
  const shape = shapeOf(key);

  for (const { moduleName, klass } of eachCandidate()) {
    if (klass === key) continue;

    if (klass.provides?.includes(key)) {
      declared.push({ klass, moduleName, via: "declared" });
      continue;
    }

    if (klass.prototype instanceof key) {
      subclasses.push({ klass, moduleName, via: "subclass" });
      continue;
    }

    if (satisfiesShape(klass, shape)) {
      structural.push({ klass, moduleName, via: "structural" });
    }
  }

  // Strictly ordered: an explicit `provides` always beats an accidental
  // structural match, so adding a method to an unrelated service can never
  // silently steal a binding that was declared.
  const tier = [declared, subclasses, structural].find((matches) => matches.length > 0);

  if (!tier) return undefined;

  const [winner] = tier;

  assert("a non-empty tier always has a first element", winner);

  assert(
    `Ambiguous shape lookup for ${key.name}: ` +
      `${tier.map((m) => `${m.klass.name} (${m.moduleName})`).join(", ")} all satisfy it ` +
      `via "${winner.via}". Disambiguate with an explicit owner.register(${key.name}, Impl).`,
    tier.length === 1,
  );

  return winner;
}
