/**
 * Tests for mergeSort (src/algorithms/sorting.ts).
 *
 * Run:   npm test
 * Watch: npm run test:watch
 *
 * The shared checks (order, comparator, stability, purity, random arrays) are
 * in ./sortingContract.ts. This file adds the merge-sort-specific ones.
 */
import { describe } from 'node:test';
import assert from 'node:assert/strict';
import { mergeSort } from '../src/algorithms/sorting.ts';
import { asc, countComparisons, describeSortingAlgorithm, randomArray } from './sortingContract.ts';

/**
 * Merge sort's comparison count is at most n · ⌈log2 n⌉ on EVERY input: each
 * level of recursion merges n elements with fewer than n comparisons, and
 * there are ⌈log2 n⌉ levels. An O(n²) sort is far above it.
 */
const limit = (n: number) => n * Math.ceil(Math.log2(n));

describeSortingAlgorithm('mergeSort', mergeSort, (it) => {
  describe('larger inputs', () => {
    it('sorts 10 000 random numbers', () => {
      const input = randomArray(10_000, 1000, 2024);
      const received = mergeSort(input, asc);
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

    it('sorts odd lengths (3, 5, 7, … 99)', () => {
      for (let length = 3; length < 100; length += 2) {
        const input = randomArray(length, 50, length);
        const received = mergeSort(input, asc);
        assert.deepEqual(
          received,
          [...input].sort(asc),
          `fails for length ${length}\ninput:    ${JSON.stringify(input)}\nreceived: ${JSON.stringify(received)}`,
        );
      }
    });

    it('sorts an array with many duplicates (1000 items, values 0–4)', () => {
      const input = randomArray(1000, 3, 7).map((v) => Math.abs(v) % 5);
      const received = mergeSort(input, asc);
      assert.deepEqual(received, [...input].sort(asc), 'the result is not sorted (or elements were lost / duplicated)');
    });
  });

  describe('efficiency: O(n log n) on every input (number of comparisons)', () => {
    const n = 2000;
    const cases: [string, number[]][] = [
      ['random array', randomArray(n, 100_000, 31)],
      ['already sorted array', Array.from({ length: n }, (_, i) => i)],
      ['reversed array', Array.from({ length: n }, (_, i) => n - i)],
      ['all equal array', Array.from({ length: n }, () => 7)],
    ];

    for (const [label, input] of cases) {
      it(`${label} of ${n} → at most n·⌈log2 n⌉ = ${limit(n)} comparisons`, () => {
        const calls = countComparisons(mergeSort, input);
        assert.ok(
          calls <= limit(n),
          `input:    ${label} of ${n}\n` +
            `expected: at most ${limit(n)} comparisons (n · ⌈log2 n⌉)\n` +
            `received: ${calls} comparisons (an O(n²) sort does about ${(n * n) / 2})`,
        );
      });
    }
  });
});
