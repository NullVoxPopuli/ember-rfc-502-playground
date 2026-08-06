/**
 * Looking for services that come from addons?
 *
 * See: https://github.com/embroider-build/embroider/issues/2659
 *
 * We currently don't support app-tree merging from libraries.
 *
 * For services, I highly recommend looking in to either of
 * - https://github.com/chancancode/ember-polaris-service-
 * - https://ember-primitives.pages.dev/6-utils/createService.md
 *   - https://ember-primitives.pages.dev/6-utils/createAsyncService.md
 */
import setupInspector from "@embroider/legacy-inspector-support/ember-source-4.12";

import Application from "ember-strict-application-resolver";

import { addCandidates, register } from "#app/di/index.ts";
import BrowserCookieStore from "#app/domain/cookies/browser-cookie-store.ts";
import CookieStore from "#app/domain/cookies/cookie-store.ts";
import MemoryCookieStore from "#app/domain/cookies/memory-cookie-store.ts";

/**
 * RFC 502 -- the candidate pool for shape lookup.
 *
 * This is the same glob that feeds the resolver below. Handing it to the DI layer
 * is what lets `lookup(Transport)` find `app/services/console-transport.ts`
 * without anything importing that file -- see `app/di/shape.ts` and
 * https://github.com/chancancode/ember-polaris-service/issues/19
 */
const services = import.meta.glob("./services/**/*", { eager: true });

addCandidates(services);

export default class App extends Application {
  modules = {
    ...import.meta.glob("./router.*", { eager: true }),
    ...import.meta.glob("./templates/**/*", { eager: true }),
    ...services,
  };
  inspector = setupInspector(this);
}

/**
 * RFC 502 -- the instance initializer from the RFC's FastBoot example.
 *
 * Note what this does *not* need: the resolver never sees this code, and the
 * `CookieStore` key never appears in a string. `register` asserts that the
 * implementation really is a `CookieStore`, so a typo here is an error at boot
 * rather than a `TypeError` at the first `.get()`.
 *
 * Registered imperatively because `ember-strict-application-resolver` has no
 * `knownForType`, so there is no `app/instance-initializers/**` convention to
 * discover. That is incidental to this playground, not to the RFC.
 */
App.instanceInitializer({
  name: "register-cookie-store",

  initialize(owner) {
    const hasDocument = typeof document !== "undefined";

    register(owner, CookieStore, hasDocument ? BrowserCookieStore : MemoryCookieStore);
  },
});
