import { click, render } from "@ember/test-helpers";
import { module, test } from "qunit";
import { setupRenderingTest } from "ember-qunit";

import { lookup, register } from "#app/di/index.ts";

import { BrowserCookieStore, CookieStore, MemoryCookieStore } from "./cookie-store.ts";
import CookiesDemo from "./demo.gts";

module("Demo | cookies", function (hooks) {
  setupRenderingTest(hooks);

  test("the instance initializer chose an implementation", async function (assert) {
    await render(<template><CookiesDemo /></template>);

    assert.dom("[data-test-impl]").hasText("BrowserCookieStore");
    assert.true(lookup(this.owner, CookieStore) instanceof BrowserCookieStore);

    await click("[data-test-write]");

    assert.dom("[data-test-value]").hasText("explicit");
  });

  /** The same swap the initializer does, done by a test instead. */
  test("a test can choose a different implementation", async function (assert) {
    register(this.owner, CookieStore, MemoryCookieStore);

    await render(<template><CookiesDemo /></template>);

    assert.dom("[data-test-impl]").hasText("MemoryCookieStore");

    await click("[data-test-write]");

    assert.dom("[data-test-value]").hasText("explicit");
    assert.true(lookup(this.owner, CookieStore) instanceof MemoryCookieStore);
  });
});
