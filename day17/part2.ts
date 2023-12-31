import { Coordinate } from '../utils/types';
import input from './input';
import ansi from 'ansi-colors'

type Maze = {
    rows: number,
    cols: number,
    items: {
        [row in number]: {
            [col in number]: number
        }
    }
}

function render(maze: Maze, steps?: Step[]): string {
    let output = ''
    for (let row = 0; row < maze.rows; row += 1) {
        for (let col = 0; col < maze.cols; col += 1) {
            const step = steps?.find(step => step.row === row && step.col === col)
            output += step ? ansi.whiteBright.bold(step.direction) : maze.items[row][col]
        }
        output += '\n'
    }
    return output
}

type Direction = '>' | 'v' | '<' | '^'
type Step = {
    row: number,
    col: number,
    direction: Direction
}

type Candidate = {
    steps: Step[],
    cost: number,
    lastDirs: Direction[]
}

const turnLeft: { [dir in Direction]: Direction } = {
    '>': '^',
    '<': 'v',
    '^': '<',
    'v': '>'
}

const turnRight: { [dir in Direction]: Direction } = {
    '>': 'v',
    '<': '^',
    '^': '>',
    'v': '<'
}

const moveForward = ({ row, col }: Step, direction: Direction, m: Maze): Coordinate | undefined => {
    let nextRow = row, nextCol = col
    switch (direction) {
        case '^':
            nextRow = row - 1; break;
        case 'v':
            nextRow = row + 1; break;
        case '<':
            nextCol = col - 1; break;
        case '>':
            nextCol = col + 1; break;
        default:
            throw new Error('wtfmove')
    }

    if (nextRow < 0 || nextRow >= m.rows || nextCol < 0 || nextCol >= m.cols) return;
    return { row: nextRow, col: nextCol }
}

const MINIMUM_MOVE = 4
const MAXIMUM_MOVE = 10

// dirs is assumed to be all in the same direction
const mustChangeDirection = (dirs: Direction[]): boolean => {
    return dirs.length === MAXIMUM_MOVE
}

const MINIMUM_PATTERNS: { [d in Direction]: Direction[] } = {
    '^': new Array(MINIMUM_MOVE).fill('^'),
    '<': new Array(MINIMUM_MOVE).fill('<'),
    'v': new Array(MINIMUM_MOVE).fill('v'),
    '>': new Array(MINIMUM_MOVE).fill('>')
}

function turnAndMoveCandidate(candidate: Candidate, dir: Direction, maze: Maze): Candidate | undefined {
    const newCandidate: Candidate = {
        steps: [...candidate.steps],
        cost: candidate.cost,
        // this candidate might not be returned, so it is safe to set this first
        lastDirs: MINIMUM_PATTERNS[dir]
    }

    for (let count = 0; count < MINIMUM_MOVE; count += 1) {
        const lastStep = newCandidate.steps[newCandidate.steps.length - 1]
        const nextCoord = moveForward(lastStep, dir, maze)
        if (!nextCoord) {
            // don't bother, this won't work, it goes off the map
            return undefined
        }
        newCandidate.cost += maze.items[nextCoord.row][nextCoord.col]
        newCandidate.steps.push({
            row: nextCoord.row,
            col: nextCoord.col,
            direction: dir
        })
    }
    return newCandidate
}

type CostCache = {
    [key in string]: number
}

