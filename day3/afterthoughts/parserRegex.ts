import { Coordinate } from '../../utils/types'

export type Symbol = {
  type: 'symbol'
  char: string
  coordinate: Coordinate
}

export type Number = {
  type: 'number'
  value: number
  coordinates: Coordinate[]
}

export type Object = Number | Symbol

const NUMBER_OR_SYMBOL_REGEX = /(\d+|[^\d\.])/g
const NUMBER_REGEX = /\d+/

export function parse(input: string): Object[] {
  // scan the input and add objects accordingly.
  const objects: Object[] = []

  const lines = input.split('\n')
  for (let row = 0; row < lines.length; row += 1) {
    const line = lines[row]
    const re = new RegExp(NUMBER_OR_SYMBOL_REGEX)
    let matchResult
    while ((matchResult = re.exec(line))) {
      // match[0] will be the string, match.index will be the col
      const match = matchResult[0]
      const col = matchResult.index

      objects.push(NUMBER_REGEX.test(match)
        ? {
            type: 'number',
            value: parseInt(match, 10),
            coordinates: new Array(match.length).fill('').map((_, idx) => ({
              row,
              col: idx + col,
            })),
          } : {
            type: 'symbol',
            char: match,
            coordinate: { row, col },
          }
      )
    }
  }

  return objects
}
