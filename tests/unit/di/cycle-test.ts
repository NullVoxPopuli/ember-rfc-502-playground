/**
 * RFC 502 -- mutually-dependent services across a module cycle.
 *
 * https://github.com/chancancode/ember-polaris-service/issues/18
 *
 * `editor.ts` imports `history.ts` and `history.ts` imports `editor.ts`. If the
 * thunk form did not defer reading the class binding, importing either module
 * would throw at class-definition time and this file would fail to load at all.
 */
import { module, test } from "qunit";
import { setupTest } from "ember-qunit";

import { lookup } from "#app/di/index.ts";
import Editor from "#app/domain/cycle/editor.ts";
import History from "#app/domain/cycle/history.ts";

module("Unit | di | module cycles", function (hooks) {
  setupTest(hooks);

  test("both halves of the cycle are defined", function (assert) {
    assert.strictEqual(typeof Editor, "function");
    assert.strictEqual(typeof History, "function");
  });

  test("each service resolves the other", function (assert) {
    const editor = lookup(this.owner, Editor);
    const history = lookup(this.owner, History);

    assert.strictEqual(editor.history, history, "editor -> history");
    assert.strictEqual(history.editor, editor, "history -> editor");
  });

  test("the cycle is usable, not just resolvable", function (assert) {
    const editor = lookup(this.owner, Editor);

    editor.type("first");
    editor.type("second");

    assert.strictEqual(editor.content, "second");
    assert.strictEqual(editor.history.depth, 2);
    assert.strictEqual(editor.history.currentContent, "second", "round trip through the cycle");

    editor.undo();

    assert.strictEqual(editor.content, "first");
  });

  /**
   * Resolution order must not matter. Looking up the *second* half of the cycle
   * first is the case that breaks if either file uses the direct form.
   */
  test("looking up History first works too", function (assert) {
    const history = lookup(this.owner, History);

    assert.strictEqual(history.editor.history, history);
  });
});
