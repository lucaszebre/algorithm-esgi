/**
 * Hyperscript `h()` to build virtual trees (Session 3).
 *
 * A virtual tree is a plain object description of the DOM: cheap to create,
 * easy to compare (see diff.ts) and turned into real nodes by renderer.ts.
 *
 * @example
 * h('ul', { class: 'list' },
 *   h('li', null, 'Apple'),
 *   items.map((item) => h('li', { key: item.id }, item.name)),
 *   isEmpty && h('li', null, 'Nothing here'),
 * )
 */
import type { Child, Props, VElement, VNode, VText } from '../types';

/** Creates a text node. */
export function text(value: string | number): VText {
  return { kind: 'text', text: String(value) };
}

/**
 * Recursively flattens `children` into a list of VNodes:
 * nested arrays are opened, strings and numbers become text nodes, and
 * `null`, `undefined`, `true` and `false` are dropped (so `cond && h(...)` works).
 */
function normalizeChildren(children: readonly Child[], out: VNode[] = []): VNode[] {
  for (const child of children) {
    if (Array.isArray(child)) {
      normalizeChildren(child, out); // recursive case: an array of children
    } else if (child === null || child === undefined || typeof child === 'boolean') {
      continue;
    } else if (typeof child === 'string' || typeof child === 'number') {
      out.push(text(child));
    } else {
      out.push(child);
    }
  }
  return out;
}

/**
 * Creates an element node.
 *
 * @param tag      HTML tag name, e.g. `'div'`.
 * @param props    Attributes and event handlers (`onClick`, …), or `null`.
 *                 The special `key` prop identifies the node among its
 *                 siblings for `diff`; it is not rendered as an attribute.
 * @param children Nodes, strings, numbers, arrays of those, or falsy values to skip.
 */
export function h(tag: string, props: Props | null, ...children: Child[]): VElement {
  const { key, ...rest } = props ?? {};
  const node: VElement = { kind: 'element', tag, props: rest, children: normalizeChildren(children) };
  if (typeof key === 'string' || typeof key === 'number') node.key = key;
  return node;
}
