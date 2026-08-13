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

import { registerCookieStore } from "#app/demos/cookies/cookie-store.ts";

export default class App extends Application {
  modules = {
    ...import.meta.glob("./router.*", { eager: true }),
    ...import.meta.glob("./templates/**/*", { eager: true }),
    ...import.meta.glob("./services/**/*", { eager: true }),
  };
  inspector = setupInspector(this);
}

/**
 * The only app-level wiring any demo needs. The choice itself lives with the demo,
 * in `app/demos/cookies/cookie-store.ts`.
 *
 * Registered imperatively because `ember-strict-application-resolver` has no
 * `knownForType`, so there is no `app/instance-initializers/**` convention to
 * discover. That is incidental to this playground, not to the RFC.
 */
App.instanceInitializer({ name: "cookie-store", initialize: registerCookieStore });
