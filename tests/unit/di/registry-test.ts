/**
 * RFC 502 -- the registry semantics the RFC promises, one test per claim.
 */
import { destroy } from "@ember/destroyable";
import { settled } from "@ember/test-helpers";
import { module, test } from "qunit";
import { setupTest } from "ember-qunit";

import { hasBinding, isResolved, lookup, register, unregister } from "#app/di/index.ts";
import Counter from "#app/domain/counter.ts";
import Logger from "#app/domain/logger.ts";

class SubCounter extends Counter {
  override increment = () => {
    this.count += 2;
  };
}

class Unrelated {}

module("Unit | di | registry", function (hooks) {
  setupTest(hooks);

  /**
   * "no registration needed, because MyClass could be in a dynamic bundle"
   */
  test("an unregistered key resolves itself on first use", function (assert) {
    assert.false(hasBinding(this.owner, Counter), "no binding up front");
    assert.false(isResolved(this.owner, Counter), "and nothing instantiated");

    const counter = lookup(this.owner, Counter);

    assert.true(counter instanceof Counter);
    assert.true(isResolved(this.owner, Counter), "now it is resolved");
    assert.false(hasBinding(this.owner, Counter), "still with no explicit binding");
  });

  test("the same key resolves to the same instance on one owner", function (assert) {
    assert.strictEqual(lookup(this.owner, Counter), lookup(this.owner, Counter));
  });

  /**
   * "both stubbing (in a test), or clobbering, would look the same"
   */
  test("registering a subclass under the key replaces the implementation", function (assert) {
    register(this.owner, Counter, SubCounter);

    const counter = lookup(this.owner, Counter);

    assert.true(counter instanceof SubCounter, "got the override");
    assert.true(counter instanceof Counter, "still satisfies the key");

    counter.increment();

    assert.strictEqual(counter.count, 2, "the override behaviour is what runs");
  });

  /**
   * "Logic will be added to the register method to ensure that the lookup type
   * either is the same as the service instance's type or is an ancestor type."
   */
  test("registering an unrelated class is an error", function (assert) {
    assert.throws(
      () => register(this.owner, Counter, Unrelated),
      /is neither Counter nor a subclass of it/,
    );
  });

  /**
   * Not in the RFC, and worth adding: today, re-registering a string-keyed
   * service after it has been resolved silently does nothing. The most common
   * way to get bitten is stubbing after `render`.
   */
  test("registering after the key has been resolved is an error, not a silent no-op", function (assert) {
    lookup(this.owner, Counter);

    assert.throws(
      () => register(this.owner, Counter, SubCounter),
      /has already been resolved on this owner/,
    );
  });

  test("unregister forgets the binding and the instance", function (assert) {
    register(this.owner, Counter, SubCounter);

    const first = lookup(this.owner, Counter);

    unregister(this.owner, Counter);

    assert.false(hasBinding(this.owner, Counter));
    assert.false(isResolved(this.owner, Counter));
    assert.notStrictEqual(lookup(this.owner, Counter), first, "a fresh instance after unregister");
  });

  /**
   * A service does not have to extend anything -- but it may.
   */
  test("an EmberObject-based key is registered directly, a plain class is wrapped", function (assert) {
    const logger = lookup(this.owner, Logger);

    assert.true(logger instanceof Logger, "Service subclass resolves");

    logger.log("hello");

    assert.deepEqual(logger.lines, ["hello"]);
    assert.true(lookup(this.owner, Counter) instanceof Counter, "plain class resolves");
  });

  /**
   * `lookup` calls `associateDestroyableChild(owner, instance)`, so
   * `registerDestructor` works with no base class and no `willDestroy` hook.
   */
  test("a plain-class service is destroyed with its owner", async function (assert) {
    const counter = lookup(this.owner, Counter);

    assert.false(counter.destroyed);

    destroy(this.owner);
    await settled();

    assert.true(counter.destroyed, "the destructor ran");
  });
});
