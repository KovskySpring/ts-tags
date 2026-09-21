/**
 * # ts-tags
 *
 * ## Defining tags
 *
 * A tag is just a `PropertyKey`, so there are several ways to declare one:
 *
 * 1. `declare const Tag: unique symbol` - type-only, when the tag is never
 *    needed as a runtime value.
 * 2. `const Tag: unique symbol = Symbol()` - when you also want a real value.
 *    Pair either form with `type Tag = typeof Tag` for convenience.
 * 3. `static readonly tag: unique symbol` on a class, referenced as
 *    `typeof ClassName.tag`. `declare` works here too if the value is unused.
 * 4. `const tagIt = tags<Tag>()` - `tags` is curried, so the returned tagging
 *    function can be reused anywhere.
 * 5. String and number literals are valid tags as well, not just symbols.
 *
 * ## Example usage
 *
 * ```ts
 * import { pick, tags, view } from "ts-tags";
 *
 * // 1. Type-only symbol tag: `declare` when the tag is never used as a value.
 * declare const ManagerTag: unique symbol;
 * type ManagerTag = typeof ManagerTag;
 *
 * // 2. Real symbol tag: use `Symbol()` when you also want a runtime value.
 * //    The companion type alias keeps `tags<GameTag>()` readable.
 * const GameTag: unique symbol = Symbol("game");
 * type GameTag = typeof GameTag;
 *
 * // 3. Class-attached tag: a `static readonly` symbol, referenced as
 * //    `typeof Renderer.tag`. Use `declare` here too if the value is irrelevant.
 * class Renderer {
 *   static readonly tag: unique symbol = Symbol("renderer");
 * }
 *
 * // 4. Pre-applied tagger: `tags<T>()` returns a reusable tagging function.
 * const managerOnly = tags<ManagerTag>();
 * const gameOnly = tags<GameTag>();
 *
 * // 5. Tags are plain `PropertyKey`s, so string and number literals work too.
 * class Controller {
 *   start = managerOnly(function () {
 *     console.log("controller: start");
 *   });
 *
 *   listen = gameOnly(function () {
 *     console.log("controller: listen");
 *   });
 *
 *   draw = tags<typeof Renderer.tag>()(function () {
 *     console.log("controller: draw");
 *   });
 *
 *   layer = tags<"base_layer" | "overlay_layer">()(0);
 *   slot = tags<0 | 1>()("primary");
 *
 *   // Untagged members stay visible to every view.
 *   describe() {
 *     return "controller";
 *   }
 * }
 *
 * class GameObject {
 *   private controller = view<ManagerTag>()(new Controller());
 *
 *   start() {
 *     this.controller.start();
 *     this.controller.describe();
 *     // @ts-expect-error listen is not visible to ManagerTag
 *     this.controller.listen();
 *   }
 * }
 *
 * const controller = new Controller();
 *
 * // `view` keeps untagged members; `pick` keeps only the tagged ones.
 * view<GameTag | typeof Renderer.tag>()(controller).describe();
 * pick<GameTag | typeof Renderer.tag>()(controller).draw();
 * ```
 *
 * @module
 */

export const TagKey: unique symbol = Symbol();

/**
 * A utility type to brand a value with a set of `Tags` at the type level.
 */
export type Brand<in out T extends PropertyKey> = {
  readonly [TagKey]: {
    readonly T: T;
  };
};

/**
 * A `Source` value branded with the set of `Tags` allowed to see it.
 *
 * The brand only exists at the type level; the runtime value is untouched.
 *
 * @typeParam Source - The underlying value type.
 * @typeParam Tags - Union of tags permitted to access the value.
 */
export type Tagged<Source, Tags extends PropertyKey> = Source & Brand<Tags>;

/**
 * Removes the tag brand from `T`, yielding the underlying value type.
 *
 * Non-tagged types are returned unchanged.
 *
 * @typeParam T - A possibly tagged type.
 */
