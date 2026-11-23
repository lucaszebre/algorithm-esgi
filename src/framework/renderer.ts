/**
 * Turns virtual trees into real DOM nodes (Session 3).
 *
 * `render` walks the virtual tree recursively: a text node is a leaf (base
 * case), an element creates its DOM node then renders each child and
 * appends it (recursive case).
 *
 * `setProp` / `removeProp` are exported so that `patch` (diff.ts) can update
 * the props of an existing element the same way.
 */
import type { EventHandler, Props, PropValue, VNode } from '../types';

/**
 * Props that must be set as DOM properties rather than attributes: the
 * attribute only holds the initial value, the property holds what the user
 * sees (e.g. after typing in an input).
 */
const DOM_PROPERTIES = new Set(['value', 'checked', 'selected']);

/** Event listeners currently attached by the renderer, per element and event name. */
const listeners = new WeakMap<Element, Map<string, EventHandler>>();

/** `onClick` → `click`, `onInput` → `input`. */
function eventName(prop: string): string {
  return prop.slice(2).toLowerCase();
}

function isEventProp(name: string, value: PropValue): value is EventHandler {
  return name.startsWith('on') && typeof value === 'function';
}

/** Removes one prop (attribute, DOM property or event listener) from `el`. */
export function removeProp(el: Element, name: string): void {
  if (name.startsWith('on')) {
    const event = eventName(name);
    const handler = listeners.get(el)?.get(event);
    if (handler) {
      el.removeEventListener(event, handler);
      listeners.get(el)?.delete(event);
    }
    return;
  }
  if (DOM_PROPERTIES.has(name)) {
    (el as unknown as Record<string, unknown>)[name] = name === 'value' ? '' : false;
  }
  el.removeAttribute(name);
}

/**
 * Sets one prop on `el`:
 * - `onClick: fn`         → `click` event listener (replaces the previous one)
 * - `value`, `checked`, `selected` → DOM property (what the user sees)
 * - `true`                → attribute present with no value (`disabled`)
 * - `false` / `null` / `undefined` → attribute removed
 * - anything else (`class`, `style`, `href`, …) → attribute, as a string
 */
export function setProp(el: Element, name: string, value: PropValue): void {
  if (isEventProp(name, value)) {
    removeProp(el, name); // only one handler per event
    const event = eventName(name);
    el.addEventListener(event, value);
    if (!listeners.has(el)) listeners.set(el, new Map());
    listeners.get(el)?.set(event, value);
    return;
  }

  if (value === null || value === undefined || value === false || typeof value === 'function') {
    removeProp(el, name);
    return;
  }

  if (DOM_PROPERTIES.has(name)) {
    (el as unknown as Record<string, unknown>)[name] = name === 'value' ? String(value) : Boolean(value);
  }
  el.setAttribute(name, value === true ? '' : String(value));
}

/** Sets every prop of `props` on `el`. */
export function setProps(el: Element, props: Props): void {
  for (const [name, value] of Object.entries(props)) setProp(el, name, value);
}

/** Recursively creates the DOM node for `vnode`. */
export function render(vnode: VNode): Node {
  // Base case: a text node has no children.
  if (vnode.kind === 'text') return document.createTextNode(vnode.text);

  // Recursive case: create the element, then render each child into it.
  const el = document.createElement(vnode.tag);
  setProps(el, vnode.props);
  for (const child of vnode.children) el.appendChild(render(child));
  return el;
}

/** Renders `vnode` inside `container`, replacing its content. */
export function mount(vnode: VNode, container: Element): void {
  container.replaceChildren(render(vnode));
}
