/**
 * The registry semantics the RFC promises, one test per claim. Quoted lines are
 * from the RFC text.
 */
import { destroy } from "@ember/destroyable";
import { settled } from "@ember/test-helpers";
import { module, test } from "qunit";
import { setupTest } from "ember-qunit";

import Counter from "#app/demos/counter/counter.ts";
import FeatureFlags from "#app/services/feature-flags.ts";

import { hasBinding, isResolved, lookup, register, unregister } from "./index.ts";

class SubCounter extends Counter {
  override increment = () => {
    this.count += 2;
  };
}

class Unrelated {}

module("Unit | di", function (hooks) {
  setupTest(hooks);

  /** "no registration needed, because MyClass could be in a dynamic bundle" */
  test("an unregistered key resolves itself on first use", function (assert) {
    assert.false(hasBinding(this.owner, Counter), "no binding up front");
    assert.false(isResolved(this.owner, Counter), "nothing instantiated");

    assert.true(lookup(this.owner, Counter) instanceof Counter);
    assert.true(isResolved(this.owner, Counter), "now resolved");
    assert.false(hasBinding(this.owner, Counter), "still with no explicit binding");
  });

  test("one instance per owner", function (assert) {
    assert.strictEqual(lookup(this.owner, Counter), lookup(this.owner, Counter));
  });

  /** "both stubbing (in a test), or clobbering, would look the same" */
  test("registering a subclass replaces the implementation", function (assert) {
    register(this.owner, Counter, SubCounter);

    const counter = lookup(this.owner, Counter);

    assert.true(counter instanceof SubCounter, "got the override");
    assert.true(counter instanceof Counter, "still satisfies the key");

    counter.increment();

    assert.strictEqual(counter.count, 2, "the override runs");
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

  /** Today the equivalent silently does nothing. */
  test("registering after resolution is an error, not a silent no-op", function (assert) {
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
    assert.notStrictEqual(lookup(this.owner, Counter), first, "a fresh instance");
  });

  /** A service does not have to extend anything -- but it may. */
  test("an EmberObject-based key goes through create, a plain class through new", function (assert) {
    const flags = lookup(this.owner, FeatureFlags);

    assert.true(flags instanceof FeatureFlags, "Service subclass resolves");
    assert.true(flags.isEnabled("explicit-di"), "and was initialized");
    assert.true(lookup(this.owner, Counter) instanceof Counter, "plain class resolves");
  });

  /** `lookup` associates the instance with the owner, so no base class is needed. */
  test("a plain-class service is destroyed with its owner", async function (assert) {
    const counter = lookup(this.owner, Counter);

    assert.false(counter.destroyed);

    destroy(this.owner);
    await settled();

    assert.true(counter.destroyed, "the destructor ran");
  });
});
