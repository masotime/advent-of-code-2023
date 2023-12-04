import { getAdjacent, intersects } from '../utils';
import input from './input';
import { parse } from './parser';

import type { Object, Symbol, Number } from './parser'

export default () => {
    const objects: Object[] = parse(input)

    // now run through each symbol and see which ones have a number adjacent to it.
    const gearSymbols: Symbol[] = objects.filter(obj => obj.type === 'symbol' && obj.char === '*') as Symbol[]
    const numberCandidates: Set<Number> = new Set<Number>(objects.filter(obj => obj.type === 'number') as Number[])
    const gearPairs: Set<[Number, Number]> = new Set<[Number, Number]>()

    for (const gear of gearSymbols) {
        // get all the "adjacent" coordinates
        const adjacents = getAdjacent(gear.coordinate)
        const matches: Number[] = []
        for (const number of numberCandidates) {
            if (intersects(adjacents, number.coordinates)) {
                matches.push(number)
            }
        }

        // if a gear pair is found, then add it to the gearPairs
        if (matches.length === 2) {
            gearPairs.add([matches[0], matches[1]])
        }
    }

    let answer = 0;

    for (const [gear1, gear2] of gearPairs) {
        console.log(`(${gear1.coordinates[0].row}, ${gear1.coordinates[0].col}) ${gear1.value}`)
        console.log(`(${gear2.coordinates[0].row}, ${gear2.coordinates[0].col}) ${gear2.value}`)
        console.log(`------`)
        answer += gear1.value * gear2.value        
    }

    return answer
}
