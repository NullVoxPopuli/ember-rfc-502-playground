/**
 * RFC 502 -- module cycles, half one.
 *
 * `Editor` needs `History` and `History` needs `Editor`. With string keys this
 * is a non-issue: `@service('history')` mentions no module, so there is no edge
 * in the module graph at all. Class keys create a real cycle, which is
 * https://github.com/chancancode/ember-polaris-service/issues/18
 *
 * What actually breaks is *evaluation order*, not the cycle itself. ESM permits
 * cycles; it only fails if a binding is read before the module that owns it has
 * been evaluated. So the rule is narrow:
 *
 * - reading `History` inside a decorator *argument* is evaluated at class
 *   definition time -- too early, and this is what throws.
 * - reading it inside a thunk defers to first property access -- always safe.
 *
 * `editor.ts` is the entry side of the cycle here, so it is the one that must
 * use the thunk. Because which side is "first" depends on which module the app
 * happens to import first, the thunk is the only form that is safe in both
 * directions -- which is the argument for it being the documented default for
 * mutually-dependent services.
 */
import { tracked } from "@glimmer/tracking";

import { service } from "../../di/index.ts";
import History from "./history.ts";

export default class Editor {
  @tracked content = "";

  // `() => History` rather than `History`: at the moment this decorator runs,
  // `history.ts` may not have finished evaluating.
  @service(() => History) declare history: History;

  type = (text: string) => {
    this.history.push(this.content);
    this.content = text;
  };

  undo = () => {
    const previous = this.history.pop();

    if (previous !== undefined) this.content = previous;
  };
}
