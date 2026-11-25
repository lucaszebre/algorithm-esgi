/**
 * Search algorithms (Session 4). Implemented in #6.
 */
import type { Comparator } from '../types';

/** Returns every item matching `predicate`, scanning the array once. */
export function linearSearch<T>(_items: readonly T[], _predicate: (item: T) => boolean): T[] {
  throw new Error('linearSearch: not implemented (#6)');
}

/**
 * Returns the index of `target` in `sortedItems`, or -1. The array must
 * already be sorted with the same `compare`.
 */
export function binarySearch<T>(_sortedItems: readonly T[], _target: T, _compare: Comparator<T>): number {
  throw new Error('binarySearch: not implemented (#6)');
}
