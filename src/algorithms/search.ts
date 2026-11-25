/**
 * Search algorithms (Session 4). Implemented in #6.
 */
import type { Comparator } from '../types';

/** Returns every item matching `predicate`, scanning the array once. */
export function linearSearch<T>(
  items: readonly T[],
  predicate: (item: T) => boolean,
): T[] {
  const result: T[] = [];

  for (const item of items) {
    if (predicate(item)) {
      result.push(item);
    }
  }

  return result;
}

/**
 * Returns the index of `target` in `sortedItems`, or -1. The array must
 * already be sorted with the same `compare`.
 */
export function binarySearch<T>(
  sortedItems: readonly T[],
  target: T,
  compare: Comparator<T>,
): number {
  let left = 0;
  let right = sortedItems.length - 1;

  while (left <= right) {
    const middle = Math.floor((left + right) / 2);

    const comparison = compare(sortedItems[middle], target);

    if (comparison === 0) {
      return middle;
    }

    if (comparison < 0) {
      left = middle + 1;
    } else {
      right = middle - 1;
    }
  }

  return -1;
}