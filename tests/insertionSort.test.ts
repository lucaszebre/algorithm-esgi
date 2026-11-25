/**
 * Tests for insertionSort (src/algorithms/sorting.ts).
 *
 * Run:   npm test
 * Watch: npm run test:watch
 * Raw Node output (stack traces): npm run test:raw
 *
 * Uses Node's built-in test runner (no dependency). Lives outside `src` so it
 * does not affect `npm run typecheck` / `npm run build`.
 * The shared checks are in ./sortingContract.ts.
 */
import { describe } from 'node:test';
import assert from 'node:assert/strict';
import { insertionSort } from '../src/algorithms/sorting.ts';
import { countComparisons, describeSortingAlgorithm } from './sortingContract.ts';

describeSortingAlgorithm('insertionSort', insertionSort, (it) => {
  describe('efficiency (number of comparisons)', () => {
    const n = 100;

    it(`best case: already sorted array of ${n} → n − 1 = ${n - 1} comparisons (O(n))`, () => {
      const calls = countComparisons(insertionSort, Array.from({ length: n }, (_, i) => i));
      assert.equal(
        calls,
        n - 1,
        `input:    [0, 1, 2, …, ${n - 1}] (already sorted)\n` +
          `expected: ${n - 1} comparisons (one per element: it is already in place)\n` +
          `received: ${calls} comparisons`,
      );
    });

    it(`all equal array of ${n} → n − 1 = ${n - 1} comparisons (equal elements never move)`, () => {
      const calls = countComparisons(insertionSort, Array.from({ length: n }, () => 7));
      assert.equal(
        calls,
        n - 1,
        `input:    [7, 7, 7, …] (${n} times)\nexpected: ${n - 1} comparisons\nreceived: ${calls} comparisons`,
      );
    });

    it(`worst case: reversed array of ${n} → at most n(n − 1)/2 = ${(n * (n - 1)) / 2} comparisons`, () => {
      const max = (n * (n - 1)) / 2;
      const calls = countComparisons(insertionSort, Array.from({ length: n }, (_, i) => n - i));
      assert.ok(
        calls <= max,
        `input:    [${n}, ${n - 1}, …, 1] (reversed)\nexpected: at most ${max} comparisons\nreceived: ${calls} comparisons`,
      );
    });
  });
});
