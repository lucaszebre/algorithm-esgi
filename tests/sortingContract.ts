/**
 * Shared tests for every sorting algorithm of src/algorithms/sorting.ts.
 *
 * The contract (header of sorting.ts): pure, ordered by `compare`, and stable
 * (equal elements keep their original order). Each `*.test.ts` file calls
 * `describeSortingAlgorithm` and can add its own algorithm-specific groups.
 */
import { describe, test, before } from 'node:test';
import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';

export type SortFn = <T>(items: readonly T[], compare: (a: T, b: T) => number) => T[];
export type It = (name: string, fn: () => void) => void;

const SORTING_URL = new URL('../src/algorithms/sorting.ts', import.meta.url).href;
export const asc = (a: number, b: number) => a - b;
export const desc = (a: number, b: number) => b - a;
export const show = (value: unknown) => JSON.stringify(value);

/** Calls `sort` and returns how many times `compare` was called. */
export function countComparisons(sort: SortFn, input: number[]): number {
  let calls = 0;
  sort(input, (a, b) => {
    calls++;
    return a - b;
  });
  return calls;
}

/** Seeded random integers in [-range, range), so failures are reproducible. */
export function randomArray(length: number, range: number, seed: number): number[] {
  let s = seed;
  const rand = () => ((s = (s * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  return Array.from({ length }, () => Math.floor(rand() * 2 * range) - range);
}

type GuardResult = { status: 'ok' } | { status: 'hang' } | { status: 'not-implemented'; message: string };

/**
 * A synchronous infinite loop would freeze the whole test run, so we first call
 * the algorithm in a separate thread with a time limit.
 */
function runGuard(exportName: string, ms: number): Promise<GuardResult> {
  const code = `
    const { parentPort } = require('node:worker_threads');
    import(${JSON.stringify(SORTING_URL)}).then((mod) => {
      parentPort.postMessage({ loaded: true });
      const sort = mod[${JSON.stringify(exportName)}];
      const asc = (a, b) => a - b;
      const inputs = [[], [1], [2, 1], [1, 2], [3, 1, 2], [5, 4, 3, 2, 1, 0],
        Array.from({ length: 200 }, (_, i) => (i * 7919) % 200)];
      try {
        for (const input of inputs) sort(input, asc);
        parentPort.postMessage({ ok: true });
      } catch (err) {
        parentPort.postMessage({ ok: false, message: String(err && err.message) });
      }
    }, (err) => parentPort.postMessage({ ok: false, message: String(err) }));
  `;
  return new Promise((resolve) => {
    const worker = new Worker(code, { eval: true });
    const hang = () => {
      void worker.terminate();
      resolve({ status: 'hang' });
    };
    // Loading sorting.ts can be slow on a busy machine: it gets its own,
    // generous limit, and the `ms` limit only starts once the code is loaded.
    let timer = setTimeout(hang, 15_000);
    worker.on('message', (msg: { loaded?: boolean; ok: boolean; message?: string }) => {
      if (msg.loaded) {
        clearTimeout(timer);
        timer = setTimeout(hang, ms);
        return;
      }
      clearTimeout(timer);
      void worker.terminate();
      if (!msg.ok && /not implemented/i.test(msg.message ?? '')) {
        resolve({ status: 'not-implemented', message: msg.message ?? '' });
      } else {
        // Other exceptions count as "terminated": the real tests will show them.
        resolve({ status: 'ok' });
      }
    });
    worker.once('error', () => {
      clearTimeout(timer);
      resolve({ status: 'ok' });
    });
  });
}

/**
 * Declares the shared tests for `sort` (exported as `exportName` from
 * sorting.ts). `extra` adds algorithm-specific groups that use the same guard.
 */
export function describeSortingAlgorithm(
  exportName: string,
  sort: SortFn,
  extra?: (it: It) => void,
) {
  let guard: GuardResult = { status: 'hang' };

  function expectSorted<T>(input: readonly T[], compare: (a: T, b: T) => number, expected: T[]) {
    const before = show(input);
    const received = sort(input, compare);
    assert.deepEqual(
      received,
      expected,
      `input:    ${before}\nexpected: ${show(expected)}\nreceived: ${show(received)}`,
    );
  }

  describe(exportName, () => {
    before(async () => {
      guard = await runGuard(exportName, 2000);
    });

    test('is implemented and returns (does not loop forever) on small inputs', () => {
      if (guard.status === 'not-implemented') {
        assert.fail(`${exportName} is not implemented yet (it throws "${guard.message}"). All other tests are skipped.`);
      }
      assert.ok(
        guard.status === 'ok',
        `${exportName} did not return within 2s on small arrays: it never terminates. ` +
          'All other tests are skipped until this passes.',
      );
    });

    // Every test below is skipped if the guard failed.
    const it: It = (name, fn) =>
      test(name, (t) => {
        if (guard.status === 'not-implemented') return t.skip('not implemented yet');
        if (guard.status === 'hang') return t.skip(`${exportName} never terminates`);
        fn();
      });

    describe('basic cases', () => {
      it('empty array', () => expectSorted([], asc, []));
      it('single element', () => expectSorted([42], asc, [42]));
      it('two elements, already in order', () => expectSorted([1, 2], asc, [1, 2]));
      it('two elements, reversed', () => expectSorted([2, 1], asc, [1, 2]));
      it('three elements', () => expectSorted([3, 1, 2], asc, [1, 2, 3]));
      it('already sorted', () => expectSorted([1, 2, 3, 4, 5], asc, [1, 2, 3, 4, 5]));
      it('reverse sorted', () => expectSorted([5, 4, 3, 2, 1], asc, [1, 2, 3, 4, 5]));
      it('duplicates', () => expectSorted([3, 1, 3, 2, 1], asc, [1, 1, 2, 3, 3]));
      it('all equal', () => expectSorted([7, 7, 7], asc, [7, 7, 7]));
      it('negative numbers and zero', () => expectSorted([0, -5, 3, -1, 2], asc, [-5, -1, 0, 2, 3]));
      it('smallest element at the end', () => expectSorted([2, 3, 4, 5, 1], asc, [1, 2, 3, 4, 5]));
      it('largest element at the start', () => expectSorted([5, 1, 2, 3, 4], asc, [1, 2, 3, 4, 5]));
    });

    describe('uses the comparator', () => {
      it('numbers are compared numerically, not as strings ([10, 9, 100, 1])', () =>
        expectSorted([10, 9, 100, 1], asc, [1, 9, 10, 100]));

      it('descending comparator gives descending order', () =>
        expectSorted([3, 1, 4, 1, 5, 9, 2], desc, [9, 5, 4, 3, 2, 1, 1]));

      it('sorts objects by a key (price)', () => {
        const products = [
          { name: 'Lamp', price: 30 },
          { name: 'Book', price: 12 },
          { name: 'Phone', price: 499 },
          { name: 'Shirt', price: 20 },
        ];
        const sorted = sort(products, (a, b) => a.price - b.price).map((p) => `${p.name}(${p.price})`);
        const expected = ['Book(12)', 'Shirt(20)', 'Lamp(30)', 'Phone(499)'];
        assert.deepEqual(sorted, expected, `expected: ${show(expected)}\nreceived: ${show(sorted)}`);
      });

      it('sorts strings with localeCompare', () =>
        expectSorted(['pear', 'apple', 'fig', 'banana'], (a, b) => a.localeCompare(b), [
          'apple', 'banana', 'fig', 'pear',
        ]));

      it('actually calls the comparator', () => {
        assert.ok(countComparisons(sort, [3, 1, 2]) > 0, 'compare was never called');
      });
    });

    describe('stability', () => {
      it('equal keys keep their original order', () => {
        const items = [
          { key: 2, id: 'a' },
          { key: 1, id: 'b' },
          { key: 2, id: 'c' },
          { key: 1, id: 'd' },
          { key: 2, id: 'e' },
        ];
        const sorted = sort(items, (x, y) => x.key - y.key).map((x) => `${x.key}${x.id}`);
        const expected = ['1b', '1d', '2a', '2c', '2e'];
        assert.deepEqual(
          sorted,
          expected,
          `input:    ["2a","1b","2c","1d","2e"]  (number = key, letter = original order)\n` +
            `expected: ${show(expected)}\nreceived: ${show(sorted)}`,
        );
      });

      it('stable on a bigger array (40 items, keys 0–3)', () => {
        const items = randomArray(40, 2, 99).map((key, index) => ({ key, index }));
        const sorted = sort(items, (x, y) => x.key - y.key);
        const expected = [...items].sort((x, y) => x.key - y.key || x.index - y.index);
        const label = (xs: typeof items) => show(xs.map((x) => `${x.key}#${x.index}`));
        assert.deepEqual(
          sorted,
          expected,
          `(key#original index)\nexpected: ${label(expected)}\nreceived: ${label(sorted)}`,
        );
      });
    });

    describe('purity', () => {
      it('does not mutate the input', () => {
        const input = [5, 3, 4, 1, 2];
        const copy = [...input];
        sort(input, asc);
        assert.deepEqual(input, copy, `input before: ${show(copy)}\ninput after:  ${show(input)}`);
      });

      it('works on a frozen (readonly) array', () => expectSorted(Object.freeze([3, 1, 2]), asc, [1, 2, 3]));

      it('returns a new array, not the same reference', () => {
        const input = [1, 2, 3];
        assert.notEqual(sort(input, asc), input, `${exportName} returned the input array itself`);
      });
    });

    extra?.(it);

    describe('random arrays (compared with the built-in sort)', () => {
      for (let run = 0; run < 20; run++) {
        const input = randomArray((run * 37) % 50, 50, 12345 + run);
        it(`random #${run + 1} (length ${input.length})`, () => {
          const result = sort(input, asc);
          assert.equal(result.length, input.length, `length changed: ${input.length} → ${result.length}`);
          expectSorted(input, asc, [...input].sort(asc));
        });
      }
    });
  });
}
