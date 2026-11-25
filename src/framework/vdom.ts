/**
 * Hyperscript `h()` to build virtual trees (Session 3). Implemented in #7.
 *
 * @example h('a', { href: '/products' }, 'See products')
 */
import type { Child, Props, VElement } from '../types';

export function h(_tag: string, _props: Props | null, ..._children: Child[]): VElement {
  throw new Error('h: not implemented (#7)');
}
