/**
 * The other half of the cycle. See `./editor.ts`.
 *
 * This side needs the thunk too. It would happen to work with the direct form as
 * long as `editor.ts` is always imported first, but that is a property of the app's
 * import order rather than of this file.
 */
import { tracked } from "@glimmer/tracking";

import { service } from "#app/di/index.ts";

import Editor from "./editor.ts";

export default class History {
  @tracked private stack: readonly string[] = [];

  @service(() => Editor) declare editor: Editor;

  get depth(): number {
    return this.stack.length;
  }

  push = (value: string) => {
    this.stack = [...this.stack, value];
  };

  pop = (): string | undefined => {
    const last = this.stack.at(-1);

    this.stack = this.stack.slice(0, -1);

    return last;
  };
}
