import ansiColors from 'ansi-colors';
import { getVerticalAdjacents } from '../utils';
import { Coordinate } from '../utils/types';
import input from './input';

type Slope = '>' | '<' | 'v'
type Item = Slope | '#' | '.'
type Grid<T> = {
    [row in number]: {
        [col in number]: T
    }
}

type Island = {
    rows: number,
    cols: number,
    start: Coordinate,
    end: Coordinate,
    grid: Grid<Item>
}

type Candidate = {
    steps: Coordinate[]
}

function renderIsland(island: Island, path?: Candidate): string {
    let output = ''
    for (let row = 0; row < island.rows; row += 1) {
        for (let col = 0; col < island.cols; col += 1) {
            if (island.start.row === row && island.start.col === col) {
                output += 'S'
            } else if (path && path.steps.some(coord => coord.row === row && coord.col === col)) {
                output += ansiColors.whiteBright('O')
            } else {
                output += island.grid[row][col]
            }

        }
        output += '\n'
    }

    return output;
}

const validCoordLookup: Grid<boolean> = {}

function isValidCoordinate({ row, col }: Coordinate, island: Island) {
    if (validCoordLookup[row]?.[col] === undefined) {
        validCoordLookup[row] = validCoordLookup[row] || []
        validCoordLookup[row][col] = true

        if (row < 0 || row >= island.rows || col < 0 || col >= island.cols) {
            validCoordLookup[row][col] = false
        } else if (island.grid[row][col] === '#') {
            validCoordLookup[row][col] = false // otherwise . > < v are all valid
        }
    }

    return validCoordLookup[row][col]
}

const checkAdjacentsLookup: Grid<number> = {}

function checkAdjacents({ row, col }: Coordinate, island: Island) {
    if (checkAdjacentsLookup[row]?.[col] === undefined) {
        checkAdjacentsLookup[row] = checkAdjacentsLookup[row] || []
        checkAdjacentsLookup[row][col] = 0

        for (const direction of ['<', '>', 'v', '^'] as const) {
            const movedPosition = MOVER[direction]({ row, col })
            if (isValidCoordinate(movedPosition, island)) {
                checkAdjacentsLookup[row][col] += 1
            }
        }
    }

    return checkAdjacentsLookup[row][col]
}

let lastRenderIndex = 0
let DEBUG_OBSERVATIONS = 1000

type Direction = '<' | '>' | '^' | 'v'

const MOVER: {
    [d in Direction]: (coord: Coordinate) => Coordinate } = {
    '<': (coord) => ({ row: coord.row, col: coord.col - 1 }),
    '>': (coord) => ({ row: coord.row, col: coord.col + 1 }),
    '^': (coord) => ({ row: coord.row - 1, col: coord.col }),
    'v': (coord) => ({ row: coord.row + 1, col: coord.col }),
}

function moveInOneDirection(island: Island, direction: Direction, coordinate: Coordinate): Coordinate[] {
    let result: Coordinate[] = []
    let lastCoordinate: Coordinate = coordinate
    do {
        lastCoordinate = MOVER[direction](lastCoordinate)
        result.push(lastCoordinate)
    } while (isValidCoordinate(lastCoordinate, island) && checkAdjacents(lastCoordinate, island) === 2)

    // the last move is always invalid, so prune it
    if (!isValidCoordinate(lastCoordinate, island)) {
        result = result.slice(0, -1)
    }


    return result
}

function solve(island: Island, debug: boolean = false): Candidate[] {
    const candidates: Candidate[] = [
        { steps: [{ row: island.start.row, col: island.start.col }] }
    ]

    const paths: Candidate[] = []
    let lastCandidatesLength = -1
    let cycles = 0

    while (candidates.length > 0) {
        const candidate = candidates.shift()!
        const currStep = candidate.steps[candidate.steps.length - 1]
        const { row, col } = currStep

        // console.log(`Considering candidate`, candidate)

        // if we're at the end, stop generating new caniddates
        if (row === island.end.row && col === island.end.col) {
            paths.push(candidate)
            continue
        }

        let nextPath: Coordinate[][] = []
        const itemAtCurrent = island.grid[row][col]
        // console.log({ itemAtCurrent })

        for (const direction of ['<', '>', 'v', '^'] as const) {
            const movement = moveInOneDirection(island, direction, currStep)
            if (movement.length > 0) {
                nextPath.push(movement)
            }
        }

        // unlike typical BFS, we don't track visited. We just never backtrack
        nextPath = nextPath.filter((nextPath) => !candidate.steps.some(step => nextPath.some(({ row, col }) => step.row === row && step.col === col)))

        // now we do the standard step of generating new candidates
        for (const path of nextPath) {
            const nextCandidate = {
                steps: candidate.steps.concat(path)
            }
            // console.log(`New candidate`, nextCandidate)
            candidates.push(nextCandidate)
        }

        if (debug) {
            cycles += 1
            console.log('------------------CYCLE: ', cycles, '---------------------------')
            // console.log('CANDIDATES LENGTH = ', lastCandidatesLength)

            for (const candidate of candidates) {
                console.log(renderIsland(island, candidate))
            }

            if (cycles > DEBUG_OBSERVATIONS) {
                break;
            }
        }

        // }


        if (candidates.length > 0 && candidates.length % 1000 === 0 && lastRenderIndex !== candidates.length) {
            console.log(`Candidate count: ${candidates.length}`)
            console.log(`Path length being considered ${candidates[0].steps.length - 1}`)
            console.log(renderIsland(island, candidates[0]))
            lastRenderIndex = candidates.length
            // console.log(`Paths found: ${paths.length}`)
            // const candidateLengths = candidates.map(_ => _.steps.length).sort()
            // console.log(candidateLengths)
            // for (const candidate of candidates) {
            //     // console.log(renderIsland(island, candidate))
            //     console.log(candidate.steps.length - 1)
            // }

            // break;
        }
    }

    return paths;
}

export default () => {
    const lines = input.split('\n')
    const island: Island = {
        rows: lines.length,
        cols: lines[0].length,
        start: { row: -1, col: -1 },
        end: { row: -1, col: -1 },
        grid: {}
    }

    for (let row = 0; row < island.rows; row += 1) {
        const rowStr = lines[row]
        let lastCol = -1
        for (let col = 0; col < island.cols; col += 1) {
            const item = rowStr[col]
            if (item === '.') {
                if (island.start.row === -1) {
                    island.start = { row, col }
                }
                lastCol = col
            }
            island.grid[row] = island.grid[row] || []
            island.grid[row][col] = item as Item
        }

        if (row === island.rows - 1) {
            island.end = {
                row: island.rows - 1,
                col: lastCol
            }
        }
    }

    console.log(renderIsland(island))
    console.log(island.rows, island.cols)
    const paths = solve(island)

    let longest = Number.MIN_SAFE_INTEGER

    for (let p = 0; p < paths.length; p += 1) {
        console.log(`Path ${p}:`)
        // console.log(renderIsland(island, paths[p]))
        const pathLength = paths[p].steps.length - 1
        console.log(`Length: ${pathLength}`)
        longest = Math.max(longest, pathLength)
    }

    return longest
}
