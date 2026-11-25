/**
 * Stack-based navigation on top of the History API (Session 2).
 * Implemented in #3.
 */
import type { Route, RouteMatch } from '../types';

/** Finds the route matching `path` and extracts its `:params`. */
export function match(_routes: readonly Route[], _path: string): RouteMatch | null {
  throw new Error('match: not implemented (#3)');
}

/** Pushes `path` onto the history stack and renders it. */
export function navigate(_path: string): void {
  throw new Error('navigate: not implemented (#3)');
}

/** Pops the current entry and renders the previous one. */
export function back(): void {
  throw new Error('back: not implemented (#3)');
}
