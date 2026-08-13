/**
 * One half of a module cycle: this imports `history.ts`, which imports this.
 * https://github.com/chancancode/ember-polaris-service/issues/18
 *
 * The thunk is what makes it safe. `@service(History)` evaluates `History` at
 * class-definition time, which is too early when the cycle is entered from the
 * other side. `@service(() => History)` defers it to first access.
 */
import { tracked } from "@glimmer/tracking";

import { service } from "#app/di/index.ts";

import History from "./history.ts";

export default class Editor {
  @tracked content = "";

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
