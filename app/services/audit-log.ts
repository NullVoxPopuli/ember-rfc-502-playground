/**
 * RFC 502 -- the app provides `AuditSink`, declared rather than inferred.
 *
 * Nothing imports this file either. It is in the build because `app/services/**`
 * is in the app's module map, and it is bound to `AuditSink` at the first
 * `lookup(AuditSink)`.
 *
 * The difference from `console-transport.ts` is `static provides`: the binding is
 * nominal, so it is checked. `implements AuditSink` gives full type checking of
 * the members without making this a subclass, so `provides` is genuinely what
 * establishes the binding here. (`extends AuditSink` would also work -- see the
 * `subclass` tier in `matchByShape` -- but `provides` covers the cases where the
 * class cannot change its superclass, or satisfies several tokens at once.)
 */
import AuditSink from "#app/library/audit/audit-sink.ts";

export default class AuditLog implements AuditSink {
  static provides = [AuditSink] as const;

  readonly records: string[] = [];

  record(action: string, actor: string): void {
    this.records.push(`${actor}: ${action}`);
  }
}
