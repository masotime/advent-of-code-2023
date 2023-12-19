import { Coordinate } from '../utils/types';
import input from './input';

type Direction = 'U' | 'D' | 'L' | 'R'
type Instruction = {
    direction: Direction
    distance: number
    colorCode: string
}

const REGEX = /^(?<direction>[UDLR]) (?<distance>[0-9]+) \(#(?<colorCode>.*)\)$/

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

const render = (g: Grid): string => {
    let output = ''

    for (let row = 0; row < g.rows; row += 1) {
        for (let col = 0; col < g.cols; col += 1) {
            output += g.trench[row]?.[col]?.item ?? '.'
        }
        output += '\n'
    }

    return output
}

const move = ({ row, col }: Coordinate, direction: Direction): Coordinate => {
    let nextRow = row, nextCol = col
    switch (direction) {
        case 'U':
            nextRow = row - 1; break;
        case 'D':
            nextRow = row + 1; break;
        case 'L':
            nextCol = col - 1; break;
        case 'R':
            nextCol = col + 1; break;
        default:
            throw new Error('wtfmove')
    }

    return { row: nextRow, col: nextCol }
}

export default () => {
    const instructions: Instruction[] = []
    for (const line of input.split('\n')) {
        const { groups } = REGEX.exec(line) ?? {}

        if (!groups?.direction || !groups.distance || !groups.colorCode) {
            throw new Error(`Failed to parse ${line}`)
        }

        const { direction, distance, colorCode } = groups

        instructions.push({
            direction: direction as Direction,
            distance: parseInt(distance, 10),
            colorCode
        })
    }

    // console.log(instructions)

    const grid: Grid = {
        rows: 1,
        cols: 1,
        trench: { 0: { 0: { item: '#', color: '?' } } }
    }

    // dig the trench
    let minRow = Number.MAX_SAFE_INTEGER
    let minCol = Number.MAX_SAFE_INTEGER
    let maxRow = Number.MIN_SAFE_INTEGER
    let maxCol = Number.MIN_SAFE_INTEGER
    let digger: Coordinate = { row: 0, col: 0 }
    for (const instruction of instructions) {
        for (let count = 0; count < instruction.distance; count += 1) {
            digger = move(digger, instruction.direction)
            console.log(`[${digger.row}, ${digger.col}]`)
            grid.trench[digger.row] = grid.trench[digger.row] || []
            grid.trench[digger.row][digger.col] = {
                item: '#',
                color: instruction.colorCode
            }
            minRow = Math.min(minRow, digger.row)
            minCol = Math.min(minCol, digger.col)
            maxRow = Math.max(maxRow, digger.row)
            maxCol = Math.max(maxCol, digger.col)
        }
    }

    console.log(minRow, minCol, maxRow, maxCol)

    // resolve the trench dimensions since it can be negative
    const fixedGrid: Grid = {
        rows: maxRow - minRow + 1,
        cols: maxCol - minCol + 1,
        trench: {}
    }

    for (const row in grid.trench) {
        const column = grid.trench[row]
        for (const col in column) {
            const newRow = parseInt(row) - minRow
            const newCol = parseInt(col) - minCol
            console.log(`🔥 [${newRow}, ${newCol}]`)
            fixedGrid.trench[newRow] = fixedGrid.trench[newRow] || []
            fixedGrid.trench[newRow][newCol] = grid.trench[row][col]
        }
    }

    const outline = render(fixedGrid)
    console.log(outline)

    // fill the trench - cheat a little
    const knownInside: Coordinate = { row: 1, col: 230 }

    type Candidate = Coordinate[]
    let candidates = [knownInside]
    let maxIterations = 0
    while (candidates.length > 0) {
        const candidate = candidates.shift()!
        fixedGrid.trench[candidate.row][candidate.col] = {
            item: '#',
            color: '?'
        }

        const up = move(candidate, 'U')
        const down = move(candidate, 'D')
        const left = move(candidate, 'L')
        const right = move(candidate, 'R')

        if (fixedGrid.trench[up.row][up.col]?.item !== '#') {
            candidates.push(up)
        }
        if (fixedGrid.trench[down.row][down.col]?.item !== '#') {
            candidates.push(down)
        }
        if (fixedGrid.trench[left.row][left.col]?.item !== '#') {
            candidates.push(left)
        }
        if (fixedGrid.trench[right.row][right.col]?.item !== '#') {
            candidates.push(right)
        }

        candidates = candidates.filter(c => fixedGrid.trench[c.row][c.col]?.item !== '#')

        maxIterations += 1
    }

    console.log(render(fixedGrid))

    let total = 0
    for (let row = 0; row < fixedGrid.rows; row += 1) {
        for (let col = 0; col < fixedGrid.cols; col += 1) {
            if (fixedGrid.trench[row][col]?.item === '#') {
                total += 1
            }
        }
    }



    return total
}
