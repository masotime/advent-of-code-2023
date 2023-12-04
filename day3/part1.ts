import { getAdjacent, intersects } from '../utils';
import input from './input';
import { parse } from './parser';

import type { Object, Symbol, Number } from './parser'

export default () => {
    const objects: Object[] = parse(input)

    // now run through each symbol and see which ones have a number adjacent to it.
    const symbols: Symbol[] = objects.filter(obj => obj.type === 'symbol') as Symbol[]
    const numberCandidates: Set<Number> = new Set<Number>(objects.filter(obj => obj.type === 'number') as Number[])
    const parts: Set<Number> = new Set<Number>()

    for (const symbol of symbols) {
        // get all the "adjacent" coordinates
        const adjacents = getAdjacent(symbol.coordinate)
        const matches: Number[] = []
        for (const number of numberCandidates) {
            if (intersects(adjacents, number.coordinates)) {
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
