/**
 * RFC 502 -- the examples from the RFC text, executed.
 *
 * The RFC writes these as owner methods:
 *
 * ```ts
 * appInstance.register(MyFooService, MyFooService);
 * appInstance.lookup(MyFooService);
 * ```
 *
 * A shim cannot widen Ember's published signatures, so they are functions here.
 * The owner is still the container -- `lookup(owner, Key)` reads and writes a
 * `WeakMap` keyed on that same owner. Only the calling convention differs from
 * what the RFC proposes.
 */
import { module, test } from "qunit";
import { setupTest } from "ember-qunit";

import { hasBinding, lookup, register, unregister } from "#app/di/index.ts";
import Counter from "#app/domain/counter.ts";
import Logger from "#app/domain/logger.ts";
import FeatureFlags from "#app/services/feature-flags.ts";

class MyFooService {
  count = 0;

  add() {
    this.count++;
  }
}

class MyFooOverrideService extends MyFooService {
  override add() {
    this.count += 2;
  }
}

module("Unit | di | RFC examples", function (hooks) {
  setupTest(hooks);

  /**
   * appInstance.register(MyFooService, MyFooService);
   * appInstance.lookup(MyFooService);
   */
  test("register and lookup by class", function (assert) {
    register(this.owner, MyFooService, MyFooService);

    const service = lookup(this.owner, MyFooService);

    assert.true(service instanceof MyFooService);

    service.add();

    assert.strictEqual(service.count, 1, "the type came from the key, with no registry entry");
  });

  /**
   * appInstance.register(MyFooService, MyFooOverrideService);
   * service instanceof MyFooOverrideService // true
   * service instanceof MyFooService // true
   */
  test("override by registering a subclass under the same key", function (assert) {
    register(this.owner, MyFooService, MyFooOverrideService);

    const service = lookup(this.owner, MyFooService);

    assert.true(service instanceof MyFooOverrideService);
    assert.true(service instanceof MyFooService);

    service.add();

    assert.strictEqual(service.count, 2);
  });

  /**
   * "the above service has not been registered yet"
   * "first time lookup without registration will register for you."
   */
  test("less typing for lazy registration", function (assert) {
    const myFooService = lookup(this.owner, MyFooService);

    assert.true(myFooService instanceof MyFooService);
  });

  test("bindings can be inspected and withdrawn by class", function (assert) {
    assert.false(hasBinding(this.owner, Counter));

    register(this.owner, Counter, Counter);

    assert.true(hasBinding(this.owner, Counter));

    unregister(this.owner, Counter);

    assert.false(hasBinding(this.owner, Counter));
  });

  /**
   * Class keys and string services have to coexist for the whole migration.
   */
  test("string services still work, in their own namespace", function (assert) {
    const flags = this.owner.lookup("service:feature-flags");

    assert.true(flags instanceof FeatureFlags, "the string form still resolves");

    // `FeatureFlags` the *class* is a different key than `service:feature-flags`
    // the *name*, even though the resolver would map that name to this class.
    assert.notStrictEqual(
      lookup(this.owner, FeatureFlags),
      flags,
      "class keys never silently fall back to name resolution",
    );

    assert.true(lookup(this.owner, Logger) instanceof Logger, "and class keys work alongside");
  });
});
