import Component from "@glimmer/component";
import { on } from "@ember/modifier";

import Counter from "#app/demos/counter/counter.ts";
import { service } from "#app/di/index.ts";

import Dashboard from "./dashboard.ts";

export default class InteropDemo extends Component {
  @service(Dashboard) declare dashboard: Dashboard;

  /** The same `Counter` the dashboard injected, so incrementing here shows there. */
  @service(Counter) declare counter: Counter;

  <template>
    <section>
      <h2>String and class keys together</h2>

      <p><output data-test-summary>{{this.dashboard.summary}}</output></p>

      <button type="button" data-test-bump {{on "click" this.counter.increment}}>increment</button>
    </section>
  </template>
}
