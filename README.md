# ts-tags

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
