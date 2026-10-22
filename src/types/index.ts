/**
 * Shared types used across the framework, the algorithms and the pages.
 * Changing one of these affects both members' work: discuss it first.
 */

// ---------------------------------------------------------------------------
// Domain
// ---------------------------------------------------------------------------

export type Category = 'Electronics' | 'Books' | 'Clothing' | 'Home' | 'Sports';

export interface Product {
  id: number;
  name: string;
  category: Category;
  /** Price in euros. */
  price: number;
  stock: number;
  /** Average rating from 0 to 5. */
  rating: number;
  description: string;
}

// ---------------------------------------------------------------------------
// Virtual DOM
// ---------------------------------------------------------------------------

export type EventHandler = (event: Event) => void;

/**
 * Value of a VNode prop. Keys starting with `on` (e.g. `onClick`) hold event
 * handlers; everything else is set as a DOM attribute. `null`, `undefined`
 * and `false` mean "attribute absent".
 */
export type PropValue = string | number | boolean | EventHandler | null | undefined;

export type Props = Record<string, PropValue>;

/** An element node, e.g. `<div class="card">…</div>`. */
export interface VElement {
  kind: 'element';
  tag: string;
  props: Props;
  children: VNode[];
  /** Optional identity used by `diff` to match children between renders. */
  key?: string | number;
}

/** A text node. */
export interface VText {
  kind: 'text';
  text: string;
}

export type VNode = VElement | VText;

/**
 * What `h()` accepts as children. Strings and numbers become text nodes,
 * nested arrays are flattened, and `null` / `undefined` / booleans are
 * skipped so `cond && h(...)` works.
 */
export type Child = VNode | string | number | boolean | null | undefined | Child[];

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

/** Dynamic segments of a route, e.g. `{ id: '42' }` for `/product/:id`. */
export type RouteParams = Record<string, string>;

/** A page is a function from route params to a virtual tree. */
export type Page = (params: RouteParams) => VNode;

export interface Route {
  /** Pattern with `:name` placeholders, e.g. `/product/:id`. */
  path: string;
  page: Page;
}

export interface RouteMatch {
  route: Route;
  params: RouteParams;
}

// ---------------------------------------------------------------------------
// Algorithms
// ---------------------------------------------------------------------------

/** Negative if `a` comes before `b`, positive if after, 0 if equal. */
export type Comparator<T> = (a: T, b: T) => number;

export type SortAlgorithm = 'insertion' | 'quick' | 'merge';

export type SearchAlgorithm = 'linear' | 'binary';

/** The result of an algorithm together with how long it took. */
export interface Timed<T> {
  result: T;
  durationMs: number;
}
