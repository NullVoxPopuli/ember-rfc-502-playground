/**
 * RFC 502 -- a library service that depends on a token the *app* provides.
 *
 * This is the shape of the problem in
 * https://github.com/chancancode/ember-polaris-service/issues/19
 *
 * `Analytics` injects `Transport`, but `ember-fancy-analytics` has no
 * implementation of `Transport` and must not ship one. The app provides it. The
 * question the issue raises is how that provision gets into the build and how it
 * is guaranteed to have happened before this getter runs.
 *
 * With shape lookup, the answer is that it does not need to have "happened" at
 * all: the binding is computed during the first `lookup(Transport)`, from the
 * modules the resolver already knows about. There is no initializer to order and
 * nothing eager to import. See `../../di/shape.ts`.
 */
import { tracked } from "@glimmer/tracking";

import { service } from "../../di/index.ts";
import Transport from "./transport.ts";

export default class Analytics {
  @tracked sent = 0;

  // Lazy: the shape match does not run until something actually tracks an event.
  @service(Transport) declare transport: Transport;

  track = (event: string, payload: Record<string, unknown> = {}) => {
    this.transport.send(event, payload);
    this.sent++;
  };
}
