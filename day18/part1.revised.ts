import { Coordinate } from '../utils/types';
import input from './input';
import ansiColors from 'ansi-colors';

type Direction = 'U' | 'D' | 'L' | 'R'
type Instruction = {
    direction: Direction
    distance: number
}

const REGEX = /^(?<direction>[UDLR]) (?<distance>[0-9]+) \(#(?<colorCode>.*)\)$/

type Grid = {
    rows: number,
    cols: number,
    trench: {
        [row in number]: {
            [col in number]: string
        }
    }
}

const render = (g: Grid): string => {
    let output = ''

    for (let row = 0; row < g.rows; row += 1) {
        for (let col = 0; col < g.cols; col += 1) {
            output += g.trench[row]?.[col] ?? '.'
        }
        output += '\n'
    }

    return output
}

type Horizontal = {
    type: 'H'
    row: number
    colStart: number
    colEnd: number
}

type Vertical = {
    type: 'V'
    col: number,
    rowStart: number,
    rowEnd: number
}

const move = ({ row, col }: Coordinate, direction: Direction, qty: number = 1): Coordinate => {
    let nextRow = row, nextCol = col
    switch (direction) {
        case 'U':
            nextRow = row - qty; break;
        case 'D':
            nextRow = row + qty; break;
        case 'L':
            nextCol = col - qty; break;
        case 'R':
            nextCol = col + qty; break;
        default:
            throw new Error('wtfmove')
    }

    return { row: nextRow, col: nextCol }
}

type DigResult = {
    grid: Grid,
    horizontals: Horizontal[],
    verticals: Vertical[],
    perimeter: number
}


function dig(instructions: Instruction[], grid: Grid, populateGrid: boolean = true): DigResult {
    // dig the trench
    let minRow = Number.MAX_SAFE_INTEGER
    let minCol = Number.MAX_SAFE_INTEGER
    let maxRow = Number.MIN_SAFE_INTEGER
    let maxCol = Number.MIN_SAFE_INTEGER

    let digger: Coordinate = { row: 0, col: 0 }
    const digResult: DigResult = {
        horizontals: [],
        verticals: [],
        perimeter: 0,
        grid
    }

    let perimeter = 0
    for (const instruction of instructions) {
        const { direction } = instruction
        let result: Horizontal | Vertical
        if (direction === 'L' || direction === 'R') {
            const horizontal: Horizontal = {
                type: 'H',
                row: digger.row,
                colStart: direction === 'L' ? -1 : digger.col,
                colEnd: direction === 'L' ? digger.col : -1 // TBD
            }
            digger = move(digger, instruction.direction, instruction.distance)
            horizontal[direction === 'L' ? 'colStart' : 'colEnd'] = digger.col
            digResult.horizontals.push(horizontal)
            console.log(`${direction} (${horizontal.row},${horizontal.colStart}) => (${horizontal.row},${horizontal.colEnd})`)
            result = horizontal
        } else {
            const vertical: Vertical = {
                type: 'V',
                col: digger.col,
                rowStart: direction === 'U' ? -1 : digger.row,
                rowEnd: direction === 'U' ? digger.row : -1
            }
            digger = move(digger, instruction.direction, instruction.distance)
            vertical[direction === 'U' ? 'rowStart' : 'rowEnd'] = digger.row
            digResult.verticals.push(vertical)
            console.log(`${direction} (${vertical.rowStart},${vertical.col}) => (${vertical.rowEnd},${vertical.col})`)
            result = vertical
        }

        if (populateGrid) {
            if (result.type === 'H') {
                for (let col = result.colStart; col <= result.colEnd; col += 1) {
                    grid.trench[result.row] = grid.trench[result.row] || []
                    grid.trench[result.row][col] = '#'
                }
            } else {
                for (let row = result.rowStart; row <= result.rowEnd; row += 1) {
                    grid.trench[row] = grid.trench[row] || []
                    grid.trench[row][result.col] = '#'
                }
            }
        }

        minRow = Math.min(minRow, digger.row)
        minCol = Math.min(minCol, digger.col)
        maxRow = Math.max(maxRow, digger.row)
        maxCol = Math.max(maxCol, digger.col)

        digResult.perimeter += instruction.distance
        console.log(`[${digger.row}, ${digger.col}], ${perimeter}`)
    }

    console.log(minRow, minCol, maxRow, maxCol, perimeter)

    // this isn't really needed, but it's easier to render with non-negative coordinates
    // adjust the vertices so that it starts from row 0, col 0
    for (const horizontal of digResult.horizontals) {
        horizontal.row = horizontal.row - minRow
        horizontal.colStart = horizontal.colStart - minCol
        horizontal.colEnd = horizontal.colEnd - minCol
    }

    for (const vertical of digResult.verticals) {
        vertical.col = vertical.col - minCol
        vertical.rowStart = vertical.rowStart - minRow
        vertical.rowEnd = vertical.rowEnd - minRow
    }

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
            // console.log(`🔥 [${newRow}, ${newCol}]`)
            fixedGrid.trench[newRow] = fixedGrid.trench[newRow] || []
            fixedGrid.trench[newRow][newCol] = grid.trench[row][col]
        }
    }

    digResult.grid = fixedGrid

    return digResult
}

