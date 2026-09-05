import createDOMPurify, { type WindowLike } from "dompurify";

const FORBIDDEN_TAGS = [
  "script",
  "foreignObject",
  "iframe",
  "object",
  "embed",
  "audio",
  "video",
  "animate",
  "animateMotion",
  "animateTransform",
  "set",
];

const ACTIVE_PATTERN =
  /<\s*(script|foreignObject|iframe|object|embed|animate(?:Motion|Transform)?)\b|\son[a-z]+\s*=|javascript\s*:|(?:href|src)\s*=\s*["']\s*(?:https?:|\/\/)/i;
const UNSAFE_URL = /^\s*(?:javascript:|https?:|\/\/)/i;
const UNSAFE_STYLE =
  /(?:javascript:|@import|url\s*\(\s*["']?\s*(?:https?:|\/\/))/i;

export interface SanitizeResult {
  svg: string;
  changed: boolean;
  warnings: string[];
}

type SanitizerWindow = WindowLike & Pick<typeof globalThis, "XMLSerializer">;

export function sanitizeSvg(
  svg: string,
  domWindow: SanitizerWindow = globalThis,
): SanitizeResult {
  if (svg.length > 2_000_000)
    throw new Error("SVG exceeds the 2 MB safety limit.");
  const warnings: string[] = [];
  if (ACTIVE_PATTERN.test(svg))
    warnings.push("Active or external SVG content was removed.");

  const purifier = createDOMPurify(domWindow);
  const sanitized = purifier.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: FORBIDDEN_TAGS,
    FORBID_ATTR: ["srcset"],
  });
  const parser = new domWindow.DOMParser();
  const document = parser.parseFromString(sanitized, "image/svg+xml");
  if (
    document.querySelector("parsererror") ||
    document.documentElement.localName !== "svg"
  ) {
    throw new Error("The file is not a valid SVG document.");
  }

  for (const element of Array.from(document.querySelectorAll<Element>("*"))) {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value;
      if (name.startsWith("on")) {
        element.removeAttribute(attribute.name);
        warnings.push("Event handler removed.");
      } else if (
        ["href", "xlink:href", "src"].includes(name) &&
        UNSAFE_URL.test(value)
      ) {
        element.removeAttribute(attribute.name);
        warnings.push("External reference removed.");
      } else if (name === "style" && UNSAFE_STYLE.test(value)) {
        element.removeAttribute(attribute.name);
        warnings.push("Unsafe style removed.");
      }
    }
    if (
      element.localName === "style" &&
      UNSAFE_STYLE.test(element.textContent ?? "")
    ) {
      element.remove();
      warnings.push("Unsafe style block removed.");
    }
  }

  const output = new domWindow.XMLSerializer()
    .serializeToString(document.documentElement)
    .replace(/[ \t]+$/gm, "");
  return {
    svg: output,
    changed: warnings.length > 0,
    warnings: [...new Set(warnings)],
  };
}

export function containsActiveSvgContent(svg: string): boolean {
  return (
    ACTIVE_PATTERN.test(svg) ||
    /<\s*(foreignObject|script|iframe|object|embed|animate|set)\b/i.test(svg)
  );
}
