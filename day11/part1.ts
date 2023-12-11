import input from './input';
import type { Coordinate } from '../utils/types'

type Image = {
    rows: number,
    cols: number,
    galaxies: Coordinate[]
}

const render = (img: Image): string => {
    let output = ''
    const galaxyMap: { [row in number]: { [col in number]: string }} = {}

    for (const galaxy of img.galaxies) {
        galaxyMap[galaxy.row] ??= {}
        galaxyMap[galaxy.row][galaxy.col] = '#'
    }

    for (let row = 0; row <= img.rows; row += 1) {
        for (let col = 0; col <= img.cols; col += 1) {
            output += galaxyMap[row]?.[col] ?? '.'
        }
        output += '\n'
    }
    return output
}

const expand = (img: Image): Image => {
    const rowsToExpand: Set<number> = new Set(new Array(img.rows).fill(0).map((_, idx) => idx))
    const colsToExpand: Set<number> =  new Set(new Array(img.cols).fill(0).map((_, idx) => idx))

    for (const galaxy of img.galaxies) {
        rowsToExpand.delete(galaxy.row)
        colsToExpand.delete(galaxy.col)
    }

    const expandedImage = {
        rows: img.rows + rowsToExpand.size - 1, // why?
        cols: img.cols + colsToExpand.size - 1,
        galaxies: [] as Coordinate[]
    }

    const rowsList = Array.from(rowsToExpand)
    const colsList = Array.from(colsToExpand)

    for (const galaxy of img.galaxies) {
        const rowIncrement = rowsList.filter(row => galaxy.row > row).length
        const colIncrement = colsList.filter(col => galaxy.col > col).length
        expandedImage.galaxies.push({
            row: galaxy.row + rowIncrement,
            col: galaxy.col + colIncrement
        })
    }

    return expandedImage
}

export default () => {
    const lines = input.split('\n')
    const image: Image = {
        rows: lines.length,
        cols: lines[0].length,
        galaxies: []
    }

    for (let row = 0; row < image.rows; row += 1) {
        const rowLine = lines[row]
        for (let col = 0; col < image.cols; col += 1) {
            const char = rowLine[col]
            if (char === '#') {
                image.galaxies.push({ row, col })
            }
        }
    }

    console.log(render(image))

    const expandedImage = expand(image)
    console.log(render(expandedImage))
    let sum = 0

    for (let g1 = 0; g1 < expandedImage.galaxies.length; g1 += 1) {
        for (let g2 = g1+1; g2 < expandedImage.galaxies.length; g2 += 1) {
            const gal1 = expandedImage.galaxies[g1]
            const gal2 = expandedImage.galaxies[g2]
            const distance = Math.abs(gal1.row - gal2.row) + Math.abs(gal1.col - gal2.col)
            console.log(`Between galaxy ${g1+1} and galaxy ${g2+1}: ${distance}`)
            sum += distance
        }
    }

    return sum
}