type RowInterval = [number, number]
function removeRow(rowIntervals: RowInterval[], start: number, end: number): { removedIntervals: RowInterval[], newIntervals: RowInterval[] } {
    const newIntervals: RowInterval[] = []
    const removedIntervals: RowInterval[] = []
    for (const interval of rowIntervals) {
        if (start <= interval[0] && end >= interval[1]) {
            // completely encompasses interval, just skip
            removedIntervals.push([interval[0], interval[1]])
            continue
        } else if (start <= interval[0] && end >= interval[0] && end < interval[1]) {
            // part to remove covers the top, so snip the upper part
            removedIntervals.push([interval[0], end])
            newIntervals.push([end + 1, interval[1]])
        } else if (start > interval[0] && end < interval[1]) {
            // part to remove is wholly inside, split into 2            
            newIntervals.push([interval[0], start - 1])
            removedIntervals.push([start, end])
            newIntervals.push([end + 1, interval[1]])
        } else if (start > interval[0] && start <= interval[1] && end >= interval[1]) {
            // part to remove covers the bottom, snip lower part
            newIntervals.push([interval[0], start - 1])
            removedIntervals.push([start, interval[1]])
        } else {
            // no intersection, just ignore
            newIntervals.push(interval)
        }
    }

    return { newIntervals, removedIntervals }
}

