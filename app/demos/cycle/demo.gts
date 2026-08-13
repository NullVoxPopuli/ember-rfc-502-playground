import Component from "@glimmer/component";
import { on } from "@ember/modifier";

import { service } from "#app/di/index.ts";

import Editor from "./editor.ts";

export default class CycleDemo extends Component {
  // Only `Editor` is injected. `history` is reached through it, which is what
  // proves the cycle resolves in both directions.
  @service(Editor) declare editor: Editor;

  count = 0;

  type = () => {
    this.editor.type(`revision ${++this.count}`);
  };

  <template>
    <section>
      <h2>Mutually dependent services</h2>

      <p>content: <output data-test-content>{{this.editor.content}}</output></p>
      <p>undo depth: <output data-test-depth>{{this.editor.history.depth}}</output></p>

      <button type="button" data-test-type {{on "click" this.type}}>type</button>
      <button type="button" data-test-undo {{on "click" this.editor.undo}}>undo</button>
    </section>
  </template>
}
