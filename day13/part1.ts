import input from './input';

type Map = {
    columns: string[],
    rows: string[]
}

function visualize(map: Map): string {
    let output = ''
    for (let r = 0; r < map.rows.length; r += 1) {
        output += map.rows[r] + '\n'
    }
    return output
}

function verifyReflection(lines: string[], startIdx: number): boolean {    
    for (let l = startIdx, r = startIdx + 1; l >= 0 && r < lines.length; l -= 1, r += 1) {
        console.log('verifying', l, r)
        if (lines[l] !== lines[r]) {
            console.log('failed verification!', lines[l], lines[r])
            return false
        }
    }

    return true
}

export default () => {
    const images = [...input.matchAll(/([#\.]+(\n|$))+/gm)].map(_ => _[0].trim())
    const maps: Map[] = []

    for (const image of images) {
        const rows = image.split('\n')
        
        const columns: string[] = []
        for (let c = 0; c < rows[0].length; c += 1) {
            let column = ''
            for (let r = 0; r < rows.length; r += 1) {
                column += rows[r][c]
            }
            columns.push(column)
        }

        const map: Map = {
            rows,
            columns
            // items: {}
        }

        // console.log(map)
        
        maps.push(map)
    }
    
    let total = 0
    for (const map of maps) {
        // scan for mirror images in rows
        let idx = 0
        let patternNote = 0
        console.log(visualize(map))
        console.log('checking row mirror images')
        const potentialRows = []
        while (idx < map.rows.length - 1) {
            if (map.rows[idx] === map.rows[idx + 1]) {
                potentialRows.push(idx)
            }
            idx += 1
        }

        console.log(`Found ${potentialRows.length} potential row mirror images`)
        
        potentialRows.forEach((idx) => {
            if (verifyReflection(map.rows, idx)) {
                console.log(`Found mirror image at rows ${idx}, ${idx + 1}`)
                patternNote += (idx + 1) * 100
            }
        })

        
        idx = 0
        console.log('checking column mirror images')
        const potentialCols = []
        while (idx < map.columns.length - 1) {
            if (map.columns[idx] === map.columns[idx + 1]) {
                potentialCols.push(idx)
            }
            idx += 1            
        }

        console.log(`Found ${potentialRows.length} potential row mirror images`)
        
        potentialCols.forEach((idx) => {
            if (verifyReflection(map.columns, idx)) {
                console.log(`Found mirror image at columns ${idx}, ${idx + 1}`)
                patternNote += (idx + 1)
            }
        })

        console.log(`Pattern note`, patternNote)
        total += patternNote
    }

    return total
}
