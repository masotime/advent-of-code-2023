import input from './input';
import type { Coordinate } from '../utils/types'

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

function render(m: Maze): string {
    let output = ''
    for (let r = 0; r < m.rows; r += 1) {
        for (let c = 0; c < m.cols; c += 1) {
            const item = m.items[r][c].item
            const beams = m.items[r][c].beams
            const beamCount = beams.length
            output += item !== '.' ? item : beamCount > 9 ? '#' : beamCount > 1 ? beamCount : beamCount === 1 ? beams[0].direction : item
        }
        output += '\n'
    }

    return output
}

const isOutOfBounds = (c: Coordinate, m: Maze): boolean => {
    if (c.row < 0 || c.row >= m.rows) return true;
    if (c.col < 0 || c.col >= m.cols) return true;
    return false;
}

const nextPosition = (c: Coordinate, d: Direction): Coordinate => {
    switch (d) {
        case '^': return { row: c.row - 1, col: c.col };
        case 'v': return { row: c.row + 1, col: c.col };
        case '<': return { row: c.row, col: c.col - 1 };
        case '>': return { row: c.row, col: c.col + 1 };
    }
}

function addBeamHead(m: Maze, beamHeads: BeamHead[], { row, col}: {row: number, col: number}, direction: Direction) {
    const key = `${row}|${col}|${direction}`

    if (!m.beamHeadRecords[key]) {
        // this is the only situation to add it
        m.beamHeadRecords[key] = true
        beamHeads.push({ row, col, direction })
    }
}

function simulate(m: Maze): Maze {
    const nextBeamHeads: BeamHead[] = []
    for (const beamHead of m.beamHeads) {
        const { row, col } = nextPosition({ row: beamHead.row, col: beamHead.col }, beamHead.direction)
        if (isOutOfBounds({ row, col }, m)) continue;

        const nextItem = m.items[row][col].item
        switch (nextItem) {
            case '.': 
                addBeamHead(m, nextBeamHeads, { row, col }, beamHead.direction)
                m.items[row][col].beams.push({ direction: beamHead.direction })
                break;
            case '|': 
                if (beamHead.direction === '>' || beamHead.direction === '<') {
                    addBeamHead(m, nextBeamHeads, { row, col }, '^')
                    addBeamHead(m, nextBeamHeads, { row, col }, 'v')
                    m.items[row][col].beams.push({ direction: '^' }, { direction: 'v' })
                } else {
                    // continue normally
                    addBeamHead(m, nextBeamHeads, { row, col }, beamHead.direction)
                    m.items[row][col].beams.push({ direction: beamHead.direction })    
                }
                break;
            case '-':
                if (beamHead.direction === '^' || beamHead.direction === 'v') {
                    addBeamHead(m, nextBeamHeads, { row, col }, '>')
                    addBeamHead(m, nextBeamHeads, { row, col }, '<')
                    m.items[row][col].beams.push({ direction: '<' }, { direction: '>' })
                } else {
                    // continue normally
                    addBeamHead(m, nextBeamHeads, { row, col }, beamHead.direction)
                    m.items[row][col].beams.push({ direction: beamHead.direction })    
                }
                break;
            case '\\':                
                switch (beamHead.direction) {
                    case '>':
                        // > goes down
                        addBeamHead(m, nextBeamHeads, { row, col }, 'v')                        
                        m.items[row][col].beams.push({ direction: 'v' })
                        break;
                    case '<':
                        // < goes up
                        addBeamHead(m, nextBeamHeads, { row, col }, '^')                        
                        m.items[row][col].beams.push({ direction: '^' })
                        break;
                    case '^':
                        // ^ goes left
                        addBeamHead(m, nextBeamHeads, { row, col }, '<')
                        m.items[row][col].beams.push({ direction: '<' })
                        break;
                    case 'v':
                        // v goes right
                        addBeamHead(m, nextBeamHeads, { row, col }, '>')
                        m.items[row][col].beams.push({ direction: '>' })
                        break;
                }
                break;
            case '/':
                switch (beamHead.direction) {
                    case '>':
                        // > goes up
                        addBeamHead(m, nextBeamHeads, { row, col }, '^')
                        m.items[row][col].beams.push({ direction: '^' })
                        break;
                    case '<':
                        // < goes down
                        addBeamHead(m, nextBeamHeads, { row, col }, 'v')
                        m.items[row][col].beams.push({ direction: 'v' })
                        break;
                    case '^':
                        // ^ goes right
                        addBeamHead(m, nextBeamHeads, { row, col }, '>')
                        m.items[row][col].beams.push({ direction: '>' })
                        break;
                    case 'v':
                        // v goes left
                        addBeamHead(m, nextBeamHeads, { row, col }, '<')
                        m.items[row][col].beams.push({ direction: '<' })
                        break;
                }
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

export default () => {
    const lines = input.split('\n')
    const maze: Maze = {
        rows: lines.length,
        cols: lines[0].length,
        items: {},
        beamHeads: [{ row: 0, col: -1, direction: '>' }],
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

    maze.items[0][0].beams.push({ direction: '>'})

    console.log(render(maze))

    while(maze.beamHeads.length > 0) {
        // console.log(render(maze))
        simulate(maze)
        console.log(maze.beamHeads.length)
    }

    console.log(render(maze))

    return getEnergized(maze)
}
