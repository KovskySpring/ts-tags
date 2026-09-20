const TagKey: unique symbol = Symbol();

type Brand<in out T extends PropertyKey> = {
  readonly [TagKey]: {
    readonly T: T;
  };
};

export type Tagged<Source, Tags extends PropertyKey> = Source & Brand<Tags>;

export type Untagged<T> = T extends Tagged<infer M, infer _> ? M : T;

export type VisibleTagKeys<Source, Tags extends PropertyKey> = {
  [K in keyof Source]: Source[K] extends Tagged<infer _, infer Members>
    ? Tags extends Members ? K
    : never
    : K;
}[keyof Source];

export type TaggedKeys<Source, Tags extends PropertyKey> = {
  [K in keyof Source]: Source[K] extends Tagged<infer _, infer Members>
    ? Tags extends Members ? K
    : never
    : never;
}[keyof Source];

export type View<Source, Tags extends PropertyKey> = Pick<
  Source,
  VisibleTagKeys<Source, Tags>
>;

function identity(value: unknown): unknown {
  return value;
}

export function tags<Tags extends PropertyKey>(): <Source>(
  value: Source,
) => Tagged<Source, Tags> {
  return identity as <Source>(value: Source) => Tagged<Source, Tags>;
}

export function view<Tags extends PropertyKey>(): <Source>(
  value: Source,
) => View<Source, Tags> {
  return identity as <Target>(value: Target) => View<Target, Tags>;
}

export function pick<Tags extends PropertyKey>(): <Source>(
  value: Source,
) => Pick<Source, TaggedKeys<Source, Tags>> {
  return identity as <Target>(
    value: Target,
  ) => Pick<Target, TaggedKeys<Target, Tags>>;
}
