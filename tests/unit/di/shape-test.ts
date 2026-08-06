/**
 * RFC 502 -- "lookup by shape", and the polaris-service#19 solve.
 */
import { module, test } from "qunit";
import { setupTest } from "ember-qunit";

import { lookup, matchByShape, register, shapeOf } from "#app/di/index.ts";
import Analytics from "#app/library/analytics/analytics.ts";
import Transport from "#app/library/analytics/transport.ts";
import AuditSink from "#app/library/audit/audit-sink.ts";
import AuditLog from "#app/services/audit-log.ts";
import ConsoleTransport from "#app/services/console-transport.ts";

/** A stub with the right shape but registered explicitly, to prove precedence. */
class RecordingTransport extends Transport {
  readonly sent: string[] = [];

  override send(event: string): void {
    this.sent.push(event);
  }

  override flush(): void {}
}

module("Unit | di | shape lookup", function (hooks) {
  setupTest(hooks);

  test("shapeOf reads the members a key declares at runtime", function (assert) {
    assert.deepEqual(shapeOf(Transport).sort(), ["flush", "send"]);
  });

  /**
   * `abstract` members leave nothing behind, which is the trap worth documenting:
   * a key written the "obvious" TypeScript way cannot be matched structurally.
   */
  test("a purely abstract key has no runtime shape", function (assert) {
    assert.deepEqual(shapeOf(AuditSink), [], "nothing to match against");
  });

  /**
   * polaris-service#19: the app provides the library's token, and nothing
   * imported the provider or ran an initializer to make it happen.
   */
  test("a library token is satisfied structurally by an app service", function (assert) {
    const match = matchByShape(Transport);

    assert.strictEqual(match?.klass, ConsoleTransport, "found the app implementation");
    assert.strictEqual(match?.via, "structural");
    assert.true(match?.moduleName.includes("console-transport"), "from the services glob");
  });

  test("a token with no runtime shape is satisfied by declaration", function (assert) {
    const match = matchByShape(AuditSink);

    assert.strictEqual(match?.klass, AuditLog);
    assert.strictEqual(match?.via, "declared", "`static provides` did the work");
  });

  test("lookup binds the shape match, lazily, with no initializer", function (assert) {
    const transport = lookup(this.owner, Transport);

    assert.true(transport instanceof ConsoleTransport);

    // And the library service that depends on it works without ever knowing.
    const analytics = lookup(this.owner, Analytics);

    analytics.track("hello");

    assert.strictEqual(analytics.sent, 1);
    assert.deepEqual(
      (transport as ConsoleTransport).events.map((e) => e.event),
      ["hello"],
      "the library talked to the app implementation",
    );
  });

  test("an explicit registration beats a shape match", function (assert) {
    register(this.owner, Transport, RecordingTransport);

    const transport = lookup(this.owner, Transport);

    assert.true(transport instanceof RecordingTransport, "explicit wins");
    assert.false(transport instanceof ConsoleTransport);
  });

  test("a key with no candidate registers itself", function (assert) {
    class Unmatched {
      whollyUnique() {
        return 1;
      }
    }

    assert.strictEqual(matchByShape(Unmatched), undefined);
    assert.true(lookup(this.owner, Unmatched) instanceof Unmatched);
  });
});
