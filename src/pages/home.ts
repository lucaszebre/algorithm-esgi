/**
 * Home page (/): presents the app and links to the other pages.
 */
import { h } from '../framework/vdom.ts';
import { categories, products } from '../data/products.ts';
import type { VNode } from '../types';

/** What the app demonstrates, with the course session for each pattern. */
const patterns: [name: string, session: string][] = [
  ['Stack navigation (History API)', 'Session 2: Stack'],
  ['Virtual DOM and recursive renderer', 'Session 3: Recursion'],
  ['Linear and binary search', 'Session 4: Search'],
  ['Insertion, quick and merge sort', 'Session 5: Sorting'],
];

/** Highest rated products first; ties keep catalogue order. */
const featured = [...products].sort((a, b) => b.rating - a.rating).slice(0, 3);

export function homePage(): VNode {
  return h('section', { class: 'home' },
    h('h1', null, 'Algo Framework'),
    h('p', { class: 'lead' },
      'A frontend framework written from scratch in TypeScript, without any library, ',
      'to put the algorithms of the course into practice on a small product catalogue.',
    ),
    h('p', null,
      h('a', { href: '/products', class: 'button' }, `Browse the ${products.length} products`),
    ),

    h('h2', null, 'What it shows'),
    h('ul', { class: 'patterns' },
      patterns.map(([name, session]) => h('li', { key: name }, h('strong', null, name), ` (${session})`)),
    ),

    h('h2', null, 'Top rated'),
    h('ul', { class: 'cards' },
      featured.map((product) =>
        h('li', { key: product.id, class: 'card' },
          h('a', { href: `/product/${product.id}` }, product.name),
          h('span', { class: 'muted' }, ` ${product.category} · ★ ${product.rating}`),
        ),
      ),
    ),

    h('p', { class: 'muted' }, `Categories: ${categories.join(', ')}.`),
  );
}
