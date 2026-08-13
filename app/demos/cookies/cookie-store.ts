/**
 * The RFC's FastBoot example: an abstract key, with the implementation chosen at
 * boot. The key and its implementations are one file because they are one idea.
 *
 * The key needs no runtime footprint at all -- `abstract` members are enough,
 * because a class key is nominal.
 */
import { register } from "#app/di/index.ts";

import type Owner from "@ember/owner";

export abstract class CookieStore {
  abstract get(key: string): string | undefined;

  abstract set(key: string, value: string): void;
}

export class BrowserCookieStore extends CookieStore {
  get(key: string): string | undefined {
    for (const pair of document.cookie.split("; ")) {
      const [name, ...rest] = pair.split("=");

      if (name === key) return decodeURIComponent(rest.join("="));
    }

    return undefined;
  }

  set(key: string, value: string): void {
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/`;
  }
}

export class MemoryCookieStore extends CookieStore {
  readonly #values = new Map<string, string>();

  get(key: string): string | undefined {
    return this.#values.get(key);
  }

  set(key: string, value: string): void {
    this.#values.set(key, value);
  }
}

/**
 * Wired up as an instance initializer in `app/app.ts`.
 *
 * `register` asserts that the implementation really is a `CookieStore`, so a
 * mistake here fails at boot rather than at the first `.get()`.
 */
export function registerCookieStore(owner: Owner): void {
  const inBrowser = typeof document !== "undefined";

  register(owner, CookieStore, inBrowser ? BrowserCookieStore : MemoryCookieStore);
}
