/**
 * RFC 502 -- two mutually-dependent services, resolved through a module cycle.
 *
 * If this renders at all, the thunk form did its job: `Editor` imports `History`
 * and `History` imports `Editor`, and both inject the other.
 */
import Component from "@glimmer/component";
import { on } from "@ember/modifier";

import { service } from "#app/di/index.ts";
import Editor from "#app/domain/cycle/editor.ts";
import History from "#app/domain/cycle/history.ts";

export default class CycleDemo extends Component {
  @service(Editor) declare editor: Editor;
  @service(History) declare history: History;

  count = 0;

  type = () => {
    this.editor.type(`revision ${++this.count}`);
  };

  <template>
    <section>
      <h2>Mutually-dependent services</h2>

      <p>
        content:
        <output data-test-content>{{this.editor.content}}</output>
      </p>

      <p>
        undo depth:
        <output data-test-depth>{{this.history.depth}}</output>
      </p>

      <p>
        the same content, read back through the cycle (<code>history.editor.content</code>):
        <output data-test-round-trip>{{this.history.currentContent}}</output>
      </p>

      <button type="button" data-test-type {{on "click" this.type}}>type</button>
      <button type="button" data-test-undo {{on "click" this.editor.undo}}>undo</button>
    </section>
  </template>
}
