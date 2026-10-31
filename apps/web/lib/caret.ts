// Where a character offset sits inside a <textarea>, relative to the textarea's top-left corner.
// A hidden mirror copies the textarea's text layout; a marker span at the offset gives its position.

const COPIED = [
  "boxSizing",
  "width",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "letterSpacing",
  "lineHeight",
  "textTransform",
  "wordSpacing",
  "textIndent",
  "tabSize"
] as const;

export function caretPosition(textarea: HTMLTextAreaElement, offset: number) {
  const style = getComputedStyle(textarea);
  const mirror = document.createElement("div");
  for (const prop of COPIED) mirror.style[prop] = style[prop];
  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.overflowWrap = "break-word";
  mirror.style.top = "0";
  mirror.style.left = "-9999px";
  mirror.textContent = textarea.value.slice(0, offset);
  const marker = document.createElement("span");
  marker.textContent = textarea.value.slice(offset) || ".";
  mirror.appendChild(marker);
  document.body.appendChild(mirror);
  const position = { top: marker.offsetTop - textarea.scrollTop, left: marker.offsetLeft, lineHeight: parseFloat(style.lineHeight) || 24 };
  mirror.remove();
  return position;
}
