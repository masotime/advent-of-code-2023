import input from './input';
import type { Coordinate } from '../utils/types'
import ansi from 'ansi-colors'

type Direction = '^' | 'v' | '>' | '<'
type Item = '|' | '-' | '/' | '\\' | '.'

type Beam = {
    direction: Direction
}

type BeamHead = {
    direction: Direction,
    row: number,
    col: number
}

type Maze = {
    rows: number,
    cols: number,
    items: {
        [row in number]: {
            [col in number]: {
                item: Item
                beams: Beam[]
            }
        }
    },
    beamHeads: BeamHead[],
    beamHeadRecords: {
        [key in string]: boolean
    }
}

const decorate = (char: string | number ) => ansi.whiteBright.bold(char.toString())

function render(m: Maze): string {
    let output = ''
    for (let r = 0; r < m.rows; r += 1) {
        for (let c = 0; c < m.cols; c += 1) {
            const item = m.items[r][c].item
            const beams = m.items[r][c].beams
            const beamCount = beams.length
            output += item !== '.' ? item : beamCount > 1 ? decorate(beamCount) : beamCount === 1 ? decorate(beams[0].direction) : item
        }
        output += '\n'
    }

    return output
}

const isOutOfBounds = (c: Coordinate, m: Maze): boolean => {
    return (c.row < 0 || c.row >= m.rows || c.col < 0 || c.col >= m.cols);
}

const nextPosition = ({ row, col, direction }: BeamHead): Coordinate => {
    switch (direction) {
        case '^': return { row: row - 1, col };
        case 'v': return { row: row + 1, col };
        case '<': return { row, col: col - 1 };
        case '>': return { row, col: col + 1 };
    }
}

function addBeamHead(m: Maze, beamHeads: BeamHead[], { row, col }: Coordinate, directions: Direction[]) {
    for (const direction of directions) {
        const key = `${row}|${col}|${direction}`

        if (!m.beamHeadRecords[key]) {
            // this is the only situation to add it
            m.beamHeadRecords[key] = true
            m.items[row][col].beams.push({ direction })
            beamHeads.push({ row, col, direction })
        }
    }
}

const backslashReflect: { [d in Direction]: Direction } = {
    '>': 'v',
    '<': '^',
    '^': '<',
    'v': '>'
}

const forwardslashReflect: { [d in Direction]: Direction } = {
    '>': '^',
    '<': 'v',
    '^': '>',
    'v': '<'
}

function simulate(m: Maze): Maze {
    const nextBeamHeads: BeamHead[] = []
    for (const beamHead of m.beamHeads) {
        const coord = nextPosition(beamHead)
        if (isOutOfBounds(coord, m)) continue;

        const { direction } = beamHead
        const nextItem = m.items[coord.row][coord.col].item
        switch (nextItem) {
            case '.': 
                addBeamHead(m, nextBeamHeads, coord, [direction])
                break;
            case '|':
                const isLeftRight = ['<', '>'].includes(direction)
                addBeamHead(m, nextBeamHeads, coord, isLeftRight ? ['^', 'v'] : [direction])
                break;
            case '-':
                const isUpDown = ['^', 'v'].includes(beamHead.direction)
                addBeamHead(m, nextBeamHeads, coord, isUpDown ? ['>', '<'] : [direction])
                break;
            case '\\':
                addBeamHead(m, nextBeamHeads, coord, [backslashReflect[beamHead.direction]])
                break;
            case '/':
                addBeamHead(m, nextBeamHeads, coord, [forwardslashReflect[beamHead.direction]])
                break;
        }
        
    }

    // all beamheads iterated, now set the new beamheads
    m.beamHeads = nextBeamHeads
    return m;
}

function getEnergized(m: Maze): number {
    let energized = 0;
    for (let r = 0; r < m.rows; r += 1) {
        for (let c = 0; c < m.cols; c += 1) {
            if (m.items[r][c].beams.length > 0) {
                energized += 1
            }
        }
    }

    return energized
}

function resetMaze(m: Maze): Maze {
    for (let r = 0; r < m.rows; r += 1) {
        for (let c = 0; c < m.cols; c += 1) {
            m.items[r][c].beams = []
        }
    }

    m.beamHeads = []
    m.beamHeadRecords = {}
    return m;
}

export default () => {
    const lines = input.split('\n')
    const maze: Maze = {
        rows: lines.length,
        cols: lines[0].length,
        items: {},
        beamHeads: [],
        beamHeadRecords: {}
    }

    for (let row = 0; row < maze.rows; row += 1) {
        const line = lines[row]
        for (let col = 0; col < maze.cols; col += 1) {
            maze.items[row] = maze.items[row] || []
            maze.items[row][col] = {
                item: line[col] as Item,
                beams: []
            }
        }
    }

    // generate all the possible entry points
    const entries: BeamHead[] = []
    let mostEnergized = 0
    
    for (let row = 0; row <= maze.rows; row += 1) {
        // left, right wall entry
        entries.push({ col: -1, row, direction: '>' })
        entries.push({ col: maze.cols, row, direction: '<' })
    }

    for (let col = 0; col <= maze.cols; col += 1) {
        // top, bottom wall entry
        entries.push({ col, row: -1, direction: 'v' })
        entries.push({ col, row: maze.rows, direction: '^' })
    }

    for (const entry of entries) {
        resetMaze(maze)
        maze.beamHeads.push(entry)
        while(maze.beamHeads.length > 0) {
            simulate(maze)
        }
        
        const energizedCount = getEnergized(maze)
        console.log(`🔥 Entering in from [${entry.row}, ${entry.col}] ${entry.direction}: ${energizedCount}`)
        console.log(render(maze))
        mostEnergized = Math.max(mostEnergized, energizedCount)
    }

    return mostEnergized
}
