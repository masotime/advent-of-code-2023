import { Coordinate } from '../utils/types';
import input from './input';

type Map = {
    maxCols: number,
    maxRows: number
    nodes: { [row in number]: {
        [col in number]: string
    } }
}

const render = (m: Map): string => {
    let output = ''
    for (let row = 0; row <= m.maxRows; row += 1) {
        for (let col = 0; col <= m.maxCols; col += 1) {
            output += m.nodes?.[row]?.[col] || '.'
        }
        output += '\n'
    }
    return output
}



export default () => {
    const lines = input.split('\n')
    const map: Map = {
        maxCols: lines[0].length - 1,
        maxRows: lines.length - 1,
        nodes: {}
    }

    let sLocation: Coordinate | undefined = undefined

    for (let row = 0; row <= map.maxRows; row += 1) {
        const rowLine = lines[row]
        for (let col = 0; col <= map.maxCols; col += 1) {
            map.nodes[row] = map.nodes[row] || []
            map.nodes[row][col] = rowLine[col]
            if (rowLine[col] === 'S') {
                sLocation = { row, col }
            }
        }
    }

    if (!sLocation) {
        throw new Error(`Could not find start!`)
    }

    console.log(render(map), sLocation)

    type Candidate = {
        coordinate: Coordinate,
        distance: number
    }

    const candidateQueue: Candidate[] = [{ coordinate: sLocation, distance: 0 }]
    const distanceMap: Map = {
        maxCols: map.maxCols,
        maxRows: map.maxRows,
        nodes: {}
    }

    const connectors = {
        north: ['S', '|', 'L', 'J'],
        south: ['S', '|', '7', 'F'],
        east: ['S', '-', 'L', 'F'],
        west: ['S', '-', 'J', '7']
    }

    let lastCandidate: Candidate | undefined = undefined

    while (candidateQueue.length > 0) {
        const currentCandidate = candidateQueue.shift()!
        lastCandidate = currentCandidate
        const { row, col } = currentCandidate.coordinate
        const candidateChar = map.nodes[row][col]
        distanceMap.nodes[row] = distanceMap.nodes[row] || []
        distanceMap.nodes[row][col] = currentCandidate.distance.toString()

        if (connectors.north.includes(candidateChar)) {
            const up = { row: row - 1, col }
            const upChar = map.nodes?.[up.row]?.[up.col]

            // only if connector has south connection + not explored
            if (connectors.south.includes(upChar) && distanceMap.nodes?.[up.row]?.[up.col] === undefined) {
                candidateQueue.push({
                    coordinate: up,
                    distance: currentCandidate.distance + 1
                })
            }
        }

        if (connectors.south.includes(candidateChar)) {
            const down = { row: row + 1, col }
            const downChar = map.nodes?.[down.row]?.[down.col]

            // only if connector has north connection
            if (connectors.north.includes(downChar) && distanceMap.nodes?.[down.row]?.[down.col] === undefined) {
                candidateQueue.push({
                    coordinate: down,
                    distance: currentCandidate.distance + 1
                })
            }
        }

        if (connectors.west.includes(candidateChar)) {
            const left = { row: row, col: col - 1 }
            const leftChar = map.nodes?.[left.row]?.[left.col]

            // only if connector has east connection
            if (connectors.east.includes(leftChar) && distanceMap.nodes?.[left.row]?.[left.col] === undefined) {
                candidateQueue.push({
                    coordinate: left,
                    distance: currentCandidate.distance + 1
                })
            }
        }

        if (connectors.east.includes(candidateChar)) {
            const right = { row: row, col: col + 1 }
            const rightChar = map.nodes?.[right.row]?.[right.col]

            // only if connector has west connection
            if (connectors.west.includes(rightChar) && distanceMap.nodes?.[right.row]?.[right.col] === undefined) {
                candidateQueue.push({
                    coordinate: right,
                    distance: currentCandidate.distance + 1
                })
            }
        }

        // console.log(render(distanceMap))
    }

    return lastCandidate?.distance
}
