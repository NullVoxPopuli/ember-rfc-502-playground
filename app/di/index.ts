/**
 * RFC 502 -- Explicit Dependency Injection.
 *
 * A userland prototype of https://github.com/emberjs/rfcs/pull/502, built to
 * validate the ergonomics of the proposal.
 *
 * The whole mechanism is a `WeakMap` keyed on the owner. There is no second
 * container here: the owner *is* the container, and `getOwner` / `setOwner` from
 * `@ember/owner` are all that is needed to participate in it. Instances are
 * per-owner singletons because the outer key is the owner, and they are torn down
 * with the owner because `associateDestroyableChild` says so.
 *
 * ```ts
 * import { service } from '#app/di/index.ts';
 * import Notifications from './notifications.ts';
 *
 * class Demo {
 *   @service(Notifications) notifications;      // lazy
 *   also = service(this, Notifications);        // resolves now
 *   safe = service(this, () => Notifications);  // cycle-tolerant
 * }
 *
 * lookup(owner, Notifications);                 // owner.lookup(Notifications)
 * register(owner, Notifications, Stub);         // owner.register(Notifications, Stub)
 * ```
 *
 * A real implementation would put `lookup` and `register` on the owner itself, so
 * that these read as `owner.lookup(Notifications)`. They are functions here only
 * because a shim cannot widen Ember's published signatures.
 */
import { assert } from "@ember/debug";
import { associateDestroyableChild, isDestroyed } from "@ember/destroyable";
import { getOwner, setOwner } from "@ember/owner";
import { service as emberService } from "@ember/service";

import { type Instance, isClassKey, type Key } from "./key.ts";

import type Owner from "@ember/owner";
import type { Registry as ServiceRegistry } from "@ember/service";

export { type Instance, isClassKey, type Key } from "./key.ts";

/** A key, or a function returning one. The thunk defers evaluating the reference. */
export type KeyOrThunk<K extends Key> = K | (() => K);

/** An owner, or any object that has one: a component, route, service, test context. */
export type Context = Owner | object;

/** owner -> key -> instance. The outer key is what makes instances per-owner. */
const INSTANCES = new WeakMap<Owner, Map<Key, object>>();

/** owner -> key -> implementation, for `register(owner, Key, Impl)`. */
const BINDINGS = new WeakMap<Owner, Map<Key, Key>>();

/** Collapse `Key | () => Key` down to a `Key`. */
export function resolveKey<K extends Key>(keyOrThunk: KeyOrThunk<K>): K {
  return isClassKey(keyOrThunk) ? keyOrThunk : keyOrThunk();
}

/**
 * The owner responsible for `context`.
 *
 * `getOwner(owner)` is undefined -- an owner does not have an owner -- so a raw
 * owner is treated as its own context. That is what lets both `lookup(this, Key)`
 * from inside a component and `lookup(this.owner, Key)` from a test work.
 */
function ownerOf(context: Context): Owner {
  const owner = getOwner(context) ?? (context as Owner);

  assert(
    `Cannot resolve a dependency from ${context.constructor?.name ?? "an object"}: it has no ` +
      `owner. Objects only have an owner if the container made them, or if setOwner was called.`,
    typeof owner.lookup === "function",
  );

  return owner;
}

/**
 * Instantiate `impl` for `owner`.
 *
 * Two paths, because a service under this RFC does not have to extend anything:
 *
 * - `EmberObject` descendants must go through `create`; Ember asserts on `new`.
 *   Setting the owner on the props object is exactly what the container does.
 * - anything else is a plain class, constructed with the owner and then handed to
 *   `setOwner` so that `getOwner(instance)` and nested injections work.
 */
function instantiate(impl: Key, owner: Owner): object {
  const asFactory = impl as unknown as { create?: (props: object) => object };

  if (typeof asFactory.create === "function") {
    const props = {};

    setOwner(props, owner);

    return asFactory.create(props);
  }

  const instance = new (impl as unknown as new (owner: Owner) => object)(owner);

  setOwner(instance, owner);

  return instance;
}

/**
 * `owner.register(Key, Impl)`.
 *
 * Per the RFC: "Logic will be added to the register method to ensure that the
 * lookup type either is the same as the service instance's type or is an ancestor
 * type."
 */
export function register<K extends Key>(context: Context, key: K, impl: Key = key): void {
  const owner = ownerOf(context);

  assert(
    `Cannot register ${impl.name} under the key ${key.name}: ${impl.name} is neither ${key.name} ` +
      `nor a subclass of it. Registering an unrelated class would break the class hierarchy that ` +
      `consumers of the key rely on.`,
    impl === key || impl.prototype instanceof key,
  );

  assert(
    `${key.name} has already been resolved on this owner, so registering ${impl.name} against it ` +
      `would silently have no effect. Register before the first lookup -- in a test, that means ` +
      `before render or visit.`,
    !INSTANCES.get(owner)?.has(key),
  );

  let bindings = BINDINGS.get(owner);

  if (!bindings) {
    bindings = new Map();
    BINDINGS.set(owner, bindings);
  }

  bindings.set(key, impl);
}

