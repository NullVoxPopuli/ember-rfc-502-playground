/**
 * RFC 502 -- the polaris-service#19 demo.
 *
 * `Analytics` is "library" code that injects a `Transport` it does not implement.
 * `AuditSink` is a "library" token the app satisfies by declaration. In both
 * cases the app's provider lives in `app/services/`, is imported by nothing, and
 * is bound on first lookup -- no initializer, nothing eager.
 *
 * The names rendered below come from `matchByShape`, so they are evidence of
 * which strategy actually fired rather than a hardcoded label.
 */
import Component from "@glimmer/component";
import { on } from "@ember/modifier";

import { matchByShape, service } from "#app/di/index.ts";
import Analytics from "#app/library/analytics/analytics.ts";
import Transport from "#app/library/analytics/transport.ts";
import AuditSink from "#app/library/audit/audit-sink.ts";

export default class ProviderDemo extends Component {
  @service(Analytics) declare analytics: Analytics;
  @service(AuditSink) declare audit: AuditSink;

  get transportMatch() {
    return matchByShape(Transport);
  }

  get auditMatch() {
    return matchByShape(AuditSink);
  }

  track = () => {
    this.analytics.track("button-clicked", { where: "provider-demo" });
    this.audit.record("tracked an event", "demo-user");
  };

  <template>
    <section>
      <h2>App-provided library tokens</h2>

      <p>
        <code>Transport</code>
        resolved to
        <output data-test-transport>{{this.transportMatch.klass.name}}</output>
        via
        <output data-test-transport-via>{{this.transportMatch.via}}</output>
        ({{this.transportMatch.moduleName}})
      </p>

      <p>
        <code>AuditSink</code>
        resolved to
        <output data-test-audit>{{this.auditMatch.klass.name}}</output>
        via
        <output data-test-audit-via>{{this.auditMatch.via}}</output>
        ({{this.auditMatch.moduleName}})
      </p>

      <button type="button" data-test-track {{on "click" this.track}}>track an event</button>

      <p>
        events sent:
        <output data-test-sent>{{this.analytics.sent}}</output>
      </p>
    </section>
  </template>
}
