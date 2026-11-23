/**
 * 404 page, shown when no route matches the URL.
 */
import { h } from '../framework/vdom.ts';
import type { VNode } from '../types';

export function notFoundPage(path: string): VNode {
  return h('section', { class: 'not-found' },
    h('h1', null, 'Page not found'),
    h('p', null, 'Nothing lives at ', h('code', null, path), '.'),
    h('p', null, h('a', { href: '/' }, 'Back to the home page')),
  );
}
