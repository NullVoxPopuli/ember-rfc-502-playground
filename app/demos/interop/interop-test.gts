import { click, render } from "@ember/test-helpers";
import { module, test } from "qunit";
import { setupRenderingTest } from "ember-qunit";

import Counter from "#app/demos/counter/counter.ts";
import { lookup } from "#app/di/index.ts";
import FeatureFlags from "#app/services/feature-flags.ts";

import Dashboard from "./dashboard.ts";
import InteropDemo from "./demo.gts";

module("Demo | interop", function (hooks) {
  setupRenderingTest(hooks);

  test("both kinds of injection resolve in one class", async function (assert) {
    await render(<template><InteropDemo /></template>);

    assert.dom("[data-test-summary]").hasText("explicit DI, count 0");

    await click("[data-test-bump]");

    assert.dom("[data-test-summary]").hasText("explicit DI, count 1");
  });

  test("a class key and a string name are different keys", function (assert) {
    const byName = this.owner.lookup("service:feature-flags");
    const byClass = lookup(this.owner, FeatureFlags);

    assert.true(byName instanceof FeatureFlags, "the string form still resolves");
    assert.true(byClass instanceof FeatureFlags);
    assert.notStrictEqual(byClass, byName, "class lookup never falls back to name resolution");
  });

  test("the dashboard shares the app's Counter instance", function (assert) {
    assert.strictEqual(lookup(this.owner, Dashboard).counter, lookup(this.owner, Counter));
  });
});
