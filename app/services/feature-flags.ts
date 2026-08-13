/**
 * A string-keyed service, kept deliberately.
 *
 * This file has to live in `app/services/` -- that is what a string key means: the
 * resolver finds the class by its file path. Compare the demos under `app/demos/`,
 * where each service sits next to the component that injects it.
 *
 * Used by `app/demos/interop/` to show both key styles in one class.
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
