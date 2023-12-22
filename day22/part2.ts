import ansiColors from 'ansi-colors';
import input from './input';

type Range = {
    min: number,
    max: number
}

type Brick = {
    name: string
    x: Range,
    y: Range,
    z: Range,

}

type World = {
    bricks: Brick[],
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number
}

type Coordinate = {
    x: number,
    y: number,
}

function getName(index: number): string {
    // const baseCharCode = (i: number) => String.fromCharCode('A'.charCodeAt(0) + i)
    // const highestDigit = index > 26 * 26 ? baseCharCode(Math.floor(index / 26 / 26)) : ''
    // const upperDigit = index > 26 ? baseCharCode(Math.floor((index % (26 * 26)) / 26)) : ''
    // const lowerDigit = baseCharCode(index % 26)
    // return `${highestDigit}${upperDigit}${lowerDigit}`
    return String.fromCharCode('A'.charCodeAt(0) + index)
}



function rangesOverlap(range1: Range, range2: Range): boolean {
    // overlap when either a min or max is in the other range, or one range's
    // min and max and both smaller and larger than the other's (i.e. fully contained)
    const oneInRange = range1.min >= range2.min && range1.min <= range2.max || range1.max >= range2.min && range1.max <= range2.max
    const fullyEncloses = range1.min <= range2.min && range1.max >= range2.max || range2.min <= range1.min && range2.max >= range1.max

    return oneInRange || fullyEncloses
}

function bricksOverlap(brick1: Brick, brick2: Brick): boolean {
    // generate all coordinates
    let brick1Coords: Coordinate[] = []

    for (let x = brick1.x.min; x <= brick1.x.max; x += 1) {
        for (let y = brick1.y.min; y <= brick1.y.max; y += 1) {
            brick1Coords.push({ x, y })
        }
    }

    // console.log(`Brick ${brick1.name} coords are ${JSON.stringify(brick1Coords)}`)

    for (let x2 = brick2.x.min; x2 <= brick2.x.max; x2 += 1) {
        for (let y2 = brick2.y.min; y2 <= brick2.y.max; y2 += 1) {
            // console.log('comparing against', { x2, y2, z2 })
            if (brick1Coords.some(({ x, y }) => x === x2 && y === y2)) {
                return true
            }
        }
    }

    return false
}

function render(w: World): string {
    let xOutput = ''
    let yOutput = ''
    const zMax = w.bricks[w.bricks.length - 1].z.max

    console.log('xz', zMax, w.xMin, w.xMax)
    // fix y to 0
    for (let z = zMax; z >= 0; z -= 1) {
        for (let x = w.xMin; x <= w.xMax; x += 1) {
            // inefficient but can't be bothered
            let bricksVisible = []
            for (const brick of w.bricks) {
                if (
                    rangesOverlap({ min: x, max: x }, brick.x) &&
                    rangesOverlap({ min: z, max: z }, brick.z) &&
                    rangesOverlap({ min: 0, max: w.yMax }, brick.y)) {
                    bricksVisible.push(brick)
                }
            }
            const frontBrick = bricksVisible.sort((a, b) => a.y.min - b.y.min)[0]
            const name = (frontBrick?.name && bricksVisible.length > 1) ? ansiColors.whiteBright(frontBrick.name) : frontBrick?.name
            xOutput += name ?? (z === 0 ? '-' : '.')
        }
        xOutput += ` ${z}\n`
    }

    // fix x to 0
    for (let z = zMax; z >= 0; z -= 1) {
        for (let y = w.yMin; y <= w.yMax; y += 1) {
            // inefficient but can't be bothered
            let bricksVisible = []
            for (const brick of w.bricks) {
                if (
                    rangesOverlap({ min: y, max: y }, brick.y) &&
                    rangesOverlap({ min: z, max: z }, brick.z) &&
                    rangesOverlap({ min: 0, max: w.xMax }, brick.x)) {
                    bricksVisible.push(brick)
                }
            }
            const frontBrick = bricksVisible.sort((a, b) => a.x.min - b.x.min)[0]
            const name = (frontBrick?.name && bricksVisible.length > 1) ? ansiColors.whiteBright(frontBrick.name) : frontBrick?.name
            yOutput += name ?? (z === 0 ? '-' : '.')
        }
        yOutput += ` ${z}\n`
    }


    return `xz-facing\n${xOutput}\n\nyz-facing\n${yOutput}`

}

