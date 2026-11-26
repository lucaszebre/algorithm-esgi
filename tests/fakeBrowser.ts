/**
 * A minimal fake of the browser globals the router uses (`window`, `document`,
 * `location`, `history`), so it can be tested with `node --test` without a DOM.
 *
 * `history` keeps a list of entries and a cursor like the real one, and its
 * `back()` / `forward()` fire `popstate` asynchronously, as browsers do: tests
 * must `await flush()` after calling them.
 */

interface Entry {
  url: URL;
  state: unknown;
}

export interface FakeBrowser {
  /** The browser history entries and the cursor, to check the router keeps them in sync. */
  entries: () => string[];
  cursor: () => number;
  /** Simulates the browser back / forward buttons. */
  pressBack: () => Promise<void>;
  pressForward: () => Promise<void>;
  /** Simulates a click on a link; returns true if the router took it over (preventDefault). */
  clickLink: (href: string, options?: { target?: string; download?: boolean; init?: MouseEventInit }) => boolean;
  uninstall: () => void;
}

/** Waits for pending `popstate` events. */
export const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const ORIGIN = 'http://localhost:5173';

/** Installs the fake globals, with the page opened at `startPath`. */
export function installFakeBrowser(startPath = '/'): FakeBrowser {
  const entries: Entry[] = [{ url: new URL(startPath, ORIGIN), state: null }];
  let cursor = 0;

  const win = new EventTarget();
  const doc = new EventTarget();

  const current = () => entries[cursor];

  const location = {
    get href() { return current().url.href; },
    get origin() { return current().url.origin; },
    get pathname() { return current().url.pathname; },
    get search() { return current().url.search; },
    get hash() { return current().url.hash; },
  };

  // Like browsers, traversals are queued and each one starts from where the
  // previous one ended: two back() calls in a row go back two entries.
  const go = (delta: number) => {
    setTimeout(() => {
      const target = cursor + delta;
      if (target < 0 || target >= entries.length) return;
      cursor = target;
      const event = new Event('popstate') as PopStateEvent;
      Object.defineProperty(event, 'state', { value: current().state });
      win.dispatchEvent(event);
    }, 0);
  };

  const history = {
    get state() { return current().state; },
    get length() { return entries.length; },
    pushState(state: unknown, _unused: string, url?: string) {
      entries.splice(cursor + 1); // pushing drops the "forward" entries
      entries.push({ url: new URL(url ?? current().url.href, current().url), state: structuredClone(state) });
      cursor++;
    },
    replaceState(state: unknown, _unused: string, url?: string) {
      entries[cursor] = { url: new URL(url ?? current().url.href, current().url), state: structuredClone(state) };
    },
    back: () => go(-1),
    forward: () => go(1),
  };

  const globals = { window: win, document: doc, location, history };
  const saved = Object.fromEntries(
    Object.keys(globals).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
  );
  for (const [key, value] of Object.entries(globals)) {
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }

  return {
    entries: () => entries.map((e) => e.url.pathname + e.url.search + e.url.hash),
    cursor: () => cursor,
    pressBack: async () => { history.back(); await flush(); },
    pressForward: async () => { history.forward(); await flush(); },
    clickLink(href, { target = '', download = false, init = {} } = {}) {
      const anchor = {
        href: new URL(href, current().url).href,
        target,
        hasAttribute: (name: string) => name === 'href' || (name === 'download' && download),
        closest: (selector: string) => (selector === 'a' ? anchor : null),
      };
      // A <span> inside the link, to check the router looks up the closest <a>.
      const span = { closest: (selector: string) => (selector === 'a' ? anchor : null) };
      const event = new Event('click', { cancelable: true });
      Object.assign(event, { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, ...init });
      Object.defineProperty(event, 'target', { value: span });
      doc.dispatchEvent(event);
      return event.defaultPrevented;
    },
    uninstall() {
      for (const [key, descriptor] of Object.entries(saved)) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete (globalThis as Record<string, unknown>)[key];
      }
    },
  };
}
