/**
 * RFC 502 -- what counts as a key.
 *
 * Split out from `index.ts` so that the key type and its runtime test sit together,
 * with nothing else depending on them.
 */
import type Owner from "@ember/owner";

/**
 * Anything usable as a DI key.
 *
 * Abstract classes are deliberately allowed: a key that is only a contract is the
 * most useful kind (see `app/library/audit/audit-sink.ts`).
 */
export type Key<T extends object = object> = abstract new (owner: Owner) => T;

/** The instance type a key resolves to. */
export type Instance<K extends Key> = K extends abstract new (owner: Owner) => infer T ? T : never;

/**
 * Distinguish `service(this, Klass)` from `service(this, () => Klass)`.
 *
 * Class constructors have a non-writable `prototype`; ordinary functions have a
 * writable one; arrow functions have none. This is the only reliable runtime
 * signal, and it is what lets the RFC's two forms share one parameter.
 */
export function isClassKey(value: unknown): value is Key {
  if (typeof value !== "function") return false;

  const descriptor = Object.getOwnPropertyDescriptor(value, "prototype");

  return descriptor !== undefined && descriptor.writable === false;
}
