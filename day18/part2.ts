import { Coordinate } from '../utils/types';
import input from './sample';

type Direction = 'U' | 'D' | 'L' | 'R'
type Instruction = {
    direction: Direction
    distance: number
}

const REGEX = /^(?<direction>[UDLR]) (?<distance>[0-9]+) \(#(?<realDistance>[0-9a-f]{5})(?<directionCode>[0-3])\)$/

type Grid = {
    rows: number,
    cols: number,
    trench: {
        [row in number]: {
            [col in number]: {
                item: string,
                color: string
            }
        }
    }
}

const directionMap: {
    [code in string]: Direction
} = {
    '0': 'R',
    '1': 'D',
    '2': 'L',
    '3': 'U'
}

export default () => {
    const instructions: Instruction[] = []
    for (const line of input.split('\n')) {
        const { groups } = REGEX.exec(line) ?? {}

        if (!groups?.realDistance || !groups.directionCode) {
            throw new Error(`Failed to parse ${line}`)
        }

        const { realDistance, directionCode } = groups

        instructions.push({
            direction: directionMap[directionCode],
            distance: parseInt(realDistance, 16),
        })
    }

    console.log(instructions)

    return 'TBD'
}
