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

// note: these should be within the bounds of the garden
const coordinateHash = (coords: Coordinate[]): string => {
    return coords.map(({ row, col }) => `(${row},${col})`).sort().join('|')
}

type GardenCoordinateLookup = {
    [coordHash in string]: Coordinate[]
}

type GardenHashLookup = {
    [coordHash in string]: string
}

type NextGardenHashLookup = {
    [coordHash in string]: {
        inbounds: string,
        outbounds: string
    }
}

const nextGardenLookup: NextGardenHashLookup = {}
const gardenCoordinateLookup: GardenCoordinateLookup = {}
const gardenRenderLookup: GardenHashLookup = {}

type World = {
    garden: Garden,
    start: Coordinate,
    steps: number,
    gardenStates: {
        [row in number]: {
            [col in number]: string
        }
    }
}

function renderGarden(g: Garden, tilesReachable: Coordinate[]): string {
    let output = ''
    const tilesReachableArray = Array.from(tilesReachable)
    for (let row = 0; row < g.rows; row += 1) {
        for (let col = 0; col < g.cols; col += 1) {
            const isOTile = tilesReachableArray.some(coord => (coord.row === row) && (coord.col === col))
            if (isOTile) {
                output += ansiColors.whiteBright('O')
            } else {
                const item = getGardenItem(g, { row, col })
                output += item
            }
        }
        output += '\n'
    }
    return output
}

function renderWorld(w: World): string {
    let output = ''
    const gardenOutputs: {
        [row in number]: {
            [col in number]: string
        }
    } = {}

    let minRow = Number.MAX_SAFE_INTEGER
    let maxRow = Number.MIN_SAFE_INTEGER
    let minCol = Number.MAX_SAFE_INTEGER
    let maxCol = Number.MIN_SAFE_INTEGER

    for (const rowStr in w.gardenStates) {
        const row = parseInt(rowStr)
        minRow = Math.min(minRow, row)
        maxRow = Math.max(maxRow, row)
        for (const colStr in w.gardenStates[rowStr]) {
            const col = parseInt(colStr)
            maxCol = Math.max(maxCol, col)
            minCol = Math.min(minCol, col)
            const coordinateHash = w.gardenStates[row][col]

            if (!gardenRenderLookup[coordinateHash]) {
                const tilesReachable = gardenCoordinateLookup[coordinateHash]
                gardenRenderLookup[coordinateHash] = renderGarden(w.garden, tilesReachable)
            }

            gardenOutputs[row] = gardenOutputs[row] || []
            gardenOutputs[row][col] = gardenRenderLookup[coordinateHash]
        }
    }

    for (let gardenRow = minRow; gardenRow <= maxRow; gardenRow += 1) {
        for (let row = 0; row < w.garden.rows; row += 1) {
            for (let gardenCol = minCol; gardenCol <= maxCol; gardenCol += 1) {
                const rawGardenOutput = gardenOutputs[gardenRow]?.[gardenCol]
                if (!rawGardenOutput) {
                    // just fill a full row
                    output += new Array(w.garden.cols).fill('.').join('')
                } else {
                    const line = gardenOutputs[gardenRow][gardenCol].split('\n')[row]
                    output += line
                }
            }
            output += '\n'
        }
    }


    return output
}

function normalizeCoordinate(g: Garden, { row, col }: Coordinate): Coordinate {
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

    return { row: normalizedRow, col: normalizedCol }
}

function getGardenItem(g: Garden, { row, col }: Coordinate): string {
    const { row: normalizedRow, col: normalizedCol } = normalizeCoordinate(g, { row, col })
    return g.grid[normalizedRow][normalizedCol]
}

function isValidCoordinate({ row, col }: Coordinate, g: Garden) {
    // out of bounds values are now accepted
    if (getGardenItem(g, { row, col }) !== '.') return false;

    return true
}

