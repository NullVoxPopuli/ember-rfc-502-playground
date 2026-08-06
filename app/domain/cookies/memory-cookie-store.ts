/**
 * The non-browser implementation of `CookieStore` -- what a FastBoot render (or a
 * test) uses. Selected in `app/app.ts`.
 */
import CookieStore from "./cookie-store.ts";

export default class MemoryCookieStore extends CookieStore {
  readonly #values = new Map<string, string>();

  get(key: string): string | undefined {
    return this.#values.get(key);
  }

  set(key: string, value: string): void {
    this.#values.set(key, value);
  }
}
