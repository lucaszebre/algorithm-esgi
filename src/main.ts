/**
 * Entry point: registers the routes and starts the stack router, which
 * renders the matching page into #app on every navigation.
 */
import { h } from './framework/vdom.ts';
import { mount } from './framework/renderer.ts';
import { startRouter } from './router/stackRouter.ts';
import { homePage } from './pages/home.ts';
import { productListPage } from './pages/productList.ts';
import { productDetailPage } from './pages/productDetail.ts';
import { notFoundPage } from './pages/notFound.ts';
import type { Route, RouteMatch, VNode } from './types';

const container = document.querySelector<HTMLDivElement>('#app');
if (!container) throw new Error('#app container not found');
const app: HTMLDivElement = container;

const routes: Route[] = [
  { path: '/', page: homePage },
  { path: '/products', page: productListPage },
  { path: '/product/:id', page: productDetailPage },
];

/** Navigation bar shown above every page. */
function layout(content: VNode): VNode {
  return h('div', { class: 'layout' },
    h('nav', { class: 'nav' },
      h('a', { href: '/', class: 'brand' }, 'Algo Framework'),
      h('a', { href: '/products' }, 'Products'),
    ),
    h('main', null, content),
  );
}

/** Shown instead of the page when it throws, so one broken page does not blank the app. */
function errorPage(error: unknown): VNode {
  return h('section', { class: 'error' },
    h('h1', null, 'Something went wrong'),
    h('pre', null, error instanceof Error ? error.message : String(error)),
    h('p', null, h('a', { href: '/' }, 'Back to the home page')),
  );
}

function renderPage(match: RouteMatch | null, path: string): void {
  let content: VNode;
  try {
    content = match ? match.route.page(match.params) : notFoundPage(path);
  } catch (error) {
    console.error(error);
    content = errorPage(error);
  }
  mount(layout(content), app);
  window.scrollTo(0, 0);
}

startRouter({ routes, render: renderPage });