function fallBricks(world: World, debug?: boolean): string[] {
    // now solve the bricks falling, lowest to highest
    const bricksFallen: string[] = []
    for (let brickIndex = 0; brickIndex < world.bricks.length; brickIndex += 1) {
        // search for all bricks that might be blocking this brick at the bottom
        const brick = world.bricks[brickIndex]
        debug && console.log(`making brick ${brick.name} fall, which has z=(${brick.z.min} - ${brick.z.max})`)

        let zSettled = 1
        for (let bottomBrickIndex = 0; bottomBrickIndex < brickIndex; bottomBrickIndex += 1) {
            const bottomBrick = world.bricks[bottomBrickIndex]
            if (rangesOverlap(brick.x, bottomBrick.x) && rangesOverlap(brick.y, bottomBrick.y)) {
                // if (bricksOverlap(brick, bottomBrick)) {
                zSettled = Math.max(zSettled, bottomBrick.z.max + 1) // i.e. it has to rest on top of this brick     
                debug && console.log(`${brick.name} must be above ${bottomBrick.name} with z of ${bottomBrick.z.max}`)
            }
        }

        // just use the last zSettled
        const displacement = brick.z.min - zSettled
        if (displacement !== 0) {
            debug && console.log(`Looks like we need to displace brick ${brick.name}`)
            bricksFallen.push(brick.name)
        }
        brick.z.min -= displacement
        brick.z.max -= displacement
        // validateWorldState(world)
        debug && console.log(`brick ${brick.name} has settled at z=(${brick.z.min} - ${brick.z.max})`)
    }

    return bricksFallen
}

function validateWorldState(w: World): boolean {
    for (let b1 = 0; b1 < w.bricks.length; b1 += 1) {
        const brick1 = w.bricks[b1]
        for (let b2 = b1 + 1; b2 < w.bricks.length; b2 += 1) {
            const brick2 = w.bricks[b2]
            if (rangesOverlap(brick1.x, brick2.x) && rangesOverlap(brick1.y, brick2.y) && rangesOverlap(brick1.z, brick2.z)) {
                throw new Error(`Bricks ${brick1.name} and ${brick2.name} overlap, wtf!`)

            }
        }
    }

    return true;
}

export default () => {
    const lines = input.split('\n')
    const world: World = {
        bricks: [],
        xMin: Number.MAX_SAFE_INTEGER,
        yMin: Number.MAX_SAFE_INTEGER,
        xMax: Number.MIN_SAFE_INTEGER,
        yMax: Number.MIN_SAFE_INTEGER
    }

    for (let l = 0; l < lines.length; l += 1) {
        const line = lines[l]
        const name = getName(l)
        const { groups } = /^(?<c1>[^~]+)~(?<c2>[^~]+)$/.exec(line) || {}
        if (!groups?.c1 || !groups.c2) {
            throw new Error(`Failed to parse ${line}`)
        }

        const [xMin, yMin, zMin] = groups.c1.split(',').map(_ => parseInt(_))
        const [xMax, yMax, zMax] = groups.c2.split(',').map(_ => parseInt(_))

        if (xMin > xMax || yMin > yMax || zMin > zMax) {
            throw new Error(`Unexpected brick ${line}`)
        }

        if (yMax > yMin && xMax > xMin || zMax > zMin && xMax > xMin || zMax > zMin && yMax > yMin) {
            throw new Error(`Unexpected brick ${line}`)
        }

        world.bricks.push({
            name,
            x: {
                min: xMin,
                max: xMax
            },
            y: {
                min: yMin,
                max: yMax
            },
            z: {
                min: zMin,
                max: zMax
            },
        })

        world.xMin = Math.min(world.xMin, xMin)
        world.yMin = Math.min(world.yMin, yMin)
        world.xMax = Math.max(world.xMax, xMax)
        world.yMax = Math.max(world.yMax, yMax)
    }

    world.bricks.sort((a, b) => {
        // return a.z.min - b.z.min
        if (a.z.min !== b.z.min) {
            return a.z.min - b.z.min
        } else if (a.y.min !== b.y.min) {
            return a.y.min - b.y.min
        } else {
            return a.x.min - b.x.min
        }
    })

    // console.log(world.xMin, world.xMax, world.yMin, world.yMax)
    console.log(render(world))
    validateWorldState(world)
    // console.log(world.bricks.length)

    console.log(ansiColors.cyanBright('Initial fall!'))

    const bricksFallen = fallBricks(world)

    console.log(render(world))
    validateWorldState(world)
    console.log(`After settling, note that the following bricks fell:`, bricksFallen.join(','))


    let totalDesintegrated = 0
    for (const brickToDisintegrate of world.bricks) {
        // try disintegrating each brick and simulating falls
        // console.log(ansiColors.redBright(`Going to disintegrate ${brickToDisintegrate.name}`))
        const disintegrated: World = {
            ...world,
            // note: need to clone the bricks
            bricks: JSON.parse(JSON.stringify(world.bricks.filter(brick => brick.name !== brickToDisintegrate.name))),
        }

        const bricksFallenAfterDisintegration = fallBricks(disintegrated)
        validateWorldState(disintegrated)
        totalDesintegrated += bricksFallenAfterDisintegration.length
        console.log(ansiColors.redBright(`Without ${brickToDisintegrate.name}, ${bricksFallenAfterDisintegration.length} bricks fell.`))
        // console.log(render(disintegrated)) 
    }

    console.log(`A total of ${totalDesintegrated} bricks would have fallen`)


    return totalDesintegrated
}