function solve(maze: Maze) {
    let candidates: Candidate[] = [
        // every maze will start with these 2 possibilities
        {
            steps: new Array(MINIMUM_MOVE).fill(1).map((_, idx) => ({
                row: 0,
                col: idx + 1,
                direction: '>'
            })),
            cost: new Array(MINIMUM_MOVE).fill(1).reduce((acc, _, idx) => acc + maze.items[0][idx + 1], 0),
            lastDirs: MINIMUM_PATTERNS['>']
        },
        {
            steps: new Array(MINIMUM_MOVE).fill(1).map((_, idx) => ({
                row: idx + 1,
                col: 0,
                direction: 'v'
            })),
            cost: new Array(MINIMUM_MOVE).fill(1).reduce((acc, _, idx) => acc + maze.items[idx + 1][0], 0),
            lastDirs: MINIMUM_PATTERNS['v']
        }]

    const costCache: CostCache = {
        [`0,${MINIMUM_MOVE},>`]: maze.items[0][MINIMUM_MOVE],
        [`1,0,v`]: maze.items[1][0]
    }

    function checkAndSetCache({ row, col }: Coordinate, lastDirs: Direction[], newCost: number): boolean {
        const key = `${row},${col},${lastDirs.join('')}`

        if (costCache[key] === undefined || newCost < costCache[key]) {
            // we have a better result or a new result
            costCache[key] = newCost
            return true
        }

        return newCost < costCache[key]
    }

    const solutions: Candidate[] = []

    while (candidates.length > 0) {
        const candidate = candidates.shift()!
        const { steps, lastDirs } = candidate
        const lastStep = steps[steps.length - 1]

        if (lastStep.row === maze.rows - 1 && lastStep.col === maze.cols - 1) {
            // we have a solution
            solutions.push(candidate)
            console.log('Found a solution', candidate.cost)
            continue
        }

        // figure out what to try next
        // case 1: move in the same direction
        if (!mustChangeDirection(lastDirs)) {
            const nextCoordinate = moveForward(lastStep, lastStep.direction, maze)
            if (nextCoordinate) {
                const newCost = candidate.cost + maze.items[nextCoordinate.row][nextCoordinate.col]
                const newDirs = [...lastDirs, lastStep.direction]
                if (checkAndSetCache(nextCoordinate, newDirs, newCost)) {
                    candidates.push({
                        steps: [...steps, {
                            row: nextCoordinate.row,
                            col: nextCoordinate.col,
                            direction: lastStep.direction
                        }],
                        cost: newCost,
                        lastDirs: newDirs // this accumulates
                    })
                }
            }
        }

        // case 2: turn left or right, then move forward the MINIMUM_MOVE steps
        const turnLeftDirection = turnLeft[lastStep.direction]
        const turnLeftCandidate = turnAndMoveCandidate(candidate, turnLeftDirection, maze)
        if (turnLeftCandidate) {
            const endingCoord = turnLeftCandidate.steps[turnLeftCandidate.steps.length - 1]
            const endingCost = turnLeftCandidate.cost
            const lastDirs = turnLeftCandidate.lastDirs

            if (checkAndSetCache(endingCoord, lastDirs, endingCost)) {
                candidates.push(turnLeftCandidate)
            }
        }

        const turnRightDirection = turnRight[lastStep.direction]
        const turnRightCandidate = turnAndMoveCandidate(candidate, turnRightDirection, maze)
        if (turnRightCandidate) {
            const endingCoord = turnRightCandidate.steps[turnRightCandidate.steps.length - 1]
            const endingCost = turnRightCandidate.cost
            const lastDirs = turnRightCandidate.lastDirs

            if (checkAndSetCache(endingCoord, lastDirs, endingCost)) {
                candidates.push(turnRightCandidate)
            }
        }


        candidates.sort((a, b) => a.cost - b.cost)
        if (candidates.length % 1000 === 0) {
            console.log(candidates.length)
        }
    }

    // console.log(costCache)

    return solutions;
}
export default () => {
    const lines = input.split('\n')
    const maze: Maze = {
        rows: lines.length,
        cols: lines[0].length,
        items: {}
    }

    for (let row = 0; row < maze.rows; row += 1) {
        const line = lines[row]
        for (let col = 0; col < maze.cols; col += 1) {
            maze.items[row] = maze.items[row] || []
            maze.items[row][col] = parseInt(line[col], 10)
        }
    }

    console.log(render(maze))

    const solutions = solve(maze)
    solutions.sort((a, b) => a.cost - b.cost)
    const bestSolution = solutions[0]

    solutions.filter(solution => solution.cost === bestSolution.cost).forEach(solution => {
        console.log(render(maze, solution.steps))
    })

    // console.log(bestSolution.steps)

    return bestSolution.cost
}
