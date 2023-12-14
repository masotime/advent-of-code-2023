import input from './input';

type Map = {
    rows: number,
    cols: number,
    items: {
        [row in number]: {
            [col in number]: string
        }
    }
}

const render = (map: Map): string => {
    let output = ''

    // because of the nature of the map, count from the top
    for (let row = map.rows - 1; row >= 0; row -= 1) {
        for (let col = 0; col < map.cols; col += 1) {
            output += map.items[row][col]
        }
        output += '\n'
    }

    return output
}

const slideNorth = (map: Map): Map => {
    // scan column by column
    for (let col = 0; col < map.cols; col += 1) {
        // keep track of where a rock would stop
        let rockStopRow = -1; // can't place it yet
        for (let row = map.rows - 1; row >= 0; row -= 1) {
            const item = map.items[row][col]
            if (item === 'O' && row < rockStopRow) {
                // we can move the item to where the rockStopRow is
                map.items[rockStopRow][col] = 'O'
                map.items[row][col] = '.'

                // we have to move the row to where the O rock moved to
                // and restart the process
                row = rockStopRow

                rockStopRow = rockStopRow - 1
            } else if (item === '#' || item === 'O') {
                // the rockStopCol must be at least after it
                rockStopRow = row - 1
            } else if (item === '.') {
                // if the rockStopRow is lower than this (can this happen?), move it here
                if (rockStopRow < row) {
                    rockStopRow = row
                }
            }
        }
    }

    return map
}

const calculateLoad = (map: Map): number => {
    let totalLoad = 0;
    for (let row = 0; row < map.rows; row += 1) {
        const load = row + 1
        for (let col = 0; col < map.cols; col += 1) {
            if (map.items[row][col] === 'O') {
                totalLoad += load
            }
        }
    }

    return totalLoad
}

export default () => {
    const lines = input.split('\n')    
    const map: Map = {
        rows: lines.length,
        cols: lines[0].length,
        items: {}
    }

    // count backwards
    let row = map.rows - 1

    for (const line of lines) {
        for (let col = 0; col < map.cols; col += 1) {
            map.items[row] = map.items[row] || []
            map.items[row][col] = line[col]
        }

        row -= 1
    }

    console.log(map)
    console.log(render(map))

    slideNorth(map)
    console.log(render(map))
    const totalLoad = calculateLoad(map)
    return totalLoad
}