/**
 * Whether an explicit `register(owner, Key, Impl)` override is in place.
 *
 * A finding for the RFC: `hasRegistration` does not survive the move to class
 * keys. Today it answers "can the resolver find this name", and the answer can be
 * no. A class key is *always* resolvable -- worst case it instantiates itself --
 * so the same question is trivially yes for every key, and the method becomes
 * useless. The two things callers actually want are this and {@link isResolved},
 * and the RFC should say which of them (if either) `hasRegistration` becomes.
 */
export function hasBinding(context: Context, key: Key): boolean {
  return BINDINGS.get(ownerOf(context))?.has(key) ?? false;
}

/** Whether this owner has already instantiated `key`. */
export function isResolved(context: Context, key: Key): boolean {
  return INSTANCES.get(ownerOf(context))?.has(key) ?? false;
}

/** `owner.unregister(Key)` */
export function unregister(context: Context, key: Key): void {
  const owner = ownerOf(context);

  BINDINGS.get(owner)?.delete(key);
  INSTANCES.get(owner)?.delete(key);
}

/**
 * `owner.lookup(Key)`.
 *
 * Resolution order, matching the RFC's `service(nameOrClass)` sketch:
 *
 * 1. an already-resolved instance for this owner
 * 2. an explicit `register(owner, Key, Impl)` binding
 * 3. otherwise the key instantiates itself -- "first time lookup without
 *    registration will register for you"
 */
export function lookup<K extends Key>(context: Context, key: K): Instance<K> {
  const owner = ownerOf(context);

  let instances = INSTANCES.get(owner);

  if (!instances) {
    instances = new Map();
    INSTANCES.set(owner, instances);
  }

  const existing = instances.get(key);

  if (existing) return existing as Instance<K>;

  assert(
    `Cannot look up ${key.name} on an owner that has already been destroyed.`,
    !isDestroyed(owner),
  );

  const impl = BINDINGS.get(owner)?.get(key) ?? key;
  const instance = instantiate(impl, owner);

  // Teardown with the owner, with no base class and no `willDestroy` hook: a
  // plain class only needs `registerDestructor(this, ...)`.
  associateDestroyableChild(owner, instance);

  instances.set(key, instance);

  return instance as Instance<K>;
}

/**
 * A legacy ("stage 1") decorator, which is what `decorator-transforms` and
 * `@ember/service`'s own `service` both produce.
 *
 * The declared return type is `void` even though the implementation returns a
 * property descriptor: TypeScript's `experimentalDecorators` mode rejects a field
 * decorator declared to return anything else (TS1271), while the runtime contract
 * is "return a descriptor to replace the field". That mismatch is an artifact of
 * legacy decorators and disappears under standard decorators.
 */
export type Decorator = (target: object, propertyKey: string | symbol, descriptor?: object) => void;

/** The one-argument form: `@service(MyService) myService;` -- lazy. */
function decoratorFor<K extends Key>(keyOrThunk: KeyOrThunk<K>): Decorator {
  const decorator = function (_target: object, propertyKey: string | symbol) {
    return {
      configurable: true,
      enumerable: true,

      get(this: object): Instance<K> {
        return lookup(this, resolveKey(keyOrThunk));
      },

      // Assignment replaces the injection on that one instance, matching how
      // `@service` behaves today (and how a lot of older test code stubs).
      set(this: object, value: Instance<K>) {
        Object.defineProperty(this, propertyKey, {
          configurable: true,
          enumerable: true,
          writable: true,
          value,
        });
      },
    };
  };

  return decorator;
}

/**
 * Every form of the RFC's `service`, dispatching on the type of the parameter.
 *
 * - `service(Key)` / `service(() => Key)` -- a lazy decorator.
 * - `service(this, Key)` / `service(this, () => Key)` -- resolves immediately.
 * - `service('name')` -- delegates to `@ember/service`, unchanged.
 *
 * The string form is what makes this a drop-in: one import serves both styles, so
 * a migration can be injection-by-injection rather than all-at-once. The RFC asks
 * for exactly this ("the service pseudo-function should check for the type of the
 * parameter").
 *
 * The two-argument form resolves at construction time. A field initializer has to
 * evaluate to something, so deferring would mean returning a stand-in, and the only
 * candidate -- a Proxy -- breaks private-field access (`this.#state` throws when the
 * receiver is a Proxy) and identity. Use the decorator, or a getter, when laziness
 * matters:
 *
 * ```ts
 * get myService() { return service(this, MyService); }  // the WeakMap caches it
 * ```
 */
export function service<N extends keyof ServiceRegistry & string>(name: N): Decorator;
export function service<K extends Key>(keyOrThunk: KeyOrThunk<K>): Decorator;
export function service<K extends Key>(context: Context, keyOrThunk: KeyOrThunk<K>): Instance<K>;

export function service<K extends Key>(
  contextOrKey: Context | KeyOrThunk<K> | string,
  maybeKey?: KeyOrThunk<K>,
): Instance<K> | Decorator {
  if (typeof contextOrKey === "string") {
    return emberService(contextOrKey);
  }

  if (maybeKey === undefined) {
    return decoratorFor(contextOrKey as KeyOrThunk<K>);
  }

  return lookup(contextOrKey, resolveKey(maybeKey));
}
