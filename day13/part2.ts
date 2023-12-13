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
        // console.log('verifying', l, r)
        if (lines[l] !== lines[r]) {
            // console.log('failed verification!', lines[l], lines[r])
            return false
        }
    }

    return true
}

function getPotentialSmudge(line1: string, line2: string): number | undefined {
    const chars1 = line1.split('')
    const chars2 = line2.split('')

    let differences = 0
    let diffIdx = -1
    for (let c = 0; c < chars1.length; c += 1) {
        if (chars1[c] !== chars2[c]) {
            differences += 1
            diffIdx = c
        }
    }

    if (differences === 1) {
        return diffIdx
    }
}

function generateAlteredLines(lines: string[]): string[][] {
    const result: string[][] = []
    for (let idx = 0; idx < lines.length; idx += 1) {
        for (let idx2 = idx + 1; idx2 < lines.length; idx2 += 1) {
            const smudgeIdx = getPotentialSmudge(lines[idx], lines[idx2])
            if (smudgeIdx !== undefined) {
                // try swapping both ways
                let alteredLine1 = lines[idx].split('')
                alteredLine1[smudgeIdx] = alteredLine1[smudgeIdx] === '.' ? '#' : '.'                
                const alteredLines1 = [...lines]
                alteredLines1[idx] = alteredLine1.join('')
                result.push(alteredLines1)

                let alteredLine2 = lines[idx2].split('')
                alteredLine2[smudgeIdx] = alteredLine2[smudgeIdx] === '.' ? '#' : '.'                
                const alteredLines2 = [...lines]
                alteredLines2[idx2] = alteredLine2.join('')
                result.push(alteredLines2)
            }
        }
    }

    return result
}

function findReflections(lines: string[]): number[] {
    let idx = 0
    const potentialLines = []
    const reflectionIndexes: number[] = []
    while (idx < lines.length - 1) {
        if (lines[idx] === lines[idx + 1]) {
            potentialLines.push(idx)
        }
        idx += 1
    }

    potentialLines.forEach((idx) => {
        if (verifyReflection(lines, idx)) {
            console.log(`Found mirror image at lines ${idx}, ${idx + 1}`)
            reflectionIndexes.push(idx)
        }
    })

    return reflectionIndexes
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
    let altTotal = 0
    for (const map of maps) {
        // scan for mirror images in rows
        // let idx = 0
        let patternNote = 0
        let altPatternNote = 0
        console.log(visualize(map))
        console.log('------------')
        console.log('ROW ANALYSIS')
        console.log('------------')
        const rowReflectionIndexs = findReflections(map.rows)

        if (rowReflectionIndexs.length > 0) {
            console.log(`Found ${rowReflectionIndexs} mirror image(s) at rows ${rowReflectionIndexs.map(idx => `${idx}, ${idx+1}`).join('|')}`)
            for (const rowReflectionIdx of rowReflectionIndexs) {
                patternNote += (rowReflectionIdx + 1) * 100
            }
        }

        console.log('🙄 Alternate discoveries')
        const alteredRowLines = generateAlteredLines(map.rows)
        for (const altRows of alteredRowLines) {
            for (const row of altRows) {
                console.log(row)
            }
            console.log('------')
            const altRowReflectionIndexes = findReflections(altRows)

            // get at least one that doesn't match the previous one
            console.log({ altRowReflectionIndexes })
            const newRowIndexes = altRowReflectionIndexes.filter(idx => !rowReflectionIndexs.includes(idx))
            if (newRowIndexes.length > 1) {
                throw new Error('wtf')
            }
            if (newRowIndexes.length === 1) {
                console.log(`🔥 Foudn alternate row reflection at rows ${newRowIndexes[0]}, ${newRowIndexes[0]+1}`)
                altPatternNote += (newRowIndexes[0] + 1) * 100
                break;
            }
            console.log('--------')
        }

        console.log('------------')
        console.log('COL ANALYSIS')
        console.log('------------')

        const colReflectionIndexs = findReflections(map.columns)
        if (colReflectionIndexs.length > 0) {
            console.log(`Found mirror image at cols ${colReflectionIndexs.map(idx => `${idx}, ${idx+1}`).join('|')}`)
            for (const colReflectionIdx of colReflectionIndexs) {
                patternNote += (colReflectionIdx + 1)
            }
        }

        console.log('🙄 Alternate discoveries')
        const alteredColLines = generateAlteredLines(map.columns)
        for (const altCols of alteredColLines) {
            // for (const col of altCols) {
            //     console.log(row)
            // }
            console.log('------')
            const altColReflectionIndexes = findReflections(altCols)

            // get at least one that doesn't match the previous one
            console.log({ altColReflectionIndexes })
            const newColIndexes = altColReflectionIndexes.filter(idx => !colReflectionIndexs.includes(idx))
            if (newColIndexes.length > 1) {
                throw new Error('wtf')
            }
            if (newColIndexes.length === 1) {
                console.log(`🔥 Foudn alternate col reflection at cols ${newColIndexes[0]}, ${newColIndexes[0]+1}`)
                altPatternNote += (newColIndexes[0] + 1)
                break;
            }
            console.log('--------')
        }

        console.log(`Pattern note`, patternNote)
        console.log(`Alt Pattern note`, altPatternNote)
        total += patternNote
        altTotal += altPatternNote
    }

    return altTotal
}
