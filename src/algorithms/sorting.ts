/**
 * Sorting algorithms (Session 5).
 *
 * Every function is pure: it returns a new sorted array and never mutates
 * its input. Order is decided by `compare(a, b)`: negative means `a` comes
 * first, positive means `b` comes first, 0 means they are equal.
 */
import type { Comparator } from '../types';

/** Insertion sort. */
export function insertionSort<T>(items: readonly T[], compare: Comparator<T>): T[] {
  const newArr = [...items];
  if(newArr.length<=1) return newArr;
  let temp;
  let i= 1;
  while(i<newArr.length){
    let x=i;
    while(x>0){
        temp=newArr[x];
        if(compare(newArr[x-1],temp) >0) {
          newArr[x] = newArr[x-1];
          newArr[x-1]=temp
        }else{
          break;
        }
        x--;
      }
      i++;
  }
  
  return newArr
  
  
}

/** Quick sort (recursive). */
export function quickSort<T>(items: readonly T[], compare: Comparator<T>): T[] {
  if (items.length <= 1) return [...items];

  const pivot = items[Math.floor(items.length / 2)];


  const smaller: T[] = [];
  const equal: T[] = [];
  const bigger: T[] = [];

  for (const element of items) {
    const c = compare(element, pivot);
    if (c < 0) smaller.push(element);
    else if (c > 0) bigger.push(element);
    else equal.push(element);
  }

  // `equal` is already sorted; only the two other piles need a recursive call.
  return [...quickSort(smaller, compare), ...equal, ...quickSort(bigger, compare)];
}

/** Merge sort (recursive). */
export function mergeSort<T>(items: readonly T[], compare: Comparator<T>): T[] {

  const merge = (left:T[],right:T[]) => {
    let i=0;
    let j=0;
    const result = [];

    while (i < left.length && j < right.length){
      if(compare(left[i],right[j])<=0){
        result.push(left[i])
        i++;
      }else{
        result.push(right[j])
        j++;
      }
    }

    return  [...result,...left.slice(i),...right.slice(j)]
  };
  const arr = [...items]
  
  if(arr.length<=1) return arr;
   
  

  return merge(mergeSort(arr.slice(0,arr.length/2),compare),mergeSort(arr.slice(arr.length/2),compare))
  

}
