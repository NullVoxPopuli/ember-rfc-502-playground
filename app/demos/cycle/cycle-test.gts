import { click, render } from "@ember/test-helpers";
import { module, test } from "qunit";
import { setupRenderingTest } from "ember-qunit";

import { lookup } from "#app/di/index.ts";

import CycleDemo from "./demo.gts";
import Editor from "./editor.ts";
import History from "./history.ts";

module("Demo | cycle", function (hooks) {
  setupRenderingTest(hooks);

  test("each service resolves the other", function (assert) {
    const editor = lookup(this.owner, Editor);
    const history = lookup(this.owner, History);

    assert.strictEqual(editor.history, history, "editor -> history");
    assert.strictEqual(history.editor, editor, "history -> editor");
  });

  /** Looking up the second half first is what breaks without the thunk. */
  test("either side can be looked up first", function (assert) {
    const history = lookup(this.owner, History);

    assert.strictEqual(history.editor.history, history);
  });

  test("the cycle is usable, not just resolvable", async function (assert) {
    await render(<template><CycleDemo /></template>);
    await click("[data-test-type]");
    await click("[data-test-type]");

    assert.dom("[data-test-content]").hasText("revision 2");
    assert.dom("[data-test-depth]").hasText("2");

    await click("[data-test-undo]");

    assert.dom("[data-test-content]").hasText("revision 1");
  });
});
