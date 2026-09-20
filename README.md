# ts-tags

## Example usage

```ts
import { pick, tags, view } from "ts-tags";

declare const ManagerTag: unique symbol;
type ManagerTag = typeof ManagerTag;

declare const GameTag: unique symbol;
type GameTag = typeof GameTag;

class Controller {
  public start = tags<ManagerTag>()(function () {
    console.log("controller: start");
  });

  public listen = tags<GameTag>()(function () {
    console.log("controller: listen");
  });
}

class GameObject {
  private controller = view<ManagerTag>()(new Controller());
  public start() {
    this.controller.start();
    // @ts-expect-error listen doesn't exist on the manager view's type-level
    this.controller.listen();
  }
}

class First {
  static readonly tag: unique symbol = Symbol();

  thing = 0;

  actionA = tags<typeof Second.tag>()(function (id: string, name: string) {
    return `Hello ${name}, your id is ${id}`;
  });

  actionB() {
    return "This method is not a friend of Second";
  }

  c = tags<typeof Third.tag>()(100);
  d = tags<"base_layer" | "overlay_layer">()(100);
}

class Second {
  static readonly tag: unique symbol = Symbol();
  controller = new First();
  public action = tags<typeof First.tag>()((a: number) => a.toString());
}

class Third {
  static readonly tag: unique symbol = Symbol();
  controller = view<typeof Third.tag>()(new First());
}

const second = new Second();

view<typeof Second.tag | typeof Third.tag>()(second.controller).actionA(
  "123",
  "Alice",
);

pick<typeof Second.tag | typeof Third.tag>()(second.controller).actionA(
  "123",
  "Alice",
);

second.action(2);

console.log(First.tag);
```
