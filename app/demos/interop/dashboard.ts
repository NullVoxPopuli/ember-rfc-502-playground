/**
 * One string-keyed injection and one class-keyed injection, from a single import.
 *
 * The asymmetry is the point of the RFC:
 *
 * - `flags` needs a separate type-only import to say what it is, and the class it
 *   names has to live in `app/services/` so the resolver can find it by name.
 * - `counter` needs neither. The key carries the type, and the file lives with the
 *   demo that uses it.
 */
import Counter from "#app/demos/counter/counter.ts";
import { service } from "#app/di/index.ts";

import type FeatureFlags from "#app/services/feature-flags.ts";

export default class Dashboard {
  @service("feature-flags") declare flags: FeatureFlags;

  @service(Counter) declare counter: Counter;

  get summary(): string {
    const mode = this.flags.isEnabled("explicit-di") ? "explicit" : "string";

    return `${mode} DI, count ${this.counter.count}`;
  }
}
