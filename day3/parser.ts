import { Coordinate } from '../utils/types'

const NUMBER_REGEX = /[0-9]/

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

export function parse(input: string): Object[] {
  // scan the input and add objects accordingly.
  const objects: Object[] = []

  const lines = input.split('\n')
  for (let row = 0; row < lines.length; row += 1) {
    const line = lines[row]
    const chars = line.split('')
    let isReadingNumber = false
    let number = 0
    let numberCoordinates: Coordinate[] = []
    for (let col = 0; col < chars.length; col += 1) {
      const letter = chars[col]

      // deal with any number termination first
      if (isReadingNumber && !NUMBER_REGEX.test(letter)) {
        isReadingNumber = false
        objects.push({
          type: 'number',
          value: number,
          coordinates: numberCoordinates,
        })
      }

      // now deal with the letter itself
      if (!NUMBER_REGEX.test(letter) && letter !== '.') {
        objects.push({
          type: 'symbol',
          char: letter,
          coordinate: { row, col },
        })
      } else if (NUMBER_REGEX.test(letter)) {
        // either start of a new number or continuing to append to a number
        const digit = parseInt(letter, 10)
        if (!isReadingNumber) {
          // start of a new number, initialize everything
          isReadingNumber = true
          number = digit
          numberCoordinates = [{ row, col }]
        } else {
          // accumulate
          number = number * 10 + digit
          numberCoordinates.push({ row, col })
        }
      }
    }

    // at the end of the loop, it could still have been reading a number
    if (isReadingNumber) {
      objects.push({
        type: 'number',
        value: number,
        coordinates: numberCoordinates,
      })
      console.log(
        `🚨 Found an "EDGE" number ${number} at ${numberCoordinates[0].row}, ${numberCoordinates[0].col}`
      )
    }
  }

  return objects
}