function deriveNextCoordinates(initial: Coordinate[], g: Garden): { outbounds: Coordinate[], inbounds: Coordinate[] } {
    const nextTilesReachableMap: {
        [row in number]: {
            [col in number]: boolean
        }
    } = []

    // make a copy of initial, because it is being used elsewhere
    const initialCopy = [...initial]

    // dequeue each tile and mark all the valid spots around it
    while (initialCopy.length > 0) {
        const reachable = initialCopy.shift()!
        const candidateCoordinates = getVerticalAdjacents(reachable).filter(coord => isValidCoordinate(coord, g))

        // push all candidates to the next tiles reachable
        for (const coord of candidateCoordinates) {
            nextTilesReachableMap[coord.row] = nextTilesReachableMap[coord.row] || []
            nextTilesReachableMap[coord.row][coord.col] = true
        }
    }

    // now that we're done, just dump it out
    const inbounds: Coordinate[] = []
    const outbounds: Coordinate[] = []
    for (const rowKey in nextTilesReachableMap) {
        const rowReachable = nextTilesReachableMap[rowKey]
        for (const colKey in rowReachable) {
            const row = parseInt(rowKey, 10)
            const col = parseInt(colKey, 10)
            if (row >= 0 && row < g.rows && col >= 0 && col < g.cols) {
                inbounds.push({ row, col })
            } else {
                outbounds.push({ row, col })
            }
        }
    }

    return { inbounds, outbounds }
}

function simulateStep(w: World, debug: boolean) {
    const outboundsTracker: {
        [row in number]: {
            [col in number]: Coordinate[]
        }
    } = {}

    for (const gardenRowKey in w.gardenStates) {
        for (const gardenColKey in w.gardenStates[gardenRowKey]) {
            const currentTileHash = w.gardenStates[gardenRowKey][gardenColKey]

            if (nextGardenLookup[currentTileHash]) {
                const currentGardenCoordinates = gardenCoordinateLookup[currentTileHash]
                const nextGardenLookupHash = nextGardenLookup[currentTileHash]
                const nextGardenCoordinates = gardenCoordinateLookup[nextGardenLookupHash.inbounds]
                const nextGardenOutboundsCoordinates = gardenCoordinateLookup[nextGardenLookupHash.outbounds]

                w.gardenStates[gardenRowKey][gardenColKey] = nextGardenLookupHash.inbounds

                outboundsTracker[gardenRowKey] = outboundsTracker[gardenRowKey] || []
                outboundsTracker[gardenRowKey][gardenColKey] = nextGardenOutboundsCoordinates
            } else {
                // need to derive the next coordinates - make a copy since this is going to be mutated
                const inboundsTilesReachable = gardenCoordinateLookup[currentTileHash]
                const tilesReachable = [...inboundsTilesReachable]

                const { inbounds, outbounds } = deriveNextCoordinates(tilesReachable, w.garden)

                // split the tilesReachable into inbounds and outbounds
                // get the hash and update the different caches
                const nextInboundsHash = coordinateHash(inbounds)
                const nextOutboundsHash = coordinateHash(outbounds)

                gardenCoordinateLookup[nextInboundsHash] = inbounds
                gardenCoordinateLookup[nextOutboundsHash] = outbounds
                nextGardenLookup[currentTileHash] = {
                    inbounds: nextInboundsHash,
                    outbounds: nextOutboundsHash
                }
                w.gardenStates[gardenRowKey][gardenColKey] = nextInboundsHash


                outboundsTracker[gardenRowKey] = outboundsTracker[gardenRowKey] || []
                outboundsTracker[gardenRowKey][gardenColKey] = outbounds
            }
        }
    }

    // we have to deal with outbounds now. We didn't deal with them earlier because they aren't
    // supposed to affect the step calculataion cycle if they are introduced to tiles that haven't been
    // fully computed yet
    for (const gardenRow in outboundsTracker) {
        for (const gardenCol in outboundsTracker[gardenRow]) {
            const outbounds = outboundsTracker[gardenRow][gardenCol]
            for (const outbound of outbounds) {
                const affectedGardenRow = parseInt(gardenRow) + (outbound.row < 0 ? - 1 : outbound.row >= w.garden.rows ? 1 : 0)
                const affectedGardenCol = parseInt(gardenCol) + (outbound.col < 0 ? - 1 : outbound.col >= w.garden.cols ? 1 : 0)
                const normalized = normalizeCoordinate(w.garden, outbound)
                const gardenTileHash = w.gardenStates[affectedGardenRow]?.[affectedGardenCol]
                if (!gardenTileHash) {
                    // just create a new tile
                    const gardenHash = coordinateHash([normalized])

                    if (!gardenCoordinateLookup[gardenHash]) {
                        gardenCoordinateLookup[gardenHash] = [normalized]
                    }

                    w.gardenStates[affectedGardenRow] = w.gardenStates[affectedGardenRow] || []
                    w.gardenStates[affectedGardenRow][affectedGardenCol] = gardenHash
                } else {
                    // see if the new coordinate exists in the list. If not, add it and
                    // recalculate the hash for the tile
                    const tilesReachable = gardenCoordinateLookup[gardenTileHash]
                    const alreadyPresent = tilesReachable.some(({ row, col }) => row === normalized.row && col === normalized.col)
                    if (!alreadyPresent) {

                        const newInbounds = [...tilesReachable, normalized]
                        const gardenHash = coordinateHash(newInbounds)

                        // if this doesn't already exists, add it to the cache.
                        // The outbounds remains empty, but this is ok since this isn't registered in nextGardenLookup
                        if (!gardenCoordinateLookup[gardenHash]) {
                            gardenCoordinateLookup[gardenHash] = newInbounds
                        }

                        w.gardenStates[affectedGardenRow] = w.gardenStates[affectedGardenRow] || []
                        w.gardenStates[affectedGardenRow][affectedGardenCol] = gardenHash
                    }
                }
            }

        }
    }
}

