/**
 * Stack-based navigation on top of the History API (Session 2).
 *
 * The router keeps its own history as an explicit stack of paths:
 *
 *   navigate('/products')    push  →  ['/', '/products']
 *   navigate('/product/3')   push  →  ['/', '/products', '/product/3']
 *   back()                   pop   →  ['/', '/products']
 *
 * The top of the stack is always the page on screen. The browser history is
 * kept in sync: every entry we push stores its position in the stack
 * (`history.state.index`), so the `popstate` event (browser back / forward
 * buttons) tells us how many entries to pop, or that one must be pushed.
 *
 * Rendering is not done here: `startRouter` takes a `render` callback that
 * receives the matched route (or `null` for a 404). This keeps the router
 * independent from the renderer.
 */
import type { Route, RouteMatch, RouteParams } from '../types';

// ---------------------------------------------------------------------------
// Stack
// ---------------------------------------------------------------------------

/** A LIFO stack: the last element pushed is the first one popped. */
export class Stack<T> {
  #items: T[] = [];

  /** Adds `item` on top of the stack. O(1). */
  push(item: T): void {
    this.#items.push(item);
  }

  /** Removes and returns the top item, or `undefined` if the stack is empty. O(1). */
  pop(): T | undefined {
    return this.#items.pop();
  }

  /** Returns the top item without removing it. O(1). */
  peek(): T | undefined {
    return this.#items[this.#items.length - 1];
  }

  get size(): number {
    return this.#items.length;
  }

