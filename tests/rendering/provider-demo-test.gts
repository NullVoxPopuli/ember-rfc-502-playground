/**
 * RFC 502 -- app-provided library tokens, end to end in a rendering test.
 *
 * The interesting assertion is the first one: the app's `ConsoleTransport` is
 * bound to the library's `Transport` token during render, in a test, with no
 * initializer having run and nothing having imported the provider.
 */
import { click, render } from "@ember/test-helpers";
import { module, test } from "qunit";
import { setupRenderingTest } from "ember-qunit";

import { lookup, register } from "#app/di/index.ts";
import Transport from "#app/library/analytics/transport.ts";
import AuditSink from "#app/library/audit/audit-sink.ts";
import ProviderDemo from "#components/provider-demo.gts";

import type ConsoleTransport from "#app/services/console-transport.ts";

class TestTransport extends Transport {
  readonly sent: string[] = [];

  override send(event: string): void {
    this.sent.push(event);
  }

  override flush(): void {}
}

module("Rendering | provider-demo", function (hooks) {
  setupRenderingTest(hooks);

  test("the app satisfies a library token with no initializer", async function (assert) {
    await render(<template><ProviderDemo /></template>);

    assert.dom("[data-test-transport]").hasText("ConsoleTransport");
    assert.dom("[data-test-transport-via]").hasText("structural");

    assert.dom("[data-test-audit]").hasText("AuditLog");
    assert.dom("[data-test-audit-via]").hasText("declared");
  });

  test("the library service talks to the app implementation", async function (assert) {
    await render(<template><ProviderDemo /></template>);
    await click("[data-test-track]");

    assert.dom("[data-test-sent]").hasText("1");

    const transport = lookup(this.owner, Transport) as ConsoleTransport;

    assert.deepEqual(
      transport.events.map((event) => event.event),
      ["button-clicked"],
    );

    assert.deepEqual(lookup(this.owner, AuditSink), lookup(this.owner, AuditSink), "singleton");
  });

  /**
   * The stub does not have to live anywhere in particular, and does not have to
   * be reachable by the resolver -- it is a class in the test file.
   */
  test("a test can override an app-provided token", async function (assert) {
    register(this.owner, Transport, TestTransport);

    await render(<template><ProviderDemo /></template>);
    await click("[data-test-track]");

    const transport = lookup(this.owner, Transport);

    assert.true(transport instanceof TestTransport);
    assert.deepEqual((transport as TestTransport).sent, ["button-clicked"]);
  });
});
