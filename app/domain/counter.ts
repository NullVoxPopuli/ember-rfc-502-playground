/**
 * A service that extends nothing.
 *
 * With string-keyed lookup, a service has to live at `app/services/counter.ts`
 * so the resolver can find it. With class-keyed lookup the file can live
 * anywhere -- this one is in `app/domain/` -- because the import *is* the
 * registration. Nothing globs this directory; `app/app.ts` never mentions it.
 *
 * It also does not extend `Service`. Once the key is the class, there is nothing
 * left for a base class to provide: no name to resolve, no `create` contract to
 * satisfy (see `plainClassFactory` in `../di/container.ts`).
 */
import { tracked } from "@glimmer/tracking";
import { registerDestructor } from "@ember/destroyable";

import type Owner from "@ember/owner";

export default class Counter {
  @tracked count = 0;

  /** Set by `registerDestructor`, asserted on in the destruction test. */
  destroyed = false;

  constructor(owner: Owner) {
    // `associateDestroyableChild(owner, this)` in the factory is what makes this
    // fire when the owner is torn down -- no `willDestroy` hook, no base class.
    registerDestructor(this, () => {
      this.destroyed = true;
    });

    // Deliberately unused beyond the destructor: a service with no dependencies
    // of its own does not need to hold the owner at all.
    void owner;
  }

  increment = () => {
    this.count++;
  };

  reset = () => {
    this.count = 0;
  };
}
