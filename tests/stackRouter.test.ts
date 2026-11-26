/**
 * Tests for the stack router (src/router/stackRouter.ts).
 *
 * Run:   npm test
 *
 * The browser globals are replaced by a fake (./fakeBrowser.ts), so the real
 * History API behaviour (async popstate, forward entries dropped on push) is
 * reproduced without a DOM.
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Stack, back, canGoBack, historyStack, match, navigate, startRouter } from '../src/router/stackRouter.ts';
import type { Route, RouteMatch } from '../src/types/index.ts';
import { type FakeBrowser, flush, installFakeBrowser } from './fakeBrowser.ts';

/** Pages are never called by the router itself: a placeholder is enough. */
const page = () => ({ kind: 'text', text: '' }) as const;

const home: Route = { path: '/', page };
const products: Route = { path: '/products', page };
const productDetail: Route = { path: '/product/:id', page };
const review: Route = { path: '/product/:id/reviews/:reviewId', page };
const routes = [home, products, productDetail, review];

describe('Stack', () => {
  it('pops in reverse order of push (LIFO)', () => {
    const stack = new Stack<number>();
    stack.push(1);
    stack.push(2);
    stack.push(3);
    assert.equal(stack.size, 3);
    assert.equal(stack.peek(), 3);
    assert.equal(stack.pop(), 3);
    assert.equal(stack.pop(), 2);
    assert.equal(stack.peek(), 1);
    assert.equal(stack.size, 1);
  });

  it('returns undefined when empty', () => {
    const stack = new Stack<string>();
    assert.equal(stack.pop(), undefined);
    assert.equal(stack.peek(), undefined);
    assert.equal(stack.size, 0);
  });

  it('toArray returns a copy, bottom first', () => {
    const stack = new Stack<string>();
    stack.push('a');
    stack.push('b');
    const items = stack.toArray();
    items.push('c');
    assert.deepEqual(stack.toArray(), ['a', 'b']);
  });
});

describe('match', () => {
  it('matches static routes', () => {
    assert.deepEqual(match(routes, '/'), { route: home, params: {} });
    assert.deepEqual(match(routes, '/products'), { route: products, params: {} });
  });

  it('extracts params', () => {
    assert.deepEqual(match(routes, '/product/42'), { route: productDetail, params: { id: '42' } });
    assert.deepEqual(match(routes, '/product/7/reviews/3'), { route: review, params: { id: '7', reviewId: '3' } });
  });

  it('ignores the query string, the hash and a trailing slash', () => {
    assert.equal(match(routes, '/products?sort=price&q=lamp')?.route, products);
    assert.equal(match(routes, '/products#top')?.route, products);
    assert.equal(match(routes, '/products/')?.route, products);
    assert.deepEqual(match(routes, '/product/42/?tab=specs')?.params, { id: '42' });
  });

  it('decodes params', () => {
    assert.deepEqual(match(routes, '/product/caf%C3%A9')?.params, { id: 'café' });
  });

  it('returns null when nothing matches (404)', () => {
    assert.equal(match(routes, '/nope'), null);
    assert.equal(match(routes, '/product'), null, 'a param segment cannot be empty');
    assert.equal(match(routes, '/product/1/2'), null, 'extra segments do not match');
    assert.equal(match(routes, '/products/extra'), null);
    assert.equal(match(routes, '/product/%E0%A4%A'), null, 'malformed escape');
    assert.equal(match([], '/'), null);
  });

  it('returns the first matching route', () => {
    const newProduct: Route = { path: '/product/new', page };
    assert.equal(match([newProduct, productDetail], '/product/new')?.route, newProduct);
    assert.equal(match([productDetail, newProduct], '/product/new')?.route, productDetail);
  });
});