function intervalSize(rowIntervals: RowInterval[]): number {
    let rows = 0
    for (const interval of rowIntervals) {
        rows += interval[1] - interval[0] + 1
    }
    return rows
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
        })
    }

    // console.log(instructions)

    const grid: Grid = {
        rows: 1,
        cols: 1,
        trench: { 0: { 0: '#' } }
    }

    const digResult = dig(instructions, grid)
    console.log(digResult.horizontals.map(horizontal => `(${horizontal.row},${horizontal.colStart}) => (${horizontal.row},${horizontal.colEnd})`).join('|'))
    console.log(digResult.verticals.map(vertical => `(${vertical.rowStart},${vertical.col}) => (${vertical.rowEnd},${vertical.col})`).join('|'))

    console.log(render(digResult.grid))

    // generate vertical candidates
    type Candidate = {
        rowStart: number,
        rowEnd: number,
        col: number,
        isTerminal: boolean,
        rowIntervals: RowInterval[]
    }

    const candidates: Candidate[] = []

    for (const vertical of digResult.verticals) {
        candidates.push({
            ...vertical,
            isTerminal: false,
            rowIntervals: [
                [vertical.rowStart, vertical.rowEnd]
            ]
        })
    }

    candidates.sort((a, b) => {
        if (a.col === b.col) {
            return a.rowStart - b.rowStart
        }

        return b.col - a.col
    })

    const renderCandidate = (v: Candidate) => `(${v.rowStart},${v.col}) => (${v.rowEnd},${v.col})`

    // console.log(candidates)
    let totalAreaCovered = 0
    for (let c = 0; c < candidates.length; c += 1) {
        const candidate = candidates[c]
        console.log(`Considering vertical candidate ${renderCandidate(candidate)}`)
        if (candidate.isTerminal) {
            console.log(`Skipped because it is a terminal candidate`)
            continue
        }

        // iterate through all remaining candidates to see if there's an intersection in the
        // rows covered by the vertical
        for (let v = c + 1; v < candidates.length; v += 1) {
            const other = candidates[v]
            const rowStartInCandidate = other.rowStart >= candidate.rowStart && other.rowStart <= candidate.rowEnd
            const rowEndInCandidate = other.rowEnd >= candidate.rowStart && other.rowEnd <= candidate.rowEnd
            const candidateInOther = other.rowStart <= candidate.rowStart && other.rowEnd >= candidate.rowEnd
            const hasIntersection = rowStartInCandidate || rowEndInCandidate || candidateInOther
            console.log(`==> Comparing against "other" ${renderCandidate(other)}`)

            if (!hasIntersection) {
                console.log(`==> SKIP - no intersection`)
                continue
            }

            // resolve perimeter lines first
            const possiblePerimeters: Horizontal[] = []
            const common: Horizontal = { type: 'H', colStart: other.col, colEnd: candidate.col, row: -1 }
            if (other.rowStart === candidate.rowStart || other.rowStart === candidate.rowEnd) {
                possiblePerimeters.push({ ...common, row: other.rowStart })
            }
            if (other.rowEnd === candidate.rowStart || other.rowEnd === candidate.rowEnd) {
                possiblePerimeters.push({ ...common, row: other.rowEnd })
            }

            let perimeterWasRemoved = false
            for (const poss of possiblePerimeters) {
                if (digResult.horizontals.some((h) => poss.row === h.row && poss.colStart === h.colStart && poss.colEnd === h.colEnd)) {
                    const { newIntervals } = removeRow(candidate.rowIntervals, poss.row, poss.row)
                    candidate.rowIntervals = newIntervals
                    console.log(`==> Perimeter detected and removed row ${poss.row}`)
                    perimeterWasRemoved = true
                }
            }

            if (perimeterWasRemoved) {
                console.log(`==> After perimeter removal, candidate's row intervals are now ${candidate.rowIntervals}`)
            }

            // now search for intersections between the intervals and the other
            const { removedIntervals, newIntervals } = removeRow(candidate.rowIntervals, other.rowStart, other.rowEnd)
            const rowsRemoved = intervalSize(removedIntervals)

            for (const interval of removedIntervals) {
                const [rowStart, rowEnd] = interval
                for (let row = rowStart; row <= rowEnd; row += 1) {
                    for (let col = other.col + 1; col < candidate.col; col += 1) {
                        if (digResult.grid.trench[row][col] !== undefined) {
                            // throw new Error(`something is wrong ${row}, ${col}`)
                        }
                        digResult.grid.trench[row][col] = ansiColors.whiteBright.bold('#')
                    }
                }
            }

            const areaCovered = (candidate.col - other.col - 1) * rowsRemoved
            if (areaCovered > 0) {
                console.log(`==> 🔥 Area detected, marking other as terminal since it adds to area of ${areaCovered}`)
                other.isTerminal = true
            }
            candidate.rowIntervals = newIntervals
            totalAreaCovered += areaCovered

            console.log(`==> After area removal, candidate's row intervals are now ${candidate.rowIntervals}`)
            if (candidate.rowIntervals.length === 0) {
                console.log(`==> Candidate is empty, no point continuing`)
                break
            }
        }

        console.log(render(digResult.grid))
    }

    return digResult.perimeter + totalAreaCovered
}
