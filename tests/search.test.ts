import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  linearSearch,
  binarySearch,
} from '../src/algorithms/search.ts';

describe('linearSearch', () => {
  it('returns all matching values', () => {
    const result =
      linearSearch(
        [1, 2, 3, 4, 5, 6],
        (n) => n % 2 === 0,
      );

    assert.deepEqual(result, [2, 4, 6]);
  });

  it('returns an empty array when nothing matches', () => {
    const result =
      linearSearch(
        [1, 2, 3],
        (n) => n > 10,
      );

    assert.deepEqual(result, []);
  });

  it('works with an empty array', () => {
    const result =
      linearSearch<number>(
        [],
        () => true,
      );

    assert.deepEqual(result, []);
  });

  it('works with objects', () => {
    const products = [
      { id: 1, category: 'Books' },
      { id: 2, category: 'Sports' },
      { id: 3, category: 'Books' },
    ];

    const result =
      linearSearch(
        products,
        (p) => p.category === 'Books',
      );

    assert.deepEqual(result, [
      { id: 1, category: 'Books' },
      { id: 3, category: 'Books' },
    ]);
  });
});

describe('binarySearch', () => {
  const compare =
    (a: number, b: number) => a - b;

  it('finds an item in the middle', () => {
    assert.equal(
      binarySearch(
        [1, 2, 3, 4, 5],
        3,
        compare,
      ),
      2,
    );
  });

  it('finds the first item', () => {
    assert.equal(
      binarySearch(
        [1, 2, 3, 4, 5],
        1,
        compare,
      ),
      0,
    );
  });

  it('finds the last item', () => {
    assert.equal(
      binarySearch(
        [1, 2, 3, 4, 5],
        5,
        compare,
      ),
      4,
    );
  });

  it('returns -1 when the item is missing', () => {
    assert.equal(
      binarySearch(
        [1, 2, 3, 4, 5],
        42,
        compare,
      ),
      -1,
    );
  });

  it('works with an empty array', () => {
    assert.equal(
      binarySearch(
        [],
        42,
        compare,
      ),
      -1,
    );
  });
});
