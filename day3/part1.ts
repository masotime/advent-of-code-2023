import { sum } from '../utils';
import input from './input';
import { parse } from './parser';

import type { Object, Symbol, Number } from './parser'

export default () => {
    const objects: Object[] = parse(input)

    // now run through each symbol and see which ones have a number adjacent to it.
    const symbols: Symbol[] = objects.filter(obj => obj.type === 'symbol') as Symbol[]
    const numberCandidates: Set<Number> = new Set<Number>(objects.filter(obj => obj.type === 'number') as Number[])
    const parts: Set<Number> = new Set<Number>()

    // super inefficient but want to finish this first, can optimize later.
    for (const symbol of symbols) {
        // get all the "adjacent" coordinates
        const { row, col } = symbol.coordinate
        const adjacents = [
            { row: row -1, col: col - 1 },
            { row: row -1, col: col },
            { row: row -1, col: col + 1},
            { row: row, col: col - 1 },
            { row: row, col: col + 1},
            { row: row + 1, col: col - 1 },
            { row: row + 1, col: col },
            { row: row + 1 , col: col + 1},
        ]

        const matches: Number[] = []
        for (const number of numberCandidates) {
            if (adjacents.some(coord => number.coordinates.some(({ row, col }) => row === coord.row && col === coord.col))) {
                matches.push(number)
            }
        }

        for (const match of matches) {
            parts.add(match)
            numberCandidates.delete(match)
        }
    }

    let answer = 0;

    for (const part of parts) {
        console.log(`(${part.coordinates[0].row}, ${part.coordinates[0].col}) ${part.value}`)
        answer += part.value
    }

    return answer
}
