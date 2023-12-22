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

// note: these should be within the bounds of the garden
const coordinateHash = (coords: Coordinate[]): string => {
    return coords.map(({ row, col }) => `(${row},${col})`).sort().join('|')
}

type GardenCoordinateLookup = {
    [coordHash in string]: {
        inbounds: Coordinate[],
        outbounds: Coordinate[]
    }
}

type GardenHashLookup = {
    [coordHash in string]: string
}

const nextGardenLookup: GardenHashLookup = {}
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
                const tilesReachable = gardenCoordinateLookup[coordinateHash].inbounds
                gardenRenderLookup[coordinateHash] = renderGarden(w.garden, tilesReachable)
            }

            gardenOutputs[row] = gardenOutputs[row] || []
            gardenOutputs[row][col] = gardenRenderLookup[coordinateHash]
        }
    }

    try {
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
    } catch (err) {
        console.error(gardenOutputs[0][0])
        console.error(gardenOutputs[0][1])
        console.error({ minRow, maxRow, minCol, maxCol })
        throw err
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

    // dequeue each tile and mark all the valid spots around it
    while (initial.length > 0) {
        const reachable = initial.shift()!
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
        const gardenRow = parseInt(gardenRowKey, 10)
        for (const gardenColKey in w.gardenStates[gardenRowKey]) {
            const gardenCol = parseInt(gardenColKey, 10)
            const tilesReachableHash = w.gardenStates[gardenRowKey][gardenColKey]

            if (nextGardenLookup[tilesReachableHash]) {
                if (debug) {
                    console.log(`For tile ${gardenRow}, ${gardenCol}`)
                    console.log(renderGarden(w.garden, gardenCoordinateLookup[tilesReachableHash].inbounds))
                    console.log(`There's a next garden, which is supposed to be`)
                    console.log(renderGarden(w.garden, gardenCoordinateLookup[nextGardenLookup[tilesReachableHash]].inbounds))
                    console.log(`with the following outbound states: ${gardenCoordinateLookup[nextGardenLookup[tilesReachableHash]].outbounds.map(({ row, col }) => `(${row}, ${col})`).join('|')}`)

                    const { inbounds, outbounds } = deriveNextCoordinates(gardenCoordinateLookup[tilesReachableHash].inbounds, w.garden)
                    if (outbounds.length !== gardenCoordinateLookup[nextGardenLookup[tilesReachableHash]].outbounds.length) {
                        throw new Error(`wtf`)
                    }

                }
                w.gardenStates[gardenRowKey][gardenColKey] = nextGardenLookup[tilesReachableHash]

                outboundsTracker[gardenRowKey] = outboundsTracker[gardenRowKey] || []
                outboundsTracker[gardenRowKey][gardenColKey] = gardenCoordinateLookup[nextGardenLookup[tilesReachableHash]].outbounds
            } else {
                // need to derive the next coordinates - make a copy since this is going to be mutated
                const inboundsTilesReachable = gardenCoordinateLookup[tilesReachableHash].inbounds
                const tilesReachable = [...inboundsTilesReachable]
                // const nextTilesReachableMap: {
                //     [row in number]: {
                //         [col in number]: boolean
                //     }
                // } = []

                // // dequeue each tile and mark all the valid spots around it
                // while (tilesReachable.length > 0) {
                //     const reachable = tilesReachable.shift()!
                //     const candidateCoordinates = getVerticalAdjacents(reachable).filter(coord => isValidCoordinate(coord, w.garden))

                //     // push all candidates to the next tiles reachable
                //     for (const coord of candidateCoordinates) {
                //         nextTilesReachableMap[coord.row] = nextTilesReachableMap[coord.row] || []
                //         nextTilesReachableMap[coord.row][coord.col] = true
                //     }
                // }

                // // now that we're done, just dump it out
                // const inbounds: Coordinate[] = []
                // const outbounds: Coordinate[] = []
                // for (const rowKey in nextTilesReachableMap) {
                //     const rowReachable = nextTilesReachableMap[rowKey]
                //     for (const colKey in rowReachable) {
                //         const row = parseInt(rowKey, 10)
                //         const col = parseInt(colKey, 10)
                //         if (row >= 0 && row < w.garden.rows && col >= 0 && col < w.garden.cols) {
                //             inbounds.push({ row, col })
                //         } else {
                //             outbounds.push({ row, col })
                //         }
                //     }
                // }

                const { inbounds, outbounds } = deriveNextCoordinates(tilesReachable, w.garden)

                // split the tilesReachable into inbounds and outbounds
                // get the hash and update the different caches
                const nextTilesReachableHash = coordinateHash(inbounds)
                gardenCoordinateLookup[nextTilesReachableHash] = { inbounds, outbounds }
                nextGardenLookup[tilesReachableHash] = nextTilesReachableHash
                w.gardenStates[gardenRowKey][gardenColKey] = nextTilesReachableHash

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
                // console.log(`Currently in tile ${gardenRow}, ${gardenCol}`)
                const affectedGardenRow = parseInt(gardenRow) + (outbound.row < 0 ? - 1 : outbound.row >= w.garden.rows ? 1 : 0)
                const affectedGardenCol = parseInt(gardenCol) + (outbound.col < 0 ? - 1 : outbound.col >= w.garden.cols ? 1 : 0)
                const normalized = normalizeCoordinate(w.garden, outbound)
                // console.log(`Considering outbound ${outbound.row}, ${outbound.col}, normalized to ${normalized.row}, ${normalized.col}, should live in ${affectedGardenRow}, ${affectedGardenCol}`)
                const gardenTileHash = w.gardenStates[affectedGardenRow]?.[affectedGardenCol]
                if (!gardenTileHash) {
                    // console.log({ gardenStates: w.gardenStates })
                    // just create a new tile
                    const gardenHash = coordinateHash([normalized])

                    if (!gardenCoordinateLookup[gardenHash]) {
                        gardenCoordinateLookup[gardenHash] = { inbounds: [normalized], outbounds: [] }
                    }

                    w.gardenStates[affectedGardenRow] = w.gardenStates[affectedGardenRow] || []
                    w.gardenStates[affectedGardenRow][affectedGardenCol] = gardenHash
                    // console.log(`Created a new garden tile ${affectedGardenRow}, ${affectedGardenCol} with lookup ${gardenCoordinateLookup[gardenHash]}`)
                } else {
                    // see if the new coordinate exists in the list. If not, add it and
                    // recalculate the hash for the tile
                    const tilesReachable = gardenCoordinateLookup[gardenTileHash]
                    const alreadyPresent = tilesReachable.inbounds.some(({ row, col }) => row === normalized.row && col === normalized.col)
                    if (!alreadyPresent) {

                        const newInbounds = [...tilesReachable.inbounds, normalized]
                        const gardenHash = coordinateHash(newInbounds)
                        // console.log(`Adding to existing list of inbounds ${tilesReachable.inbounds.join(',')} to create ${newInbounds.join(',')}}`)

                        // if this doesn't already exists, add it to the cache.
                        // The outbounds remains empty, but this is ok since this isn't registered in nextGardenLookup
                        if (!gardenCoordinateLookup[gardenHash]) {
                            gardenCoordinateLookup[gardenHash] = { inbounds: newInbounds, outbounds: [] }
                        }

                        w.gardenStates[affectedGardenRow] = w.gardenStates[affectedGardenRow] || []
                        w.gardenStates[affectedGardenRow][affectedGardenCol] = gardenHash
                    }
                }
            }

        }
    }
}

function calculateTiles(w: World) {
    let total = 0
    for (const gardenRow in w.gardenStates) {
        for (const gardenCol in w.gardenStates[gardenRow]) {
            const hash = w.gardenStates[gardenRow][gardenCol]
            total += gardenCoordinateLookup[hash].inbounds.length
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
    gardenCoordinateLookup[initialGardenStartHash] = {
        inbounds: initialGardenStart,
        outbounds: []
    }

    const world: World = {
        garden,
        steps: 0,
        start,
        gardenStates: { 0: { 0: initialGardenStartHash } }
    }

    const STEPS = 42

    for (let steps = 1; steps <= STEPS; steps += 1) {
        // console.time(ansiColors.whiteBright(`Step ${steps}:`))

        simulateStep(world, true)
        // console.timeEnd(ansiColors.whiteBright(`Step ${steps}:`))
        console.log(ansiColors.whiteBright(`Step ${steps}:`))
        console.log(renderWorld(world))
    }



    // console.log({ gardenCoordinateLookup, nextGardenLookup })

    // console.log(renderWorld(world, false))
    // console.log({ gRows: world.garden.rows, gCols: world.garden.cols, rowBounds: world.rowBounds, colBounds: world.colBounds })

    return calculateTiles(world)
}
