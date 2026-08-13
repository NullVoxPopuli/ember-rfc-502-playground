import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { on } from "@ember/modifier";

import { service } from "#app/di/index.ts";

import { CookieStore } from "./cookie-store.ts";

export default class CookiesDemo extends Component {
  // Asks for the abstract key and gets whatever the initializer chose.
  @service(CookieStore) declare cookies: CookieStore;

  @tracked value: string | undefined;

  get implementation(): string {
    return this.cookies.constructor.name;
  }

  write = () => {
    this.cookies.set("rfc-502", "explicit");
    this.value = this.cookies.get("rfc-502");
  };

  <template>
    <section>
      <h2>An abstract key, chosen at boot</h2>

      <p>implementation: <output data-test-impl>{{this.implementation}}</output></p>

      <button type="button" data-test-write {{on "click" this.write}}>set a cookie</button>

      <p>read back: <output data-test-value>{{this.value}}</output></p>
    </section>
  </template>
}
