import { Coordinate } from '../utils/types';
import input from './sample2';
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
    cost: number
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

const mustChangeDirection = (steps: Step[]): boolean => {
    const lastThree = steps.slice(-3).map(step => step.direction)
    return (lastThree.length === 3) && (lastThree[2] === lastThree[1]) && (lastThree[1] === lastThree[0])
}

type CostCache = {
    [row in number]: {
        [col in number]: number
    }
}

function alreadyVisited(nextCoordinate: Coordinate, steps: Step[]) {
    return steps.some(step => step.row === nextCoordinate.row && step.col === nextCoordinate.col)
}

function solve(maze: Maze) {
    let candidates: Candidate[] = [
        // every maze will start with these 2 possibilities
        {
            steps: [{
                row: 0,
                col: 1,
                direction: '>'
            }],
            cost: maze.items[0][1]
        },
        {
            steps: [{
                row: 1,
                col: 0,
                direction: 'v'
            }],
            cost: maze.items[1][0]
        }]

    const costCache: CostCache = {
        0: { 1: maze.items[0][1] },
        1: { 0: maze.items[1][0] }
    }

    function checkAndSetCache({ row, col }: Coordinate, dir: Direction, newCost: number): boolean {
        costCache[row] = costCache[row] || []

        if (costCache[row][col] === undefined || newCost < costCache[row][col]) {
            // we have a better result or a new result
            costCache[row][col] = newCost
            return true
        }

        // return newCost < costCache[row][col]
        return true
    }

    const solutions: Candidate[] = []

    while (candidates.length > 0) {
        const candidate = candidates.shift()!
        const { steps } = candidate
        const lastStep = steps[steps.length - 1]

        if (lastStep.row === maze.rows - 1 && lastStep.col === maze.cols - 1) {
            // we have a solution
            solutions.push(candidate)
            console.log('Found a solution', candidate.cost)
            continue
        }

        // figure out what to try next
        // case 1: move in the same direction
        if (!mustChangeDirection(steps)) {
            const nextCoordinate = moveForward(lastStep, lastStep.direction, maze)
            if (nextCoordinate && !alreadyVisited(nextCoordinate, steps)) {
                const newCost = candidate.cost + maze.items[nextCoordinate.row][nextCoordinate.col]
                if (checkAndSetCache(nextCoordinate, lastStep.direction, newCost)) {
                    candidates.push({
                        steps: [...steps, {
                            row: nextCoordinate.row,
                            col: nextCoordinate.col,
                            direction: lastStep.direction
                        }],
                        cost: newCost
                    })
                }
            }
        }

        // case 2: turn left or right, then move forward
        const turnLeftDirection = turnLeft[lastStep.direction]
        const turnLeftNext = moveForward(lastStep, turnLeftDirection, maze)
        if (turnLeftNext && !alreadyVisited(turnLeftNext, steps)) {
            const newCost = candidate.cost + maze.items[turnLeftNext.row][turnLeftNext.col]
            if (checkAndSetCache(turnLeftNext, turnLeftDirection, newCost)) {
                candidates.push({
                    steps: [...steps, {
                        row: turnLeftNext.row,
                        col: turnLeftNext.col,
                        direction: turnLeftDirection
                    }],
                    cost: newCost
                })
            }
        }

        const turnRightDirection = turnRight[lastStep.direction]
        const turnRightNext = moveForward(lastStep, turnRightDirection, maze)
        if (turnRightNext && !alreadyVisited(turnRightNext, steps)) {
            const newCost = candidate.cost + maze.items[turnRightNext.row][turnRightNext.col]
            if (checkAndSetCache(turnRightNext, turnRightDirection, newCost)) {
                candidates.push({
                    steps: [...steps, {
                        row: turnRightNext.row,
                        col: turnRightNext.col,
                        direction: turnRightDirection
                    }],
                    cost: newCost
                })
            }
        }

        candidates.sort((a, b) => a.cost - b.cost)
        if (candidates.length % 1000 === 0) {
            // console.log('attempting to prune candidates')
            // const pruned = candidates.filter(candidate => !hasLoop(candidate.steps))
            // console.log(`removed ${candidates.length - pruned.length} loops, left with ${pruned.length}`)
            // candidates = pruned
            console.log(candidates.length)
        }
    }

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
        console.log(render(maze, bestSolution.steps))
    })

    // console.log(bestSolution.steps)

    return bestSolution.cost
}
