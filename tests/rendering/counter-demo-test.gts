/**
 * RFC 502 -- the "Integration Tests" section, made runnable.
 *
 * The RFC's example is:
 *
 * ```ts
 * hooks.beforeEach(function(assert) {
 *   this.owner.register(LocationService, LocationStub);
 * });
 * ```
 *
 * Note what is *absent* compared to the acceptance-test example in the RFC: no
 * `owner.application.inject('route:the-route', 'myService', ServiceToOverride)`.
 * That second step exists in the RFC text because of how `inject` used to work;
 * it is not needed, and the RFC should drop it. Registering under the key is
 * sufficient, because the injection resolves through the container on access.
 */
import { click, render } from "@ember/test-helpers";
import { module, test } from "qunit";
import { setupRenderingTest } from "ember-qunit";

import { lookup, register } from "#app/di/index.ts";
import ActivityLog from "#app/domain/activity-log.ts";
import Counter from "#app/domain/counter.ts";
import CounterDemo from "#components/counter-demo.gts";

class DoubleCounter extends Counter {
  override increment = () => {
    this.count += 2;
  };
}

module("Rendering | counter-demo", function (hooks) {
  setupRenderingTest(hooks);

  test("every injection form resolves to the same instance", async function (assert) {
    await render(<template><CounterDemo /></template>);

    assert.dom("[data-test-same-instance]").hasText("true");
    assert.dom("[data-test-count]").hasText("0");

    await click("[data-test-bump]");

    assert.dom("[data-test-count]").hasText("1");
  });

  test("the component and the test share the owner's instance", async function (assert) {
    await render(<template><CounterDemo /></template>);
    await click("[data-test-bump]");

    assert.strictEqual(lookup(this.owner, Counter).count, 1, "same singleton");
  });

  test("services injected into services are wired up", async function (assert) {
    await render(<template><CounterDemo /></template>);
    await click("[data-test-bump]");

    assert.dom("[data-test-activity] li").exists({ count: 1 });
    assert.dom("[data-test-activity] li").hasText("bumped (count was 1)");

    // ActivityLog injected Logger through a getter; Logger got the message.
    assert.dom("[data-test-log] li").hasText("bumped (count was 1)");
    assert.deepEqual(lookup(this.owner, ActivityLog).entries, ["bumped (count was 1)"]);
  });

  test("a stub registered under the key replaces it everywhere", async function (assert) {
    register(this.owner, Counter, DoubleCounter);

    await render(<template><CounterDemo /></template>);
    await click("[data-test-bump]");

    assert.dom("[data-test-count]").hasText("2", "the stub is what the component uses");
    assert.true(lookup(this.owner, Counter) instanceof DoubleCounter);
  });

  test("stubbing after render is refused rather than silently ignored", async function (assert) {
    await render(<template><CounterDemo /></template>);

    assert.throws(
      () => register(this.owner, Counter, DoubleCounter),
      /has already been resolved on this owner/,
    );
  });
});
