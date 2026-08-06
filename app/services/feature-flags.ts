/**
 * A plain old string-keyed service, kept deliberately.
 *
 * The RFC does not deprecate string lookup, and the two systems have to coexist
 * for a long time. `tests/unit/di/interop-test.ts` pins both directions:
 *
 * - a class-keyed service reaching a string-keyed one, and
 * - a string-keyed service reaching a class-keyed one.
 *
 * Note that nothing here collides with the class-keyed registry: class keys live
 * under the `explicit-di:` type, so `service:feature-flags` and a class named
 * `FeatureFlags` can never accidentally satisfy each other. That isolation is a
 * property of this prototype worth stating in the RFC -- resolution by class must
 * not silently fall back to resolution by name, or "go to definition" stops being
 * trustworthy again.
 */
import { tracked } from "@glimmer/tracking";
import Service from "@ember/service";

export default class FeatureFlags extends Service {
  @tracked enabled: readonly string[] = ["explicit-di"];

  isEnabled = (flag: string): boolean => this.enabled.includes(flag);
}

declare module "@ember/service" {
  interface Registry {
    "feature-flags": FeatureFlags;
  }
}
