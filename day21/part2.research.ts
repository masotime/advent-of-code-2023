import ansiColors from 'ansi-colors';
import { getVerticalAdjacents } from '../utils';
import { Coordinate } from '../utils/types';
import input from './sample';

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
    // note: the bounds are inclusive - e.g. maxRow = 10 means row 10 exists.
    rowBounds: {
        min: number,
        max: number
    },
    colBounds: {
        min: number,
        max: number
    }
    start: Coordinate,
    steps: number,
    tilesReachable: Coordinate[]
}

function renderWorld(w: World, subset: boolean): string {
    let output = ''

    const rowMin = subset ? 0 : w.rowBounds.min
    const rowMax = subset ? w.garden.rows - 1 : w.rowBounds.max
    const colMin = subset ? 0 : w.colBounds.min
    const colMax = subset ? w.garden.cols - 1 : w.colBounds.max
    let oCount = 0
    for (let row = rowMin; row <= rowMax; row += 1) {
        for (let col = colMin; col <= colMax; col += 1) {
            const isOTile = w.tilesReachable.some(coord => (coord.row === row) && (coord.col === col))
            const isSTile = w.start.row === row && w.start.col === col
            const centerTile = row >= 0 && row < w.garden.rows && col >= 0 && col < w.garden.cols
            if (isOTile) {
                output += centerTile ? ansiColors.yellowBright('O') : ansiColors.whiteBright('O')
                oCount += 1
            } else if (isSTile) {
                output += 'S'
            } else {
                const item = getGardenItem(w.garden, { row, col })
                output += centerTile ? ansiColors.redBright(item) : item
            }
        }

        output += '\n'
    }

    output += `O Count: ${oCount}\n`

    return output
}

function getGardenItem(g: Garden, { row, col }: Coordinate): string {
    // normalize the row and col values
    // javascript doesn't modulo negative correctly e.g. -4 % 11 = -4, instead of the expected 7.
    let normalizedRow = row % g.rows
    let normalizedCol = col % g.cols

    if (normalizedRow < 0) {
        normalizedRow += g.rows
    }

    if (normalizedCol < 0) {
        normalizedCol += g.cols
    }

    return g.grid[normalizedRow][normalizedCol]
}

function isValidCoordinate({ row, col }: Coordinate, g: Garden) {
    // out of bounds values are now accepted
    if (getGardenItem(g, { row, col }) !== '.') return false;

    return true
}

function simulateStep(w: World) {
    if (w.tilesReachable.length === 0) {
        w.tilesReachable.push(w.start)
    }

    const nextTilesReachableMap: {
        [row in number]: {
            [col in number]: boolean
        }
    } = []

    // dequeue each tile and mark all the valid spots around it
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
    for (const rowKey in nextTilesReachableMap) {
        const rowReachable = nextTilesReachableMap[rowKey]
        for (const colKey in rowReachable) {
            const row = parseInt(rowKey, 10)
            const col = parseInt(colKey, 10)
            w.tilesReachable.push({ row, col })
            w.rowBounds.min = Math.min(w.rowBounds.min, row)
            w.rowBounds.max = Math.max(w.rowBounds.max, row)
            w.colBounds.min = Math.min(w.colBounds.min, col)
            w.colBounds.max = Math.max(w.colBounds.max, col)
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
        rowBounds: {
            min: 0,
            max: garden.rows - 1
        },
        colBounds: {
            min: 0,
            max: garden.cols - 1
        },
        tilesReachable: [],
        start
    }

    // console.log(renderWorld(world, false))

    const tilesReachable: number[] = []
    const STEPS = 150

    for (let steps = 1; steps <= STEPS; steps += 1) {
        // console.time(ansiColors.whiteBright(`Step ${steps}:`))

        simulateStep(world)
        // console.timeEnd(ansiColors.whiteBright(`Step ${steps}:`))
        console.log(ansiColors.whiteBright(`Step ${steps}: ${world.tilesReachable.length}`))
        console.log(renderWorld(world, false))
        tilesReachable.push(world.tilesReachable.length)
    }

    // console.log(renderWorld(world, false))
    console.log({ gRows: world.garden.rows, gCols: world.garden.cols, rowBounds: world.rowBounds, colBounds: world.colBounds })

    return world.tilesReachable.length
}
