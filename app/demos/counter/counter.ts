/**
 * A service that extends nothing and lives nowhere special.
 *
 * A string key would force this file to be `app/services/counter.ts` so the
 * resolver could find it. A class key makes the import the registration, so it sits
 * next to the component that uses it.
 */
import { tracked } from "@glimmer/tracking";
import { registerDestructor } from "@ember/destroyable";

export default class Counter {
  @tracked count = 0;

  /** Teardown reaches a plain class: no base class, no `willDestroy`. */
  destroyed = false;

  constructor() {
    registerDestructor(this, () => {
      this.destroyed = true;
    });
  }

  increment = () => {
    this.count++;
  };
}
