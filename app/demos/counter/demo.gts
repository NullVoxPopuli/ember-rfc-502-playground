import Component from "@glimmer/component";
import { on } from "@ember/modifier";

import { service } from "#app/di/index.ts";

import Counter from "./counter.ts";

export default class CounterDemo extends Component {
  /** Decorator form: nothing is instantiated until this is read. */
  @service(Counter) declare counter: Counter;

  /** Function form: resolves during construction. */
  eager = service(this, Counter);

  get sameInstance(): boolean {
    return this.counter === this.eager;
  }

  <template>
    <section>
      <h2>A service with no base class</h2>

      <p>count: <output data-test-count>{{this.counter.count}}</output></p>
      <p>both forms are one instance: <output data-test-same>{{this.sameInstance}}</output></p>

      <button type="button" data-test-increment {{on "click" this.counter.increment}}>
        increment
      </button>
    </section>
  </template>
}
