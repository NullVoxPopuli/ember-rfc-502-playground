/**
 * RFC 502 -- what happens when a shape matches more than one candidate.
 *
 * This is the strongest argument against making structural matching the primary
 * mechanism, so it is worth having a test that shows the failure precisely. Two
 * unrelated app services that both happen to have `read`/`write` will both
 * satisfy a `Storage`-shaped token, and there is no principled way to choose.
 */
import { module, test } from "qunit";
import { setupTest } from "ember-qunit";

import { addCandidates, matchByShape, removeCandidates } from "#app/di/index.ts";

class Storage {
  read(_key: string): string | undefined {
    throw new Error("abstract");
  }

  write(_key: string, _value: string): void {
    throw new Error("abstract");
  }
}

class LocalStorage {
  read() {
    return undefined;
  }

  write() {}
}

class SessionStorage {
  read() {
    return undefined;
  }

  write() {}
}

class DeclaredStorage {
  static provides = [Storage] as const;

  read() {
    return undefined;
  }

  write() {}
}

module("Unit | di | shape ambiguity", function (hooks) {
  setupTest(hooks);

  let pool: Record<string, unknown>;

  hooks.afterEach(function () {
    removeCandidates(pool);
  });

  test("two structural matches is an error rather than a coin flip", function (assert) {
    pool = {
      "./services/local-storage.ts": { default: LocalStorage },
      "./services/session-storage.ts": { default: SessionStorage },
    };

    addCandidates(pool);

    assert.throws(
      () => matchByShape(Storage),
      /Ambiguous shape lookup for Storage.*LocalStorage.*SessionStorage/s,
      "names both candidates and suggests an explicit registration",
    );
  });

  /**
   * The tiering is what keeps structural matching from being actively dangerous:
   * a class that *declares* the binding cannot be outvoted by classes that merely
   * happen to have the same members.
   */
  test("a declared match wins outright, so accidental shapes cannot steal it", function (assert) {
    pool = {
      "./services/declared-storage.ts": { default: DeclaredStorage },
      "./services/local-storage.ts": { default: LocalStorage },
      "./services/session-storage.ts": { default: SessionStorage },
    };

    addCandidates(pool);

    const match = matchByShape(Storage);

    assert.strictEqual(match?.klass, DeclaredStorage);
    assert.strictEqual(match?.via, "declared");
  });
});
