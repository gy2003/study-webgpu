import {random} from './random';

function swap(arr: unknown[], i: number, j: number) {
  const temp = arr[i];
  arr[i] = arr[j];
  arr[j] = temp;
}

function partition<T>(arr: T[], p: number, r: number, compareValue = (value: T) => value) {
  const x = compareValue(arr[r]);
  let i = p - 1;

  for (let j = p; j < r; j++) {
    if (compareValue(arr[j]) <= x) {
      i = i + 1;
      swap(arr, i, j);
    }
  }
  swap(arr, i + 1, r);

  return i + 1;
}

export function randomizedPartition<T>(
  arr: T[],
  p: number,
  r: number,
  compareValue = (value: T) => value
) {
  const i = random(p, r) | 0;
  swap(arr, i, r);
  return partition<T>(arr, p, r, compareValue);
}
