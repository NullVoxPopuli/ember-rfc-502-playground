/**
 * A plain-class service that injects *another* service.
 *
 * This is where a finding worth putting in the RFC lives. In a plain class, the
 * owner is only attached to the instance *after* the constructor returns, so a
 * field initializer cannot use `this`:
 *
 * ```ts
 * class Broken {
 *   log = service(this, Counter);  // throws: `this` has no owner yet
 * }
 * ```
 *
 * There are two working shapes, both used below:
 *
 * 1. take the owner as a constructor parameter and inject from it eagerly, or
 * 2. use a getter (or `@service`), so resolution happens after construction.
 *
 * (2) is the better default: it is lazy, and it does not care how the instance
 * came to exist. `EmberObject`-based services do not hit this at all, because
 * `create(props)` sets the owner on `props` before `init` runs.
 */
import { tracked } from "@glimmer/tracking";

import { service } from "../di/index.ts";
import Counter from "./counter.ts";
import Logger from "./logger.ts";

import type Owner from "@ember/owner";

export default class ActivityLog {
  @tracked entries: readonly string[] = [];

  /** Shape 1: eager injection from the constructor's owner. */
  #counter: Counter;

  constructor(owner: Owner) {
    this.#counter = service(owner, Counter);
  }

  /** Shape 2: lazy injection through a getter. The container caches the instance. */
  get #logger(): Logger {
    return service(this, Logger);
  }

  record = (what: string) => {
    const entry = `${what} (count was ${this.#counter.count})`;

    this.entries = [...this.entries, entry];
    this.#logger.log(entry);
  };
}
