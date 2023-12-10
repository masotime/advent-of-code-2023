import { Coordinate } from './types'

export function sum(args: number[]): number {
  return args.reduce((acc, num) => acc + num, 0)
}

export function product(args: number[]): number {
  return args.reduce((acc, num) => acc * num, 1)
}

export function getAdjacent(coordinate: Coordinate): Coordinate[] {
  const { row, col } = coordinate
  return [
    { row: row - 1, col: col - 1 },
    { row: row - 1, col: col },
    { row: row - 1, col: col + 1 },
    { row: row, col: col - 1 },
    { row: row, col: col + 1 },
    { row: row + 1, col: col - 1 },
    { row: row + 1, col: col },
    { row: row + 1, col: col + 1 },
  ]
}

export function getVerticalAdjacents(coordinate: Coordinate): Coordinate[] {
  const { row, col } = coordinate
  return [
    { row: row - 1, col: col },
    { row: row, col: col - 1 },
    { row: row, col: col + 1 },
    { row: row + 1, col: col },
  ]
}

export function intersects(item1: Coordinate[], item2: Coordinate[]) {
  return item1.some((point) =>
    item2.some(({ row, col }) => row === point.row && col === point.col)
  )
}

export function gcd(a: number, b: number) {
  // Base case: if b is 0, gcd is a
  if (b === 0) {
    return a;
  }
  // Recursive call
  return gcd(b, a % b);
}

export function lcm(a: number, b: number) {
  return (a * b) / gcd(a, b);
}

export function lcmArray(arr: number[]) {
  // Initially set result to first element
  let result = arr[0];

  // Loop through the array, updating result to LCM of result and current element
  for (let i = 1; i < arr.length; i++) {
    result = lcm(result, arr[i]);
  }

  return result;
}
