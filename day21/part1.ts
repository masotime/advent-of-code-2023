import ansiColors from 'ansi-colors';
import { getVerticalAdjacents } from '../utils';
import { Coordinate } from '../utils/types';
import input from './input';

type Garden = {
    rows: number,
    cols: number,
    grid: {
        [row in number]: {
            [col in number]: string
        }
    },
}

type World = {
    garden: Garden,
    start: Coordinate,
    steps: number,
    tilesReachable: Coordinate[]
}

function renderWorld(w: World): string {
    let output = ''

    for (let row = 0; row < w.garden.rows; row += 1) {
        for (let col = 0; col < w.garden.cols; col += 1) {
            const isOTile = w.tilesReachable.some(coord => (coord.row === row) && (coord.col === col))
            const isSTile = w.start.row === row && w.start.col === col
            if (isOTile) {
                output += ansiColors.whiteBright('O')
            } else if (isSTile) {
                output += 'S'
            } else {
                output += w.garden.grid[row][col]
            }
        }

        output += '\n'
    }

    return output
}

function isValidCoordinate({ row, col }: Coordinate, g: Garden) {
    if (row < 0 || row >= g.rows || col < 0 || col >= g.cols) {
        return false
    }

    if (g.grid[row][col] !== '.') return false;

    return true
}

function simulateStep(w: World) {
    if (w.tilesReachable.length === 0) {
        w.tilesReachable.push(w.start)
    }

    // dequeue each tile and mark all the valid spots around it
    const nextTilesReachableMap: {
        [row in number]: {
            [col in number]: boolean
        }
    } = []

    while (w.tilesReachable.length > 0) {
        const reachable = w.tilesReachable.shift()!
        const candidateCoordinates = getVerticalAdjacents(reachable).filter(coord => isValidCoordinate(coord, w.garden))

        // push all candidates to the next tiles reachable
        for (const coord of candidateCoordinates) {
            nextTilesReachableMap[coord.row] = nextTilesReachableMap[coord.row] || []
            nextTilesReachableMap[coord.row][coord.col] = true
        }
    }

    // now that we're done, just dump it out
    for (const row in nextTilesReachableMap) {
        const rowReachable = nextTilesReachableMap[row]
        for (const col in rowReachable) {
            w.tilesReachable.push({ row: parseInt(row, 10), col: parseInt(col, 10) })
        }
    }
}

export default () => {
    const lines = input.split('\n')
    const garden: Garden = {
        rows: lines.length,
        cols: lines[0].length,
        grid: {},
    }

    let start: Coordinate | undefined = undefined

    for (let row = 0; row < garden.rows; row += 1) {
        const rowStr = lines[row]
        for (let col = 0; col < garden.cols; col += 1) {
            const item = rowStr[col]
            if (item === 'S') {
                start = { row, col }
            }

            garden.grid[row] = garden.grid[row] || []
            garden.grid[row][col] = item === 'S' ? '.' : item
        }
    }

    if (!start) {
        throw new Error(`Start position not found.`)
    }

    const world: World = {
        garden,
        steps: 0,
        tilesReachable: [],
        start
    }

    console.log(renderWorld(world))

    for (let steps = 1; steps <= 64; steps += 1) {
        simulateStep(world)
        console.log(ansiColors.whiteBright(`Step ${steps}:`))
        console.log(renderWorld(world))
    }

    return world.tilesReachable.length
}