describe('router', () => {
  let browser: FakeBrowser;
  let stop: () => void;
  /** Every render call, as the matched route path (or '404') and the URL. */
  let renders: string[];

  const start = (path: string) => {
    browser = installFakeBrowser(path);
    renders = [];
    const render = (m: RouteMatch | null, url: string) => renders.push(`${m ? m.route.path : '404'} ${url}`);
    stop = startRouter({ routes, render });
  };

  /** The page on screen, according to the last render. */
  const onScreen = () => renders.at(-1);

  afterEach(() => {
    stop();
    browser.uninstall();
  });

  describe('start', () => {
    it('renders the current URL', () => {
      start('/product/3');
      assert.deepEqual(renders, ['/product/:id /product/3']);
      assert.deepEqual(historyStack(), ['/product/3']);
      assert.equal(canGoBack(), false);
    });

    it('renders unknown URLs as 404', () => {
      start('/does-not-exist');
      assert.equal(onScreen(), '404 /does-not-exist');
    });
  });

  describe('navigate', () => {
    beforeEach(() => start('/'));

    it('pushes onto the stack, updates the URL and renders', () => {
      navigate('/products');
      navigate('/product/2');
      assert.deepEqual(historyStack(), ['/', '/products', '/product/2']);
      assert.deepEqual(browser.entries(), ['/', '/products', '/product/2']);
      assert.deepEqual(renders, ['/ /', '/products /products', '/product/:id /product/2']);
      assert.equal(canGoBack(), true);
    });

    it('keeps the query string', () => {
      navigate('/products?sort=price');
      assert.equal(onScreen(), '/products /products?sort=price');
      assert.deepEqual(browser.entries(), ['/', '/products?sort=price']);
    });

    it('does nothing when navigating to the page already on screen', () => {
      navigate('/products');
      navigate('/products');
      assert.deepEqual(historyStack(), ['/', '/products']);
      assert.equal(renders.length, 2);
    });
  });

  describe('back', () => {
    beforeEach(() => start('/'));

    it('pops and renders the previous page', async () => {
      navigate('/products');
      navigate('/product/2');
      back();
      assert.deepEqual(historyStack(), ['/', '/products']);
      assert.equal(onScreen(), '/products /products');

      await flush();
      assert.equal(browser.cursor(), 1, 'the address bar went back too');
      assert.deepEqual(historyStack(), ['/', '/products'], 'the popstate did not pop a second time');
      assert.equal(renders.length, 4, 'the popstate did not render a second time');
    });

    it('goes back several times in a row', async () => {
      navigate('/products');
      navigate('/product/1');
      navigate('/product/2');
      back();
      back();
      await flush();
      assert.deepEqual(historyStack(), ['/', '/products']);
      assert.equal(onScreen(), '/products /products');
      assert.equal(browser.cursor(), 1);
    });

    it('goes to the home page when there is nothing to go back to', () => {
      stop();
      browser.uninstall();
      start('/product/5');
      back();
      assert.deepEqual(historyStack(), ['/']);
      assert.equal(onScreen(), '/ /');
      assert.deepEqual(browser.entries(), ['/']);
    });

    it('does nothing on the home page with an empty history', () => {
      back();
      assert.deepEqual(historyStack(), ['/']);
      assert.equal(renders.length, 1);
    });
  });

  describe('browser back / forward buttons (popstate)', () => {
    beforeEach(() => start('/'));

    it('back button pops and renders', async () => {
      navigate('/products');
      navigate('/product/2');
      await browser.pressBack();
      assert.deepEqual(historyStack(), ['/', '/products']);
      assert.equal(onScreen(), '/products /products');
    });

    it('forward button pushes again', async () => {
      navigate('/products');
      navigate('/product/2');
      await browser.pressBack();
      await browser.pressBack();
      assert.deepEqual(historyStack(), ['/']);
      await browser.pressForward();
      assert.deepEqual(historyStack(), ['/', '/products']);
      assert.equal(onScreen(), '/products /products');
    });

    it('navigate after going back drops the forward entries', async () => {
      navigate('/products');
      navigate('/product/2');
      await browser.pressBack();
      navigate('/product/9');
      assert.deepEqual(historyStack(), ['/', '/products', '/product/9']);
      assert.deepEqual(browser.entries(), ['/', '/products', '/product/9']);
    });

    it('navigate() right after back() stays in sync', async () => {
      navigate('/products');
      navigate('/product/1');
      back();
      navigate('/product/2');
      await flush();
      assert.deepEqual(historyStack(), ['/', '/products', '/product/2']);
      assert.equal(onScreen(), '/product/:id /product/2');
      await browser.pressBack();
      assert.deepEqual(historyStack(), ['/', '/products']);
      assert.equal(onScreen(), '/products /products');
    });

    it('back() then back button stay in sync', async () => {
      navigate('/products');
      navigate('/product/1');
      back();
      await flush();
      await browser.pressBack();
      assert.deepEqual(historyStack(), ['/']);
      assert.equal(onScreen(), '/ /');
      assert.equal(browser.cursor(), 0);
    });
  });

  describe('page reload in the middle of the history', () => {
    /** Restarts the router on the same browser history, like a reload (F5). */
    const reload = () => {
      stop();
      renders = [];
      stop = startRouter({ routes, render: (m, url) => renders.push(`${m ? m.route.path : '404'} ${url}`) });
    };

    beforeEach(() => {
      start('/');
      navigate('/products');
      navigate('/product/1');
      reload();
    });

    it('restarts the stack from the current URL', () => {
      assert.deepEqual(historyStack(), ['/product/1']);
      assert.equal(onScreen(), '/product/:id /product/1');
    });

    it('browser back still goes to the previous page', async () => {
      await browser.pressBack();
      assert.equal(onScreen(), '/products /products');
      await browser.pressBack();
      assert.equal(onScreen(), '/ /');
      assert.equal(browser.cursor(), 0);
    });

    it('back() stays in sync with the address bar after browser back / forward', async () => {
      navigate('/product/2');
      await browser.pressBack();
      await browser.pressBack();
      assert.equal(onScreen(), '/products /products');
      await browser.pressForward();
      assert.equal(onScreen(), '/product/:id /product/1');
      back();
      await flush();
      assert.equal(onScreen(), '/products /products');
      assert.equal(browser.entries()[browser.cursor()], '/products');
    });
  });

  describe('link clicks', () => {
    beforeEach(() => start('/'));

    it('internal links go through navigate()', () => {
      assert.equal(browser.clickLink('/product/4'), true);
      assert.deepEqual(historyStack(), ['/', '/product/4']);
      assert.equal(onScreen(), '/product/:id /product/4');
    });

    it('keeps the query string and hash of the link', () => {
      browser.clickLink('/products?q=lamp#results');
      assert.deepEqual(historyStack(), ['/', '/products?q=lamp#results']);
    });

    it('leaves other links to the browser', () => {
      assert.equal(browser.clickLink('https://example.com/'), false, 'external link');
      assert.equal(browser.clickLink('/products', { target: '_blank' }), false, 'target=_blank');
      assert.equal(browser.clickLink('/products', { download: true }), false, 'download');
      assert.equal(browser.clickLink('/products', { init: { ctrlKey: true } }), false, 'ctrl+click');
      assert.equal(browser.clickLink('/products', { init: { metaKey: true } }), false, 'cmd+click');
      assert.equal(browser.clickLink('/products', { init: { button: 1 } }), false, 'middle click');
      assert.deepEqual(historyStack(), ['/']);
    });
  });

  it('throws a clear error when used before startRouter()', () => {
    start('/');
    stop();
    stop = () => {};
    assert.throws(() => navigate('/products'), /startRouter/);
  });
});
