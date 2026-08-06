/**
 * RFC 502 -- the "typescript fastboot example with instance initializers", made
 * to actually compile and run.
 *
 * The RFC's version has `abstract getValue(key: string): string {}`, which is not
 * legal TypeScript (an abstract member cannot have a body) -- worth fixing in the
 * RFC text, since the corrected version also shows the real pattern: the key is a
 * pure type-level contract with no runtime footprint at all.
 *
 * Because this key is nominal, it needs no throwing method bodies: nothing will
 * ever try to match it structurally. Registration happens in the instance
 * initializer in `app/app.ts`.
 */
export default abstract class CookieStore {
  abstract get(key: string): string | undefined;

  abstract set(key: string, value: string): void;
}
