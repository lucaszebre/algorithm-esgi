/**
 * Product detail page (/product/:id): the full sheet of one product.
 */
import { h } from '../framework/vdom.ts';
import { back } from '../router/stackRouter.ts';
import { products } from '../data/products.ts';
import { formatPrice, formatStars, formatStock } from './format.ts';
import type { Product, RouteParams, VNode } from '../types';

/** Returns the product whose id is `param`, or `undefined` if `param` is not a valid id. */
function findProduct(param: string | undefined): Product | undefined {
  if (!param || !/^\d+$/.test(param)) return undefined;
  const id = Number(param);
  return products.find((product) => product.id === id);
}

/** "Back" goes to the previous page of the router stack (or home if there is none). */
function backButton(): VNode {
  return h('button', { type: 'button', class: 'back', onClick: () => back() }, '← Back');
}

function notFound(param: string | undefined): VNode {
  return h('section', { class: 'product-detail' },
    backButton(),
    h('h1', null, 'Product not found'),
    h('p', null, `There is no product with the id "${param ?? ''}".`),
    h('p', null, h('a', { href: '/products' }, 'See all products')),
  );
}

export function productDetailPage(params: RouteParams): VNode {
  const product = findProduct(params.id);
  if (!product) return notFound(params.id);

  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 3);

  return h('section', { class: 'product-detail' },
    backButton(),
    h('p', { class: 'muted' }, product.category),
    h('h1', null, product.name),
    h('p', { class: 'price' }, formatPrice(product.price)),
    h('p', null, product.description),

    h('dl', { class: 'facts' },
      h('dt', null, 'Rating'),
      h('dd', null, h('span', { class: 'stars', 'aria-hidden': 'true' }, formatStars(product.rating)), ` ${product.rating} / 5`),
      h('dt', null, 'Availability'),
      h('dd', { class: product.stock === 0 ? 'out-of-stock' : null }, formatStock(product.stock)),
      h('dt', null, 'Reference'),
      h('dd', null, `#${product.id}`),
    ),

    related.length > 0 && [
      h('h2', null, `More in ${product.category}`),
      h('ul', { class: 'cards' },
        related.map((p) =>
          h('li', { key: p.id, class: 'card' },
            h('a', { href: `/product/${p.id}` }, p.name),
            h('span', { class: 'muted' }, ` ${formatPrice(p.price)}`),
          ),
        ),
      ),
    ],
  );
}
