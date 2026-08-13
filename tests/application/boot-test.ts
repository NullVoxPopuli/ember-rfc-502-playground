/**
 * The one test that is not co-located with a demo, because it is about all of them:
 * the app boots and every demo renders.
 */
import { visit } from "@ember/test-helpers";
import { module, test } from "qunit";
import { setupApplicationTest } from "ember-qunit";

module("Application | boot", function (hooks) {
  setupApplicationTest(hooks);

  test("every demo renders", async function (assert) {
    await visit("/");

    assert.dom("[data-test-same]").hasText("true", "counter");
    assert.dom("[data-test-depth]").hasText("0", "cycle");
    assert.dom("[data-test-impl]").hasText("BrowserCookieStore", "cookies");
    assert.dom("[data-test-summary]").hasText("explicit DI, count 0", "interop");
  });
});
