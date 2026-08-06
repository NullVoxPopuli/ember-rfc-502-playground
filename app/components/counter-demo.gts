/**
 * RFC 502 -- all four injection forms, side by side, in one component.
 *
 * They all resolve to the same instance, because the key is the same class and
 * the container caches per owner. That equality is asserted in
 * `tests/rendering/counter-demo-test.gts`.
 */
import Component from "@glimmer/component";
import { on } from "@ember/modifier";

import { service } from "#app/di/index.ts";
import ActivityLog from "#app/domain/activity-log.ts";
import Counter from "#app/domain/counter.ts";
import Logger from "#app/domain/logger.ts";

export default class CounterDemo extends Component {
  /** Decorator form. Lazy: nothing is instantiated until this is read. */
  @service(Counter) declare counter: Counter;

  /** Thunk form. Identical, but tolerates a module cycle. */
  @service(() => Logger) declare logger: Logger;

  /** Function form. Resolves now, during construction. */
  activity = service(this, ActivityLog);

  /** Function form, thunked. */
  alsoTheCounter = service(this, () => Counter);

  get sameInstance(): boolean {
    return this.counter === this.alsoTheCounter;
  }

  bump = () => {
    this.counter.increment();
    this.activity.record("bumped");
  };

  <template>
    <section>
      <h2>Four forms, one instance</h2>

      <p>
        count:
        <output data-test-count>{{this.counter.count}}</output>
      </p>

      <p>
        <code>@service(Counter)</code>
        and
        <code>service(this, () =&gt; Counter)</code>
        are the same object:
        <output data-test-same-instance>{{this.sameInstance}}</output>
      </p>

      <button type="button" data-test-bump {{on "click" this.bump}}>increment</button>
      <button type="button" data-test-reset {{on "click" this.counter.reset}}>reset</button>

      <h3>Activity log</h3>
      <ul data-test-activity>
        {{#each this.activity.entries as |entry|}}
          <li>{{entry}}</li>
        {{/each}}
      </ul>

      <h3>Logger (an EmberObject-based service)</h3>
      <ul data-test-log>
        {{#each this.logger.lines as |line|}}
          <li>{{line}}</li>
        {{/each}}
      </ul>
    </section>
  </template>
}
