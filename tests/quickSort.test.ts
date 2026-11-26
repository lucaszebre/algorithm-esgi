/**
 * Tests for quickSort (src/algorithms/sorting.ts).
 *
 * Run:   npm test
 * Watch: npm run test:watch
 *
 * The shared checks (order, comparator, stability, purity, random arrays) are
 * in ./sortingContract.ts. This file adds the quick-sort-specific ones.
 */
import { describe } from 'node:test';
import assert from 'node:assert/strict';
import { quickSort } from '../src/algorithms/sorting.ts';
import { asc, countComparisons, describeSortingAlgorithm, randomArray } from './sortingContract.ts';

/** Generous O(n log n) budget: 10 · n · log2(n). An O(n²) sort is far above it. */
const budget = (n: number) => Math.round(10 * n * Math.log2(n));

describeSortingAlgorithm('quickSort', quickSort, (it) => {
  describe('larger inputs', () => {
    it('sorts 10 000 random numbers', () => {
      const input = randomArray(10_000, 1000, 2024);
      const received = quickSort(input, asc);
      const expected = [...input].sort(asc);
      const firstWrong = received.findIndex((v, i) => v !== expected[i]);
      assert.ok(
        received.length === input.length && firstWrong === -1,
        received.length !== input.length
          ? `length changed: ${input.length} → ${received.length}`
          : `first wrong position: index ${firstWrong}\n` +
              `expected: …${expected.slice(firstWrong, firstWrong + 5).join(', ')}…\n` +
              `received: …${received.slice(firstWrong, firstWrong + 5).join(', ')}…`,
      );
    });

    it('sorts an array with many duplicates (1000 items, values 0–4)', () => {
      const input = randomArray(1000, 3, 7).map((v) => Math.abs(v) % 5);
      const received = quickSort(input, asc);
      assert.deepEqual(received, [...input].sort(asc), 'the result is not sorted (or elements were lost / duplicated)');
    });
  });

  describe('efficiency (number of comparisons)', () => {
    const n = 2000;

    it(`average case: random array of ${n} → at most ${budget(n)} comparisons (O(n log n))`, () => {
      const calls = countComparisons(quickSort, randomArray(n, 100_000, 31));
      assert.ok(
        calls <= budget(n),
        `input:    ${n} random numbers\n` +
          `expected: at most ${budget(n)} comparisons (10 · n · log2 n)\n` +
          `received: ${calls} comparisons (an O(n²) sort does about ${(n * n) / 2})`,
      );
    });
  });

  describe('tricky inputs for quick sort (pivot choice)', () => {
    const n = 2000;

    it(`already sorted array of ${n} → at most ${budget(n)} comparisons`, () => {
      const calls = countComparisons(quickSort, Array.from({ length: n }, (_, i) => i));
      assert.ok(
        calls <= budget(n),
        `input:    [0, 1, 2, …, ${n - 1}] (already sorted)\n` +
          `expected: at most ${budget(n)} comparisons\n` +
          `received: ${calls} comparisons: this input makes your quick sort O(n²)`,
      );
    });

    it(`reversed array of ${n} → at most ${budget(n)} comparisons`, () => {
      const calls = countComparisons(quickSort, Array.from({ length: n }, (_, i) => n - i));
      assert.ok(
        calls <= budget(n),
        `input:    [${n}, ${n - 1}, …, 1] (reversed)\n` +
          `expected: at most ${budget(n)} comparisons\n` +
          `received: ${calls} comparisons: this input makes your quick sort O(n²)`,
      );
    });

    it(`all equal array of ${n} → at most ${budget(n)} comparisons`, () => {
      const calls = countComparisons(quickSort, Array.from({ length: n }, () => 7));
      assert.ok(
        calls <= budget(n),
        `input:    [7, 7, 7, …] (${n} times)\n` +
          `expected: at most ${budget(n)} comparisons\n` +
          `received: ${calls} comparisons: this input makes your quick sort O(n²)`,
      );
    });
  });
});
