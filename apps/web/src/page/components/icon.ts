import type { IconNode } from "lucide";
import { Html } from "foldkit";

export const icon = <Message>(
  h: ReturnType<typeof Html.html<Message>>,
  node: IconNode,
  label: string,
) =>
  h.svg(
    [
      h.Attribute("aria-hidden", "true"),
      h.Attribute("viewBox", "0 0 24 24"),
      h.Attribute("fill", "none"),
      h.Attribute("stroke", "currentColor"),
      h.Attribute("stroke-width", "2"),
      h.Attribute("stroke-linecap", "round"),
      h.Attribute("stroke-linejoin", "round"),
      h.AriaLabel(label),
      h.Class("size-4"),
    ],
    node.map(([tag, properties]) => {
      const attributes = Object.entries(properties).map(([name, value]) =>
        h.Attribute(name, String(value)),
      );
      switch (tag) {
        case "circle":
          return h.circle(attributes, []);
        case "line":
          return h.line(attributes, []);
        case "path":
          return h.path(attributes, []);
        case "polyline":
          return h.polyline(attributes, []);
        case "rect":
          return h.rect(attributes, []);
        default:
          return null;
      }
    }),
  );
