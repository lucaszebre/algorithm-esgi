/**
 * Search algorithms (Session 4). Implemented in #6.
 */
import type { Comparator } from '../types';

/**
 * Returns every item matching `predicate`, scanning the array once.
 *
 * Time complexity: O(n), where n is the array length.
 */
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
 * Returns the index of `target` in `sortedItems`, or -1.
 *
 * Precondition: the array must already be sorted using the same
 * comparator passed to this function.
 *
 * Time complexity: O(log n), where n is the array length.
 *
 * Example: sort the product list before searching by id:
 *
 * const compareById = (a: Product, b: Product) => a.id - b.id;
 * const sortedProducts = mergeSort(products, compareById);
 * const index = binarySearch(sortedProducts, products[0], compareById);
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