/**
 * Turns virtual trees into real DOM nodes (Session 3). Implemented in #7.
 */
import type { VNode } from '../types';

/** Recursively creates the DOM node for `vnode`. */
export function render(_vnode: VNode): Node {
  throw new Error('render: not implemented (#7)');
}

/** Renders `vnode` inside `container`, replacing its content. */
export function mount(_vnode: VNode, _container: Element): void {
  throw new Error('mount: not implemented (#7)');
}
