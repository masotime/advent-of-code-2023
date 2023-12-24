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


function isValidCoordinate({ row, col }: Coordinate, island: Island) {
    if (row < 0 || row >= island.rows || col < 0 || col >= island.cols) {
        return false
    }

    if (island.grid[row][col] === '#') {
        return false // otherwise . > < v are all valid
    }

    return true
}

function solve(island: Island): Candidate[] {
    const candidates: Candidate[] = [
        { steps: [{ row: island.start.row, col: island.start.col }] }
    ]

    const paths: Candidate[] = []

    while (candidates.length > 0) {
        const candidate = candidates.shift()!
        const lastStep = candidate.steps[candidate.steps.length - 1]
        const { row, col } = lastStep

        // console.log(`Considering candidate`, candidate)

        // if we're at the end, stop generating new caniddates
        if (row === island.end.row && col === island.end.col) {
            paths.push(candidate)
            continue
        }

        let nextCoordinates: Coordinate[] = []
        const itemAtCurrent = island.grid[row][col]
        // console.log({ itemAtCurrent })

        switch (itemAtCurrent) {
            case '#':
                throw new Error(`wtf`)

            // there's only one way to go for each of the below
            case '<':
                nextCoordinates.push({ row, col: col - 1 })
                break;

            case '>':
                nextCoordinates.push({ row, col: col + 1 })
                break;

            case 'v':
                nextCoordinates.push({ row: row + 1, col })
                break;

            case '.':
                const newDirections = getVerticalAdjacents(lastStep)
                    .filter(coord => isValidCoordinate(coord, island))
                nextCoordinates.push(...newDirections)
                break;

            default:
                itemAtCurrent satisfies never
        }

        // console.log({ nextCoordinates })

        // unlike typical BFS, we don't track visited. We just never backtrack
        nextCoordinates = nextCoordinates.filter(({ row, col }) => !candidate.steps.find(step => step.row === row && step.col === col))

        // now we do the standard step of generating new candidates
        for (const coordinate of nextCoordinates) {
            const nextCandidate = {
                steps: [...candidate.steps, coordinate]
            }
            // console.log(`New candidate`, nextCandidate)
            candidates.push(nextCandidate)
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
    const paths = solve(island)

    let longest = Number.MIN_SAFE_INTEGER

    for (let p = 0; p < paths.length; p += 1) {
        console.log(`Path ${p}:`)
        console.log(renderIsland(island, paths[p]))
        const pathLength = paths[p].steps.length - 1
        console.log(`Length: ${pathLength}`)
        longest = Math.max(longest, pathLength)
    }

    return longest
}
