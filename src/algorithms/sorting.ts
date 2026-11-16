/**
 * Sorting algorithms (Session 5).
 *
 * Every function is pure: it returns a new sorted array and never mutates
 * its input. Order is decided by `compare(a, b)`: negative means `a` comes
 * first, positive means `b` comes first, 0 means they are equal.
 */
import type { Comparator } from '../types';

/**
 * Insertion sort: walks the array left to right and slides each item back
 * into place inside the already sorted part on its left, like sorting a hand
 * of cards.
 *
 * Time: best O(n) (already sorted), average O(n²), worst O(n²) (reversed).
 * Space: O(n) for the copy, O(1) extra. Stable.
 */
export function insertionSort<T>(items: readonly T[], compare: Comparator<T>): T[] {
  const result = [...items];

  for (let i = 1; i < result.length; i++) {
    const current = result[i];
    let j = i - 1;

    // Shift every bigger item one slot right to open a hole for `current`.
    // Strict `> 0` keeps equal items in their original order (stable).
    while (j >= 0 && compare(result[j], current) > 0) {
      result[j + 1] = result[j];
      j--;
    }
    result[j + 1] = current;
  }

  return result;
}

/**
 * Quick sort (recursive): picks a pivot, splits the items into those
 * smaller than, equal to and greater than the pivot, sorts the smaller and
 * greater parts recursively and joins the three.
 *
 * The pivot is the middle item so already sorted input does not hit the
 * worst case.
 *
 * Time: best O(n log n), average O(n log n), worst O(n²) (when the pivot is
 * always the smallest or largest item).
 * Space: O(n) for the partitions, O(log n) recursion depth on average.
 * Stable, because each partition keeps the original order of its items.
 */
export function quickSort<T>(items: readonly T[], compare: Comparator<T>): T[] {
  // Base case: 0 or 1 item is already sorted.
  if (items.length <= 1) {
    return [...items];
  }

  const pivot = items[Math.floor(items.length / 2)];
  const smaller: T[] = [];
  const equal: T[] = [];
  const greater: T[] = [];

  for (const item of items) {
    const order = compare(item, pivot);
    if (order < 0) smaller.push(item);
    else if (order > 0) greater.push(item);
    else equal.push(item);
  }

  return [...quickSort(smaller, compare), ...equal, ...quickSort(greater, compare)];
}

/**
 * Merge sort (recursive): cuts the array in two halves, sorts each half
 * recursively, then merges the two sorted halves into one.
 *
 * Time: best, average and worst O(n log n): the array is halved log n
 * times and each level merges n items.
 * Space: O(n) for the merged arrays, O(log n) recursion depth. Stable.
 */
export function mergeSort<T>(items: readonly T[], compare: Comparator<T>): T[] {
  // Base case: 0 or 1 item is already sorted. It must be `<= 1`: with
  // `< 1`, a 1-item array would split into [] and itself forever.
  if (items.length <= 1) {
    return [...items];
  }

  const mid = Math.floor(items.length / 2);
  const left = mergeSort(items.slice(0, mid), compare);
  const right = mergeSort(items.slice(mid), compare);

  return merge(left, right, compare);
}

/** Merges two sorted arrays into one sorted array. */
function merge<T>(left: readonly T[], right: readonly T[], compare: Comparator<T>): T[] {
  const result: T[] = [];
  let i = 0;
  let j = 0;

  // While both arrays have items left, take the smaller front item.
  // `<= 0` takes from `left` on ties, which keeps the sort stable.
  while (i < left.length && j < right.length) {
    if (compare(left[i], right[j]) <= 0) {
      result.push(left[i]);
      i++;
    } else {
      result.push(right[j]);
      j++;
    }
  }

  // One array is empty now: the rest of the other is already sorted.
  while (i < left.length) result.push(left[i++]);
  while (j < right.length) result.push(right[j++]);

  return result;
}
