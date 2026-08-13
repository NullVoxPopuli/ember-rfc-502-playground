import { click, render } from "@ember/test-helpers";
import { module, test } from "qunit";
import { setupRenderingTest } from "ember-qunit";

import { lookup, register } from "#app/di/index.ts";

import Counter from "./counter.ts";
import CounterDemo from "./demo.gts";

class DoubleCounter extends Counter {
  override increment = () => {
    this.count += 2;
  };
}

module("Demo | counter", function (hooks) {
  setupRenderingTest(hooks);

  test("both injection forms resolve to one instance", async function (assert) {
    await render(<template><CounterDemo /></template>);

    assert.dom("[data-test-same]").hasText("true");

    await click("[data-test-increment]");

    assert.dom("[data-test-count]").hasText("1");
    assert.strictEqual(lookup(this.owner, Counter).count, 1, "the test sees that instance too");
  });

  /**
   * The stub is a class in this file. It does not have to live anywhere in
   * particular, and the resolver never sees it.
   */
  test("a stub registered under the key replaces it", async function (assert) {
    register(this.owner, Counter, DoubleCounter);

    await render(<template><CounterDemo /></template>);
    await click("[data-test-increment]");

    assert.dom("[data-test-count]").hasText("2");
    assert.true(lookup(this.owner, Counter) instanceof DoubleCounter);
  });

  test("stubbing after render is refused rather than ignored", async function (assert) {
    await render(<template><CounterDemo /></template>);

    assert.throws(
      () => register(this.owner, Counter, DoubleCounter),
      /has already been resolved on this owner/,
    );
  });
});
