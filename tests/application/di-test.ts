/**
 * RFC 502 -- the "Acceptance Tests" section, made runnable.
 *
 * The RFC's example registers the stub in `beforeEach` and then calls
 * `owner.application.inject(...)`. Only the first half is needed; see the note
 * in `tests/rendering/counter-demo-test.gts`.
 *
 * This also covers the RFC's FastBoot example: `app/app.ts` binds `CookieStore`
 * to a concrete implementation in an instance initializer, and the app under test
 * gets whichever one the environment selected.
 */
import { click, visit } from "@ember/test-helpers";
import { module, test } from "qunit";
import { setupApplicationTest } from "ember-qunit";

import { lookup, register } from "#app/di/index.ts";
import BrowserCookieStore from "#app/domain/cookies/browser-cookie-store.ts";
import CookieStore from "#app/domain/cookies/cookie-store.ts";
import Counter from "#app/domain/counter.ts";

class StubbedCounter extends Counter {
  override increment = () => {
    this.count = 100;
  };
}

module("Application | explicit DI", function (hooks) {
  setupApplicationTest(hooks);

  test("the whole demo boots", async function (assert) {
    await visit("/");

    assert.dom("[data-test-count]").hasText("0");
    assert.dom("[data-test-same-instance]").hasText("true");
    assert.dom("[data-test-transport]").hasText("ConsoleTransport");
    assert.dom("[data-test-summary]").hasText("explicit DI, count 0");
  });

  test("an instance initializer chose the CookieStore implementation", async function (assert) {
    await visit("/");

    assert.dom("[data-test-cookie-impl]").hasText("BrowserCookieStore");
    assert.true(lookup(this.owner, CookieStore) instanceof BrowserCookieStore);

    await click("[data-test-write-cookie]");

    assert.strictEqual(lookup(this.owner, CookieStore).get("rfc-502"), "explicit");
  });

  test("a service can be stubbed for the whole application", async function (assert) {
    register(this.owner, Counter, StubbedCounter);

    await visit("/");
    await click("[data-test-bump]");

    assert.dom("[data-test-count]").hasText("100", "the stub is in play app-wide");
    assert
      .dom("[data-test-summary]")
      .hasText("explicit DI, count 100", "including other consumers");
  });

  test("interop: string and class injections coexist in a booted app", async function (assert) {
    await visit("/");

    assert.dom("[data-test-flags]").hasText("explicit-di");
    assert.dom("[data-test-round-trip]").hasText("");

    await click("[data-test-type]");

    assert.dom("[data-test-content]").hasText("revision 1");
    assert.dom("[data-test-round-trip]").hasText("revision 1");
    assert.dom("[data-test-depth]").hasText("1");
  });
});