  /** Copy of the items, bottom first. */
  toArray(): T[] {
    return [...this.#items];
  }
}

// ---------------------------------------------------------------------------
// Route matching
// ---------------------------------------------------------------------------

/** Splits a path into its segments, ignoring the query string, the hash and extra slashes. */
function segmentsOf(path: string): string[] {
  const pathname = path.split(/[?#]/)[0];
  return pathname.split('/').filter((segment) => segment !== '');
}

/**
 * Finds the first route whose pattern matches `path` and extracts its params.
 *
 * A pattern is a list of segments; `:name` matches any single segment and
 * captures it under `name`. Every other segment must be equal.
 *
 * @example match(routes, '/product/42?tab=specs') // → { route: productRoute, params: { id: '42' } }
 * @returns `null` if no route matches (404).
 */
export function match(routes: readonly Route[], path: string): RouteMatch | null {
  const pathSegments = segmentsOf(path);

  for (const route of routes) {
    const patternSegments = segmentsOf(route.path);
    if (patternSegments.length !== pathSegments.length) continue;

    const params: RouteParams = {};
    let matches = true;

    for (let i = 0; i < patternSegments.length; i++) {
      const pattern = patternSegments[i];
      const segment = pathSegments[i];

      if (pattern.startsWith(':')) {
        try {
          params[pattern.slice(1)] = decodeURIComponent(segment);
        } catch {
          matches = false; // malformed escape such as `%E0%A4%A`
          break;
        }
      } else if (pattern !== segment) {
        matches = false;
        break;
      }
    }

    if (matches) return { route, params };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

/** Called each time the current page changes. `match` is `null` when no route matches (404). */
export type RenderFn = (match: RouteMatch | null, path: string) => void;

export interface RouterOptions {
  routes: readonly Route[];
  render: RenderFn;
}

/** What we store in `history.state` for each entry we create. */
interface HistoryState {
  index: number;
}

/** State of the running router, `null` until `startRouter` is called. */
let router: {
  routes: readonly Route[];
  render: RenderFn;
  stack: Stack<string>;
  /**
   * History index of the bottom of the stack. It is 0 unless the page was
   * reloaded: the browser keeps the older entries (and their indexes) but our
   * stack restarts with only the current one.
   */
  base: number;
  /**
   * Set by `back()`: the history index the browser is moving to. Our stack is
   * already there, so the `popstate` events on the way are ignored.
   */
  syncingTo: number | null;
  /**
   * Paths given to `navigate()` while the browser was still going back: they
   * are already on the stack and on screen, and are added to the browser
   * history once it has arrived (a pushState before that would land on the
   * wrong entry).
   */
  pendingPushes: string[];
} | null = null;

function requireRouter() {
  if (!router) throw new Error('The router is not started: call startRouter() first');
  return router;
}

/** History index of the page on top of the stack. */
function topIndex(): number {
  const { base, stack } = requireRouter();
  return base + stack.size - 1;
}

/** Current path as shown in the address bar, query string and hash included. */
function currentLocation(): string {
  return location.pathname + location.search + location.hash;
}

/** Renders the page on top of the stack. */
function renderTop(): void {
  const { routes, render, stack } = requireRouter();
  const path = stack.peek() ?? '/';
  render(match(routes, path), path);
}

/**
 * Pushes `path` onto the stack, adds a browser history entry and renders it.
 * Navigating to the page already on screen does nothing.
 */
export function navigate(path: string): void {
  const state = requireRouter();
  if (path === state.stack.peek()) return;

  state.stack.push(path);
  if (state.syncingTo !== null) state.pendingPushes.push(path);
  else history.pushState({ index: topIndex() } satisfies HistoryState, '', path);
  renderTop();
}

/**
 * Pops the current page and renders the previous one.
 *
 * When the stack holds a single page (the user opened a link directly), there
 * is nothing to go back to: the router goes to the home page instead.
 */
export function back(): void {
  const state = requireRouter();
  const { stack } = state;

  if (state.pendingPushes.length > 0) {
    // The page on screen is not in the browser history yet: just drop it.
    stack.pop();
    state.pendingPushes.pop();
    renderTop();
  } else if (stack.size > 1) {
    stack.pop();
    renderTop();
    // Keep the address bar in sync. The browser answers with a `popstate`
    // (one per call when back() is called several times in a row), which
    // onPopState ignores because the stack is already up to date.
    state.syncingTo = topIndex();
    history.back();
  } else if (stack.peek() !== '/') {
    stack.pop();
    stack.push('/');
    history.replaceState({ index: topIndex() } satisfies HistoryState, '', '/');
    renderTop();
  }
}

/** True when `back()` returns to a previous page rather than to the home page. */
export function canGoBack(): boolean {
  return requireRouter().stack.size > 1;
}

/** The paths in the stack, bottom first (the last one is on screen). */
export function historyStack(): string[] {
  return requireRouter().stack.toArray();
}

/**
 * Browser back / forward buttons. `history.state.index` is the position of the
 * entry the browser moved to: if it is below the top of our stack the user
 * went back (pop), otherwise they went forward (push).
 */
function onPopState(event: PopStateEvent): void {
  const state = requireRouter();
  const { stack } = state;
  const target = (event.state as HistoryState | null)?.index;
  const path = currentLocation();

  if (state.syncingTo !== null && typeof target === 'number' && target >= state.syncingTo) {
    // The browser is catching up with our own back(): the stack is already
    // right. Once it has arrived, add the pages navigated to in the meantime.
    if (target === state.syncingTo) {
      const paths = state.pendingPushes;
      state.syncingTo = null;
      state.pendingPushes = [];
      paths.forEach((p, i) => {
        history.pushState({ index: target + 1 + i } satisfies HistoryState, '', p);
      });
    }
    return;
  }
  state.syncingTo = null;
  state.pendingPushes = [];

  if (typeof target === 'number' && target < topIndex()) {
    // Back: pop down to the entry the browser moved to.
    while (stack.size > 1 && topIndex() > target) stack.pop();
    // Went below the bottom of the stack (entries from before a reload):
    // the bottom entry becomes that one.
    if (topIndex() > target) state.base = target;
    if (stack.peek() !== path) {
      stack.pop();
      stack.push(path);
    }
  } else if (target === topIndex() && stack.peek() === path) {
    return; // already on this page
  } else if (typeof target === 'number') {
    // Forward to an entry we created earlier (possibly several steps at once
    // from the browser's history menu).
    stack.push(path);
    state.base = target - (stack.size - 1);
  } else {
    // An entry we did not create (e.g. a `#hash` link): adopt it.
    stack.push(path);
    history.replaceState({ index: topIndex() } satisfies HistoryState, '');
  }

  renderTop();
}

/**
 * Sends clicks on internal links through `navigate()` instead of letting the
 * browser reload the page. Links to other sites, links opened in a new tab
 * (ctrl / cmd / shift / middle click, `target`) and downloads are left alone.
 */
function onLinkClick(event: MouseEvent): void {
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const anchor = (event.target as Element | null)?.closest?.('a');
  if (!anchor || !anchor.hasAttribute('href')) return;
  if (anchor.hasAttribute('download')) return;
  if (anchor.target && anchor.target !== '_self') return;

  const url = new URL(anchor.href, location.href);
  if (url.origin !== location.origin) return;

  event.preventDefault();
  navigate(url.pathname + url.search + url.hash);
}

/**
 * Starts the router: puts the current URL on the stack, renders it and
 * listens to the back / forward buttons and to link clicks.
 *
 * The stack only lives in memory: after a page reload it starts again from
 * the current URL (the browser back button still works, see `base`).
 *
 * @returns A function that stops the router and removes its listeners.
 */
export function startRouter({ routes, render }: RouterOptions): () => void {
  const stack = new Stack<string>();
  stack.push(currentLocation());
  // After a reload, `history.state` still holds the index we gave this entry.
  const previous = (history.state as HistoryState | null)?.index;
  const base = typeof previous === 'number' ? previous : 0;
  router = { routes, render, stack, base, syncingTo: null, pendingPushes: [] };

  history.replaceState({ index: base } satisfies HistoryState, '');
  window.addEventListener('popstate', onPopState);
  document.addEventListener('click', onLinkClick);
  renderTop();

  return () => {
    window.removeEventListener('popstate', onPopState);
    document.removeEventListener('click', onLinkClick);
    router = null;
  };
}
