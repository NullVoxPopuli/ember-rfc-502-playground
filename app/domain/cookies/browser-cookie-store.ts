/**
 * The browser implementation of `CookieStore`. Selected in `app/app.ts`.
 */
import CookieStore from "./cookie-store.ts";

export default class BrowserCookieStore extends CookieStore {
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
