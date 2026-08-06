/**
 * RFC 502 -- a "well-known token" published by a library.
 *
 * Pretend this module ships from `ember-fancy-analytics`. The library declares
 * *what it needs* and lets the app decide how it is done. Nothing in the library
 * knows the implementation's name, module, or file location.
 *
 * ## Why the methods have bodies
 *
 * `abstract` is a type-level construct: `abstract send(): void` leaves nothing on
 * `Transport.prototype` at runtime, so a structural match has nothing to compare
 * against. A token that wants to be matchable by shape has to declare its members
 * in a way that survives compilation, and a throwing body is the honest way to do
 * that -- it doubles as the error you want if someone instantiates the token
 * directly.
 *
 * This is the main ergonomic cost of shape lookup and belongs in the RFC's
 * "Drawbacks": `abstract` alone is not enough, and nothing at compile time
 * reminds you of that.
 */
function notImplemented(member: string): Error {
  return new Error(
    `${member} is a Transport requirement, not an implementation. Provide a Transport ` +
      `by exporting a class with the same shape from app/services/, or with ` +
      `owner.register(Transport, MyTransport).`,
  );
}

export default class Transport {
  send(_event: string, _payload: Record<string, unknown>): void {
    throw notImplemented("Transport#send");
  }

  flush(): void {
    throw notImplemented("Transport#flush");
  }
}
