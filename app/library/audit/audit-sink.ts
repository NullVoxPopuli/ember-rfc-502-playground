/**
 * RFC 502 -- a token satisfied by *declaration* rather than by shape.
 *
 * Same situation as `../analytics/transport.ts`, but the provider names the token
 * it satisfies (`static provides = [AuditSink]`) instead of being matched
 * structurally. That costs the app one import and buys back everything structural
 * matching gives up:
 *
 * - renaming a method is a type error rather than a silent unbinding
 * - two providers cannot accidentally satisfy the same token
 * - minification cannot affect it, since the identity is the class object itself
 * - the token can declare members with no runtime footprint (`abstract`, or
 *   nothing at all -- a token can be an empty class used purely as an identity)
 *
 * It still solves both halves of polaris-service#19, because discovery is still
 * the resolver's module map and binding still happens at first lookup. The import
 * points from the app to the library, which is the direction that was already
 * allowed; what it never requires is the app *entry point* importing the provider.
 */
export default abstract class AuditSink {
  abstract record(action: string, actor: string): void;
}
