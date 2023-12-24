import ansiColors from 'ansi-colors';
import { Coordinate } from '../utils/types';
import input from './input';
import { getVerticalAdjacents } from '../utils';
import { deepStrictEqual } from 'assert';

type Slope = '>' | '<' | 'v'
type Item = Slope | '#' | '.'
type Grid<T> = {
    [row in number]: {
        [col in number]: T
    }
}

type Intersection = {
    name: string,
    location: Coordinate
}

type Island = {
    rows: number,
    cols: number,
    start: Coordinate,
    end: Coordinate,
    grid: Grid<Item>
    intersections: Intersection[]
}

type Candidate = {
    steps: Coordinate[]
}

function renderIsland(island: Island, path?: Candidate): string {
    let output = ''
    for (let row = 0; row < island.rows; row += 1) {
        for (let col = 0; col < island.cols; col += 1) {
            if (island.intersections.some(intersection => intersection.location.row === row && intersection.location.col === col)) {
                // inefficient but idc
                const intersection = island.intersections.find(intersection => intersection.location.row === row && intersection.location.col === col)!
                output += ansiColors.bold.magentaBright(intersection.name)
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

type Direction = '<' | '>' | '^' | 'v'

const MOVER: {
    [d in Direction]: (coord: Coordinate) => Coordinate } = {
    '<': (coord) => ({ row: coord.row, col: coord.col - 1 }),
    '>': (coord) => ({ row: coord.row, col: coord.col + 1 }),
    '^': (coord) => ({ row: coord.row - 1, col: coord.col }),
    'v': (coord) => ({ row: coord.row + 1, col: coord.col }),
}

// letters S and E are intentionally excluded - they will be used for
// the "start" and "end" of the hike. O is also excluded since it is
// used to mark out paths.
const INTERSECTION_NAMES = 'ABCDFGHIJKLMNPQRTUVWXYZabcdfghijklmnpqrtuvwxyz'
function findIntersections(island: Island): Intersection[] {
    const intersections: Intersection[] = []
    let nameIndex = 0
    for (let row = 0; row < island.rows; row += 1) {
        for (let col = 0; col < island.cols; col += 1) {
            const item = island.grid[row][col]

            // skip if the coordinate is a wall '#'
            if (item === '#') continue;

            // check all directions
            const adjacents = checkAdjacents({ row, col }, island)
            if (adjacents > 2) {
                intersections.push({
                    name: INTERSECTION_NAMES[nameIndex],
                    location: { row, col }
                })
                nameIndex += 1
            }
        }
    }
    return intersections
}

type IntersectionSearch = {
    island: Island,
    visited: Grid<boolean>,
    longestPaths: {
        [intersection1 in string]: {
            [intersection2 in string]: Candidate
        }
    }
}

type Solutions = {
    [intersectionName in string]: Candidate[]
}

let cycles = 0
let DEBUG_OBSERVATIONS = 10
/**
 * This solve now works differently. Instead of trying to locate an end, it begins at some arbitrary point
 * then searches for *any* intersection. Once such an intersection is found, do not progress beyond the intersection
 * but keep record of all paths to that intersection.
 * 
 * Once the search space is exhausted:
 * 1. Select the longest path that gets to that intersection
 * 2. Mark all searched coordinates as visited.
 * 
 * @param searchMeta 
 * @param start 
 * @param debug 
 * @returns 
 */
function solve(searchMeta: IntersectionSearch, start: Coordinate, debug: boolean = false): Solutions {
    const { island, visited } = searchMeta
    const candidates: Candidate[] = [{ steps: [start] }]
    const solutions: Solutions = {}

    const searchSpace: Grid<boolean> = {}

    while (candidates.length > 0) {
        const candidate = candidates.shift()!
        const currStep = candidate.steps[candidate.steps.length - 1]
        const { row, col } = currStep

        // console.log(`Considering candidate`, candidate)

        // if we're at ANY intersection, we have found a "solution", but still keep searching
        let solutionFound = false
        if (!(row === start.row && col === start.col)) {
            for (const intersection of island.intersections) {
                if (row === intersection.location.row && col === intersection.location.col) {
                    solutions[intersection.name] = solutions[intersection.name] || []
                    solutions[intersection.name].push(candidate)
                    solutionFound = true
                    break
                }
            }
        }

        if (solutionFound) {
            continue
        }

        let nextCoordinates: Coordinate[] = []
        const itemAtCurrent = island.grid[row][col]
        if (itemAtCurrent === '#') {
            throw new Error(`something is wrong with the search algorithm`)
        }

        const newDirections = getVerticalAdjacents(currStep)
            .filter(coord => isValidCoordinate(coord, island) && !(visited[coord.row]?.[coord.col]))
        nextCoordinates.push(...newDirections)

        // unlike typical BFS, we don't track visited. We just never backtrack
        nextCoordinates = nextCoordinates.filter(({ row, col }) => !candidate.steps.find(step => step.row === row && step.col === col))

        // track all coords visited as we go along
        for (const searched of nextCoordinates) {
            searchSpace[searched.row] = searchSpace[searched.row] || []
            searchSpace[searched.row][searched.col] = true
        }

        // now we do the standard step of generating new candidates
        for (const coordinate of nextCoordinates) {
            const nextCandidate = {
                steps: [...candidate.steps, coordinate]
            }
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

            if (candidates.length > 0 && candidates.length % 1000 === 0) {
                console.log(`Candidate count: ${candidates.length}`)
                console.log(`Path length being considered ${candidates[0].steps.length - 1}`)
                console.log(renderIsland(island, candidates[0]))
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
    }

    // transfer all searched coordinates to the searchMeta
    for (const row in searchSpace) {
        for (const col in searchSpace[row]) {
            // just make sure it's not an intersection
            if (!island.intersections.some(intersection => intersection.location.row === parseInt(row) && intersection.location.col === parseInt(col))) {
                searchMeta.visited[row] = searchMeta.visited[row] || []
                searchMeta.visited[row][col] = true
            }
        }
    }

    return solutions;
}

export default () => {
    const lines = input.split('\n')
    const island: Island = {
        rows: lines.length,
        cols: lines[0].length,
        start: { row: -1, col: -1 },
        end: { row: -1, col: -1 },
        grid: {},
        intersections: []
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


    console.log(`Island is of size ${island.rows} x ${island.cols}`)
    console.log(renderIsland(island))
    island.intersections = findIntersections(island)

    // we also append 2 special "intersections" - the start and the end
    island.intersections.push({
        name: 'S',
        location: {
            row: island.start.row,
            col: island.start.col
        }
    }, {
        name: 'E',
        location: {
            row: island.end.row,
            col: island.end.col
        }
    })

    console.log(`There are ${island.intersections.length} intersections`)
    console.log(renderIsland(island))

    let longest = Number.MIN_SAFE_INTEGER

    const searchMeta: IntersectionSearch = {
        island,
        visited: {},
        longestPaths: {}
    }

    const candidateIntersections: string[] = ['S']

    while (candidateIntersections.length > 0) {
        const intersectionName = candidateIntersections.shift()!
        const intersection = island.intersections.find(intersection => intersection.name === intersectionName)

        if (!intersection) {
            throw new Error(`wtf no intersection named ${intersectionName}?`)
        }

        const solutions = solve(searchMeta, intersection.location)
        for (const destinationName of Object.keys(solutions)) {
            console.log(`${intersectionName} => ${destinationName} path found:`)
            candidateIntersections.push(destinationName)
            let solutionsFound = 0
            for (const candidate of solutions[destinationName]) {
                solutionsFound += 1
                console.log(renderIsland(island, candidate))
            }

            if (solutionsFound > 1) {
                throw new Error(`Somehow there are ${solutionsFound} paths from ${intersectionName} to ${destinationName}?`)
            }

            // update the paths of distances between intersections.
            searchMeta.longestPaths[intersectionName] = searchMeta.longestPaths[intersectionName] || {}
            searchMeta.longestPaths[intersectionName][destinationName] = solutions[destinationName][0]
            searchMeta.longestPaths[destinationName] = searchMeta.longestPaths[destinationName] || {}
            searchMeta.longestPaths[destinationName][intersectionName] = solutions[destinationName][0] // not technically correct but eh....
        }
    }

    // the scope of the problem is now reduced to intersections, just solve all paths for those, beginning with S and ending with E.
    type CandidateIntersectionPath = {
        path: string[],
        distance: number
    }

    const candidateIntersectionPaths: CandidateIntersectionPath[] = [{
        path: ['S'],
        distance: 0
    }]

    const intersectionPathSolutions: CandidateIntersectionPath[] = []

    while (candidateIntersectionPaths.length > 0) {
        const ciPath = candidateIntersectionPaths.shift()!
        const lastIntersection = ciPath.path[ciPath.path.length - 1]

        // end condition - E found
        if (lastIntersection === 'E') {
            intersectionPathSolutions.push(ciPath)
            continue
        }

        // the next steps are just the keys on searchMeta        
        const nextIntersections = Object.keys(searchMeta.longestPaths[lastIntersection])

        for (const intersection of nextIntersections) {
            if (ciPath.path.includes(intersection)) {
                continue; // no visiting the same intersection twice
            }

            candidateIntersectionPaths.push({
                path: [...ciPath.path, intersection],
                distance: ciPath.distance + searchMeta.longestPaths[lastIntersection][intersection].steps.length - 1
            })
        }
    }


    // console.log(JSON.stringify(intersectionPathSolutions, null, 2))
    for (const candidate of intersectionPathSolutions) {
        longest = Math.max(longest, candidate.distance)
    }


    // const solutions = solve(searchMeta, { row: island.start.row, col: island.start.col })
    // for (const intersectionKey of Object.keys(solutions)) {
    //     console.log(`Found the following paths leading to ${intersectionKey} from the start`)
    //     for (const candidate of solutions[intersectionKey]) {
    //         console.log(renderIsland(island, candidate))
    //     }
    // }

    // const dIntersection = island.intersections.find(intersection => intersection.name === 'D')!
    // const solutions2 = solve(searchMeta, { row: dIntersection.location.row, col: dIntersection.location.col })

    // for (const intersectionKey of Object.keys(solutions2)) {
    //     console.log(`Found the following paths leading to ${intersectionKey} from D`)
    //     for (const candidate of solutions2[intersectionKey]) {
    //         console.log(renderIsland(island, candidate))
    //     }
    // }

    // const aIntersection = island.intersections.find(intersection => intersection.name === 'A')!
    // const solutions3 = solve(searchMeta, { row: aIntersection.location.row, col: aIntersection.location.col })

    // for (const intersectionKey of Object.keys(solutions3)) {
    //     console.log(`Found the following paths leading to ${intersectionKey} from A`)
    //     for (const candidate of solutions3[intersectionKey]) {
    //         console.log(renderIsland(island, candidate))
    //     }
    // }

    // const gIntersection = island.intersections.find(intersection => intersection.name === 'G')!
    // const solutions4 = solve(searchMeta, { row: gIntersection.location.row, col: gIntersection.location.col })

    // for (const intersectionKey of Object.keys(solutions4)) {
    //     console.log(`Found the following paths leading to ${intersectionKey} from G`)
    //     for (const candidate of solutions4[intersectionKey]) {
    //         console.log(renderIsland(island, candidate))
    //     }
    // }

    // for (let p = 0; p < paths.length; p += 1) {
    //     console.log(`Path ${p}:`)
    //     // console.log(renderIsland(island, paths[p]))
    //     const pathLength = paths[p].steps.length - 1
    //     console.log(`Length: ${pathLength}`)
    //     longest = Math.max(longest, pathLength)
    // }

    return longest
}
