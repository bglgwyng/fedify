import { getLogger } from "@logtape/logtape";
import type { Activity } from "../vocab/vocab.ts";
import type { ActivityTransformer } from "./types.ts";

const logger = getLogger(["fedify", "compat", "transformers"]);

/**
 * An activity transformer that assigns a new random ID to an activity if it
 * does not already have one.  This is useful for ensuring that activities
 * have an ID before they are sent to other servers.
 *
 * The generated ID is a URN UUID like:
 *
 * ```
 * urn:uuid:12345678-1234-5678-1234-567812345678
 * ```
 * @param activity The activity to assign an ID to.
 * @return The activity with an ID assigned.
 * @since 1.4.0
 */
export function autoIdAssigner(activity: Activity): Activity {
  if (activity.id != null) return activity;
  const id = new URL(`urn:uuid:${crypto.randomUUID()}`);
  logger.warn(
    "As the activity to send does not have an id, a new id {id} has " +
      "been generated for it.  However, it is recommended to explicitly " +
      "set the id for the activity.",
    { id: id.href },
  );
  return activity.clone({ id });
}

/**
 * An activity transformer that dehydrates the actor property of an activity
 * so that it only contains the actor's URI.  For example, suppose we have an
 * activity like this:
 *
 * ```typescript
 * import { Follow, Person } from "@fedify/fedify/vocab";
 * const input = new Follow({
 *   id: new URL("http://example.com/activities/1"),
 *   actor: new Person({
 *     id: new URL("http://example.com/actors/1"),
 *     name: "Alice",
 *     preferredUsername: "alice",
 *   }),
 *   object: new Person({
 *     id: new URL("http://example.com/actors/2"),
 *     name: "Bob",
 *     preferredUsername: "bob",
 *   }),
 * });
 * ```
 *
 * The result of applying this transformer would be:
 *
 * ```typescript
 * import { Follow, Person } from "@fedify/fedify/vocab";
 * const output = new Follow({
 *   id: new URL("http://example.com/activities/1"),
 *   actor: new URL("http://example.com/actors/1"),
 *   object: new Person({
 *     id: new URL("http://example.com/actors/2"),
 *     name: "Bob",
 *     preferredUsername: "bob",
 *   }),
 * });
 * ```
 *
 * As some ActivityPub implementations like Threads fail to deal with inlined
 * actor objects, this transformer can be used to work around this issue.
 * @param activity The activity to dehydrate the actor property of.
 * @returns The dehydrated activity.
 * @since 1.4.0
 */
export function actorDehydrator(activity: Activity): Activity {
  if (activity.actorIds.length < 1) return activity;
  return activity.clone({
    actors: activity.actorIds,
  });
}

/**
 * The default activity transformers that are applied to all outgoing
 * activities.
 * @since 1.4.0
 */
export const defaultActivityTransformers: readonly ActivityTransformer[] = [
  autoIdAssigner,
  actorDehydrator,
];
