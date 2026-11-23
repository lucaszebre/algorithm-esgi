/**
 * Tests for the Home and Product detail pages (src/pages/).
 *
 * Run:   npm test
 *
 * Pages return virtual trees, so they are checked without any DOM: the
 * helpers below read the text and the links out of a tree.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { homePage } from '../src/pages/home.ts';
import { productDetailPage } from '../src/pages/productDetail.ts';
import { notFoundPage } from '../src/pages/notFound.ts';
import { formatPrice, formatStars, formatStock } from '../src/pages/format.ts';
import { products } from '../src/data/products.ts';
import type { VElement, VNode } from '../src/types/index.ts';

/** All the text of a tree, joined. */
function textOf(node: VNode): string {
  return node.kind === 'text' ? node.text : node.children.map(textOf).join('');
}

/** Every element of a tree, depth first. */
function elements(node: VNode): VElement[] {
  return node.kind === 'text' ? [] : [node, ...node.children.flatMap(elements)];
}

const hrefs = (node: VNode) => elements(node).filter((e) => e.tag === 'a').map((e) => e.props.href);
const headings = (node: VNode) => elements(node).filter((e) => e.tag === 'h1').map(textOf);

describe('homePage', () => {
  it('presents the app', () => {
    assert.deepEqual(headings(homePage()), ['Algo Framework']);
  });

  it('links to the product list and to product pages', () => {
    const links = hrefs(homePage());
    assert.ok(links.includes('/products'), `links: ${links.join(', ')}`);
    assert.ok(links.some((href) => typeof href === 'string' && /^\/product\/\d+$/.test(href)));
  });
});

describe('productDetailPage', () => {
  const product = products[0];
  const page = productDetailPage({ id: String(product.id) });

  it('shows the product read from the :id param', () => {
    assert.deepEqual(headings(page), [product.name]);
    const text = textOf(page);
    for (const expected of [product.description, product.category, formatPrice(product.price), `${product.rating} / 5`]) {
      assert.ok(text.includes(expected), `missing "${expected}"`);
    }
  });

  it('has a Back button wired to a click handler', () => {
    const button = elements(page).find((e) => e.tag === 'button');
    assert.ok(button, 'no button');
    assert.match(textOf(button), /Back/);
    assert.equal(typeof button.props.onClick, 'function');
  });

  it('links to other products of the same category', () => {
    const related = hrefs(page).filter((href) => typeof href === 'string' && href.startsWith('/product/'));
    assert.ok(related.length > 0);
    assert.ok(!related.includes(`/product/${product.id}`), 'does not link to itself');
    for (const href of related) {
      const id = Number(String(href).split('/').pop());
      assert.equal(products.find((p) => p.id === id)?.category, product.category);
    }
  });

  it('shows "Product not found" for an unknown or invalid id', () => {
    for (const id of ['99999', '0', 'abc', '1.5', '-1', '']) {
      const notFound = productDetailPage({ id });
      assert.deepEqual(headings(notFound), ['Product not found'], `id "${id}"`);
      assert.ok(hrefs(notFound).includes('/products'));
    }
  });

  it('shows "Out of stock" when the stock is 0', () => {
    const soldOut = products.find((p) => p.stock === 0);
    assert.ok(soldOut, 'the data has an out-of-stock product');
    assert.ok(textOf(productDetailPage({ id: String(soldOut.id) })).includes('Out of stock'));
  });
});

describe('notFoundPage', () => {
  it('shows the unknown path and links home', () => {
    const page = notFoundPage('/nope');
    assert.ok(textOf(page).includes('/nope'));
    assert.ok(hrefs(page).includes('/'));
  });
});

describe('format helpers', () => {
  it('formatPrice', () => {
    assert.equal(formatPrice(89.99), '€89.99');
    assert.equal(formatPrice(119), '€119.00');
  });

  it('formatStars', () => {
    assert.equal(formatStars(4.2), '★★★★☆');
    assert.equal(formatStars(0), '☆☆☆☆☆');
    assert.equal(formatStars(5), '★★★★★');
  });

  it('formatStock', () => {
    assert.equal(formatStock(0), 'Out of stock');
    assert.equal(formatStock(3), 'Only 3 left');
    assert.equal(formatStock(50), 'In stock (50)');
  });
});
