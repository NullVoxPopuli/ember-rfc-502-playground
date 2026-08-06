/**
 * RFC 502 -- both key styles, one import.
 *
 * Because `service` dispatches on its parameter type (a string routes to
 * `@ember/service`'s implementation, a class to the class-keyed registry), a file
 * can migrate one injection at a time. There is no moment where the app has to be
 * fully converted, and no second `service`-shaped import to alias around.
 *
 * The contrast is the point of the RFC. `flags` tells you a name; finding the
 * class behind it means knowing the resolver's conventions. `counter` *is* the
 * class: ctrl+click lands on the definition, and the type comes along without a
 * `declare module '@ember/service'` block anywhere.
 */
import { service } from "#app/di/index.ts";
import Counter from "#app/domain/counter.ts";

import type FeatureFlags from "#app/services/feature-flags.ts";

export default class Dashboard {
  /** String-keyed: needs the import purely for the type annotation. */
  @service("feature-flags") declare flags: FeatureFlags;

  /** Class-keyed: the key carries the type. */
  @service(Counter) declare counter: Counter;

  get summary(): string {
    const mode = this.flags.isEnabled("explicit-di") ? "explicit" : "string";

    return `${mode} DI, count ${this.counter.count}`;
  }
}
