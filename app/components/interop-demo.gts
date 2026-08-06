/**
 * RFC 502 -- string-keyed and class-keyed injections in the same class.
 *
 * Also shows the `CookieStore` key that `app/app.ts` bound in an instance
 * initializer, which is the RFC's FastBoot example: the component asks for the
 * abstract key and gets whichever implementation the environment selected.
 */
import Component from "@glimmer/component";
import { on } from "@ember/modifier";

import { service } from "#app/di/index.ts";
import CookieStore from "#app/domain/cookies/cookie-store.ts";
import Dashboard from "#app/domain/dashboard.ts";

export default class InteropDemo extends Component {
  @service(Dashboard) declare dashboard: Dashboard;
  @service(CookieStore) declare cookies: CookieStore;

  /** String form, still supported, still not ctrl+clickable. */
  @service("feature-flags") declare flags: Dashboard["flags"];

  get implementation(): string {
    return this.cookies.constructor.name;
  }

  get enabledFlags(): string {
    return this.flags.enabled.join(", ");
  }

  writeCookie = () => {
    this.cookies.set("rfc-502", "explicit");
  };

  <template>
    <section>
      <h2>Interop and environment-selected implementations</h2>

      <p>
        <code>Dashboard</code>
        (which injects one of each kind):
        <output data-test-summary>{{this.dashboard.summary}}</output>
      </p>

      <p>
        <code>@service('feature-flags')</code>
        still resolves:
        <output data-test-flags>{{this.enabledFlags}}</output>
      </p>

      <p>
        <code>CookieStore</code>
        was bound by an instance initializer to
        <output data-test-cookie-impl>{{this.implementation}}</output>
      </p>

      <button type="button" data-test-write-cookie {{on "click" this.writeCookie}}>
        set a cookie
      </button>

      <p>
        read back:
        <output data-test-cookie-value>{{this.cookies.get "rfc-502"}}</output>
      </p>
    </section>
  </template>
}
