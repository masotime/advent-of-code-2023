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
        let rockStopRow = -1; // ***EXTREME: SOUTH
        for (let row = map.rows - 1; row >= 0; row -= 1) { // ***scan DOWN
            const item = map.items[row][col]
            if (item === 'O' && row < rockStopRow) { // check direction <
                // we can move the item to where the rockStopRow is
                map.items[rockStopRow][col] = 'O'
                map.items[row][col] = '.'

                // we have to move the row to where the O rock moved to
                // and restart the process
                row = rockStopRow
                
                rockStopRow = rockStopRow - 1 // ***ROCKSTOP goes BELOW it

            } else if (item === '#' || item === 'O') {
                // *** the rockStopCol must be at least BELOW it
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

const slideSouth = (map: Map): Map => {
    // scan column by column
    for (let col = 0; col < map.cols; col += 1) {
        // keep track of where a rock would stop
        let rockStopRow = map.rows; // EXTREME: NORTH
        for (let row = 0; row < map.rows; row += 1) { // scan UP (NORTH)
            const item = map.items[row][col]
            if (item === 'O' && row > rockStopRow) { // *** check direction >
                // we can move the item to where the rockStopRow is
                map.items[rockStopRow][col] = 'O'
                map.items[row][col] = '.'

                // we have to move the row to where the O rock moved to
                // and restart the process
                row = rockStopRow

                rockStopRow = rockStopRow + 1 // ROCKSTOP goes ABOVE it

            } else if (item === '#' || item === 'O') {
                // *** the rockStopCol must be at least ABOVE it
                rockStopRow = row + 1
            } else if (item === '.') {
                // *** if the rockStopRow is higher than this (initial setting?), move it here
                if (rockStopRow > row) {
                    rockStopRow = row
                }
            }
        }
    }

    return map
}

const slideWest = (map: Map): Map => {
    // *** scan row by row
    for (let row = 0; row < map.rows; row += 1) {
        // keep track of where a rock would stop
        let rockStopCol = map.cols; // EXTREME: EAST
        for (let col = 0; col < map.cols; col += 1) { // scan RIGHT (EAST)
            const item = map.items[row][col]
            if (item === 'O' && col > rockStopCol) { // *** check direction >
                // we can move the item to where the rockStopRow is
                map.items[row][rockStopCol] = 'O'
                map.items[row][col] = '.'

                // we have to move the col to where the O rock moved to
                // and restart the process
                col = rockStopCol

                rockStopCol = rockStopCol + 1 // ROCKSTOP goes EAST of it
            } else if (item === '#' || item === 'O') {
                // *** the rockStopCol must be at least EAST of it
                rockStopCol = col + 1
            } else if (item === '.') {
                // *** if the rockStopCol is higher than this (initial setting?), move it here
                if (rockStopCol > col) {
                    rockStopCol = col
                }
            }
        }
    }

    return map
}

const slideEast = (map: Map): Map => {
    // *** scan row by row
    for (let row = 0; row < map.rows; row += 1) {
        // keep track of where a rock would stop
        let rockStopCol = -1; // EXTREME: WEST
        for (let col = map.cols - 1; col >= 0; col -= 1) { // scan LEFT (WEST)
            const item = map.items[row][col]
            if (item === 'O' && col < rockStopCol) { // *** check direction <
                // we can move the item to where the rockStopRow is
                map.items[row][rockStopCol] = 'O'
                map.items[row][col] = '.'

                // we have to move the col to where the O rock moved to
                // and restart the process
                col = rockStopCol

                rockStopCol = rockStopCol - 1 // ROCKSTOP goes WEST of it
            } else if (item === '#' || item === 'O') {
                // *** the rockStopCol must be at least WEST of it
                rockStopCol = col - 1
            } else if (item === '.') {
                // *** if the rockStopCol is lower than this (initial setting?), move it here
                if (rockStopCol < col) {
                    rockStopCol = col
                }
            }
        }
    }

    return map
}

const cycle = (map: Map): Map => {
    slideNorth(map)
    slideWest(map)
    slideSouth(map)
    slideEast(map)

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

type Cache = {
    [key in string]: number
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

    console.log('===== INITIAL =====')
    console.log(map)
    console.log(render(map))

    const cache: Cache = {}
    const cycleMap: {
        [cycle in number]: number
    } = {}

    const GOAL = 1000000000
    for (let round = 0; round < 1000000000; round += 1) {
        // if (round % 1000000 === 0) {
        //     console.log(`After ${round+1} cycle(s):`)
        // }
        cycle(map)
        const key = render(map)
        cycleMap[round + 1] = calculateLoad(map)
        console.log(`Cycle ${round + 1} load:`, cycleMap[round+1])

        if (cache[key]) {
            console.log(`same key detected after ${round + 1} cycles. It looks like it was last seen after ${cache[key]} cycles`)
            const modulo = round + 1 - cache[key]
            const offset = cache[key]
            console.log(`ergo, expecting (n - ${offset}) % modulo + ${offset} to give the answer`)
            const equivalentRound = (GOAL - offset) % modulo + offset
            const equivalentLoad = cycleMap[equivalentRound]
            console.log(`equivalent round = ${equivalentRound} which has a load of ${equivalentLoad}`)
            return equivalentLoad
        }
        
        cache[key] = round + 1

        // console.log(render(map))
    }    
    
    const totalLoad = calculateLoad(map)
    return totalLoad
}