export type Untagged<T> = T extends Tagged<infer M, infer _> ? M : T;

/**
 * Keys of `Source` visible to `Tags`: every untagged key, plus tagged keys
 * whose brand includes `Tags`.
 *
 * @typeParam Source - The object type being inspected.
 * @typeParam Tags - Union of tags held by the accessor.
 */
export type VisibleTagKeys<Source, Tags extends PropertyKey> = {
  [K in keyof Source]: Source[K] extends Tagged<infer _, infer Members>
    ? Tags extends Members ? K
    : never
    : K;
}[keyof Source];

/**
 * Keys of `Source` explicitly tagged for `Tags`. Untagged keys are excluded.
 *
 * @typeParam Source - The object type being inspected.
 * @typeParam Tags - Union of tags held by the accessor.
 */
export type TaggedKeys<Source, Tags extends PropertyKey> = {
  [K in keyof Source]: Source[K] extends Tagged<infer _, infer Members>
    ? Tags extends Members ? K
    : never
    : never;
}[keyof Source];

/**
 * `Source` narrowed to the members visible to `Tags`.
 *
 * @typeParam Source - The object type being viewed.
 * @typeParam Tags - Union of tags held by the viewer.
 */
export type View<Source, Tags extends PropertyKey> = Pick<
  Source,
  VisibleTagKeys<Source, Tags>
>;

function identity(value: unknown): unknown {
  return value;
}

/**
 * Brands a value so only holders of `Tags` can access it through {@link view}
 * or {@link pick}.
 *
 * Curried so `Tags` can be supplied explicitly while `Source` stays inferred.
 * This is a type-level operation: the value is returned as-is at runtime.
 *
 * Note: If you prefer to have no runtime impact at all, use
 * `as Tagged<Source, Tags>` instead of this helper function.
 *
 * @typeParam Tags - Union of tags permitted to access the value.
 * @returns A function branding its argument as {@link Tagged}.
 *
 * @example
 * ```ts
 * class Engine {
 *   start = tags<"driver">()(() => {});
 * }
 * ```
 */
export function tags<Tags extends PropertyKey>(): <Source>(
  value: Source,
) => Tagged<Source, Tags> {
  return identity as <Source>(value: Source) => Tagged<Source, Tags>;
}

/**
 * Narrows a value to the members visible to `Tags`: all untagged members plus
 * those tagged for `Tags`.
 *
 * This is a type-level operation: the value is returned as-is at runtime.
 *
 * Note: If you prefer to have no runtime impact at all, use
 * `as View<Source, Tags>` instead of this helper function.
 *
 * @typeParam Tags - Union of tags held by the viewer.
 * @returns A function returning its argument typed as {@link View}.
 *
 * @example
 * ```ts
 * view<"driver">()(new Engine()).start();
 * ```
 */
export function view<Tags extends PropertyKey>(): <Source>(
  value: Source,
) => View<Source, Tags> {
  return identity as <Target>(value: Target) => View<Target, Tags>;
}

/**
 * Narrows a value to only the members explicitly tagged for `Tags`, dropping
 * untagged members.
 *
 * This is a type-level operation: the value is returned as-is at runtime.
 *
 * Note: If you prefer to have no runtime impact at all, use
 * `as Pick<Source, TaggedKeys<Source, Tags>>` instead of this helper function.
 *
 * @typeParam Tags - Union of tags held by the accessor.
 * @returns A function returning its argument picked down to {@link TaggedKeys}.
 *
 * @example
 * ```ts
 * pick<"driver">()(new Engine()).start();
 * ```
 */
export function pick<Tags extends PropertyKey>(): <Source>(
  value: Source,
) => Pick<Source, TaggedKeys<Source, Tags>> {
  return identity as <Target>(
    value: Target,
  ) => Pick<Target, TaggedKeys<Target, Tags>>;
}
