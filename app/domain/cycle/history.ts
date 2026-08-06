/**
 * RFC 502 -- module cycles, half two. See `./editor.ts` for the explanation.
 *
 * This side uses the thunk form too. It would *happen* to work with the direct
 * form as long as `editor.ts` is always the module that gets imported first, but
 * that is a property of the app's import order rather than of this file, so
 * relying on it is how the bug reappears later.
 */
import { tracked } from "@glimmer/tracking";

import { service } from "../../di/index.ts";
import Editor from "./editor.ts";

export default class History {
  @tracked private stack: readonly string[] = [];

  @service(() => Editor) declare editor: Editor;

  get depth(): number {
    return this.stack.length;
  }

  /** Reaches back through the cycle, proving the edge really is bidirectional. */
  get currentContent(): string {
    return this.editor.content;
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
