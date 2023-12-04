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

export function intersects(item1: Coordinate[], item2: Coordinate[]) {
  return item1.some((point) =>
    item2.some(({ row, col }) => row === point.row && col === point.col)
  )
}
