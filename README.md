# ts-tags

Leverage Typescript's type system to tag and filter object members.
Filter access to certain members and properties of a class or object without
boilerplating a bunch of interfaces and types. Tagging and filtering is done
at the type level, so there is no runtime overhead. Filtering is done with
simple shallow object key mapping, so there is little to no impact to your
Typescript server.

```ts
import { pick, tags, view } from "@tinymirror/ts-tags";

const MyTag: unique symbol = Symbol();
type MyTag = typeof MyTag;

const YourTag: unique symbol = Symbol();
type YourTag = typeof YourTag;

const a = tags<MyTag>()("any value");
const b = tags<YourTag>()(10);

const aView = view<MyTag>()(a); // string

// @ts-expect-error number is not visible to MyTag
const bView = view<MyTag>()(b);
```

Remove boilerplating from repetitive interfaces and types. Before,

```ts
interface MyObject {
  valueA: string;
  valueB: number;
  valueD: boolean;
}

interface YourObject {
  valueB: number;
  valueC: boolean;
  valueD: boolean;
}

interface DataObject {
  valueA: string;
  valueB: number;
  valueC: boolean;
  valueD: boolean;
}

const value: DataObject = {
  valueA: "anything",
  valueB: 10,
  valueC: true,
  valueD: true,
};

const view: MyObject = value;
view.valueA; // string
view.valueB; // number
// @ts-expect-error valueC is not visible to MyObject
view.valueC;
view.valueD; // boolean

const filtered: MyObject = value;
filtered.valueA; // string
// @ts-expect-error valueB is not visible to MyObject
filtered.valueB;
// @ts-expect-error valueC is not visible to MyObject
filtered.valueC;
filtered.valueD; // boolean
```

After, you define your interface once and filter before consumptions.

```ts
const MyTag: unique symbol = Symbol();
type MyTag = typeof MyTag;

const YourTag: unique symbol = Symbol();
type YourTag = typeof YourTag;

const withMyTag = tags<MyTag>();
const withYourTag = tags<YourTag>();
const withOurTag = tags<MyTag | YourTag>();
// or just use `tags<MyTag | YourTag>()(...) directly`

const value = {
  valueA: withMyTag("anything"),
  valueB: 10,
  valueC: withYourTag(true),
  valueD: withOurTag(true),
};

const view = view<MyTag>()(value);
view.valueA; // string
view.valueB; // number
// @ts-expect-error valueC is not visible to MyTag
view.valueC;
view.valueD; // boolean

const filtered = pick<MyTag>()(value);
filtered.valueA; // string
// @ts-expect-error valueB is not visible to MyTag
filtered.valueB;
// @ts-expect-error valueC is not visible to MyTag
filtered.valueC;
filtered.valueD; // boolean
```

## Defining tags

A tag is just a `PropertyKey`, so there are several ways to declare one:

1. `declare const Tag: unique symbol` - type-only, when the tag is never needed
   as a runtime value.
2. `const Tag: unique symbol = Symbol()` - when you also want a real value. Pair
   either form with `type Tag = typeof Tag` for convenience.
3. `static readonly tag: unique symbol` on a class, referenced as
   `typeof ClassName.tag`. `declare` works here too if the value is unused.
4. `const tagIt = tags<Tag>()` - `tags` is curried, so the returned tagging
   function can be reused anywhere.
5. String and number literals are valid tags as well, not just symbols.

## Example usage

```ts
import { pick, tags, view } from "ts-tags";

// 1. Type-only symbol tag: `declare` when the tag is never used as a value.
declare const ManagerTag: unique symbol;
type ManagerTag = typeof ManagerTag;

// 2. Real symbol tag: use `Symbol()` when you also want a runtime value.
//    The companion type alias keeps `tags<GameTag>()` readable.
const GameTag: unique symbol = Symbol("game");
type GameTag = typeof GameTag;

// 3. Class-attached tag: a `static readonly` symbol, referenced as
//    `typeof Renderer.tag`. Use `declare` here too if the value is irrelevant.
class Renderer {
  static readonly tag: unique symbol = Symbol("renderer");
}

// 4. Pre-applied tagger: `tags<T>()` returns a reusable tagging function.
const managerOnly = tags<ManagerTag>();
const gameOnly = tags<GameTag>();

// 5. Tags are plain `PropertyKey`s, so string and number literals work too.
class Controller {
  start = managerOnly(function () {
    console.log("controller: start");
  });

  listen = gameOnly(function () {
    console.log("controller: listen");
  });

  draw = tags<typeof Renderer.tag>()(function () {
    console.log("controller: draw");
  });

  layer = tags<"base_layer" | "overlay_layer">()(0);
  slot = tags<0 | 1>()("primary");

  // Untagged members stay visible to every view.
  describe() {
    return "controller";
  }
}

class GameObject {
  private controller = view<ManagerTag>()(new Controller());

  start() {
    this.controller.start();
    this.controller.describe();
    // @ts-expect-error listen is not visible to ManagerTag
    this.controller.listen();
  }
}

const controller = new Controller();

// `view` keeps untagged members; `pick` keeps only the tagged ones.
view<GameTag | typeof Renderer.tag>()(controller).describe();
pick<GameTag | typeof Renderer.tag>()(controller).draw();
```