function renderTileCount(w: World): string {
    let output = ''
    const gardenOutputs: {
        [row in number]: {
            [col in number]: number
        }
    } = {}

    let minRow = Number.MAX_SAFE_INTEGER
    let maxRow = Number.MIN_SAFE_INTEGER
    let minCol = Number.MAX_SAFE_INTEGER
    let maxCol = Number.MIN_SAFE_INTEGER

    for (const rowStr in w.gardenStates) {
        const row = parseInt(rowStr)
        minRow = Math.min(minRow, row)
        maxRow = Math.max(maxRow, row)
        for (const colStr in w.gardenStates[rowStr]) {
            const col = parseInt(colStr)
            maxCol = Math.max(maxCol, col)
            minCol = Math.min(minCol, col)
            const coordinateHash = w.gardenStates[row][col]

            gardenOutputs[row] = gardenOutputs[row] || []
            gardenOutputs[row][col] = gardenCoordinateLookup[coordinateHash].length
        }
    }

    const COLUMN_SIZE = 5
    const countFrequency: {
        [count in number]: number
    } = {}

    for (let gardenRow = minRow; gardenRow <= maxRow; gardenRow += 1) {
        for (let gardenCol = minCol; gardenCol <= maxCol; gardenCol += 1) {
            const rawGardenOutput = gardenOutputs[gardenRow]?.[gardenCol]
            if (!rawGardenOutput) {
                // just fill a full row
                output += new Array(COLUMN_SIZE).fill(' ').join('')
            } else {
                countFrequency[rawGardenOutput] = countFrequency[rawGardenOutput] || 0
                countFrequency[rawGardenOutput] += 1
                const line = rawGardenOutput.toString().padStart(COLUMN_SIZE)
                output += line
            }
        }
        output += '\n'
    }

    for (const key in countFrequency) {
        output += `${key}: ${countFrequency[key]}\n`
    }

    return output
}
function calculateTiles(w: World) {
    let total = 0
    for (const gardenRow in w.gardenStates) {
        for (const gardenCol in w.gardenStates[gardenRow]) {
            const hash = w.gardenStates[gardenRow][gardenCol]
            total += gardenCoordinateLookup[hash].length
        }
    }
    return total
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

    const initialGardenStart = [{ row: start.row, col: start.col }]
    const initialGardenStartHash = coordinateHash(initialGardenStart)
    gardenCoordinateLookup[initialGardenStartHash] = initialGardenStart

    const world: World = {
        garden,
        steps: 0,
        start,
        gardenStates: { 0: { 0: initialGardenStartHash } }
    }

    console.log(`Garden is of size ${ansiColors.cyanBright(garden.rows.toString())} by ${ansiColors.cyanBright(garden.cols.toString())}`)

    const STEPS = 1000
    const OFFSET = 65

    for (let steps = 1; steps <= STEPS; steps += 1) {
        // console.time(ansiColors.whiteBright(`Step ${steps}:`))

        simulateStep(world, true)
        // console.timeEnd(ansiColors.whiteBright(`Step ${steps}:`))

        if (steps % garden.rows === OFFSET) {
            console.log(ansiColors.whiteBright(`Step ${steps} or (${garden.rows} * ${Math.floor(steps / garden.rows)} + ${OFFSET}):`))
            console.log(renderTileCount(world))
            console.log(`Sum should be ${calculateTiles(world)}`)
        }
        // console.log(renderWorld(world))
    }



    // console.log({ gardenCoordinateLookup, nextGardenLookup })

    // console.log(renderWorld(world))
    // console.log({ gRows: world.garden.rows, gCols: world.garden.cols, rowBounds: world.rowBounds, colBounds: world.colBounds })

    return calculateTiles(world)
}
