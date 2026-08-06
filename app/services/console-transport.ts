/**
 * RFC 502 -- the app's answer to a library's token, with zero coupling.
 *
 * Read the imports: there are none. This file does not import `Transport`, does
 * not import the DI layer, and is not imported by anything -- not by `app.ts`,
 * not by an initializer, not by the component that uses `Analytics`.
 *
 * It nonetheless ends up bound to `Transport`, because:
 *
 * 1. it is in the build: `app/services/**` is in the app's module map, which is
 *    the same directory convention that makes string-keyed services work today
 *    (polaris-service#19, problem 1), and
 * 2. the binding is established during the first `lookup(Transport)`, which is by
 *    construction before first use, so there is no initializer to order
 *    (polaris-service#19, problem 2).
 *
 * The tradeoff is that the contract is now implicit. Renaming `send` here silently
 * unbinds it from `Transport`, and the failure surfaces as "no Transport found"
 * somewhere else entirely. `app/services/audit-log.ts` shows the safer variant
 * that trades a one-line import for a checked, nominal declaration.
 */
export default class ConsoleTransport {
  readonly events: { event: string; payload: Record<string, unknown> }[] = [];

  send(event: string, payload: Record<string, unknown>): void {
    this.events.push({ event, payload });
    console.debug("[analytics]", event, payload);
  }

  flush(): void {
    this.events.length = 0;
  }
}
