import ansiColors from 'ansi-colors';
import input from './sample';

type Vector = {
    x: number,
    y: number,
    z: number
}

type LinearEquation = {
    coefficient: number,
    offset: number
}

type Hailstone = {
    position: Vector,
    velocity: Vector,
    yAsX: LinearEquation,
    zAsX: LinearEquation,
}

const renderHailstone = (h: Hailstone): string => {
    return `${h.position.x}, ${h.position.y}, ${h.position.z} @ ${h.velocity.x}, ${h.velocity.y}, ${h.velocity.z}, y = ${h.yAsX.coefficient}x + ${h.yAsX.offset}`
}

const renderXy = (x: number, y: number) => {
    return `(at x=${x.toFixed(3)}, y=${y.toFixed(3)})`
}

export default () => {
    const hailstones: Hailstone[] = []
    for (const line of input.split('\n')) {
        const { groups } = /^(?<px>[\-0-9]+),\s+(?<py>[\-0-9]+),\s+(?<pz>[\-0-9]+)\s+@\s+(?<vx>[\-0-9]+),\s+(?<vy>[\-0-9]+),\s+(?<vz>[\-0-9]+)$/.exec(line) ?? {}
        if (!groups?.px || !groups.py || !groups.pz || !groups.vx || !groups.vy || !groups.vz) {
            throw new Error(`Could not parse ${line}`)
        }
        const position = {
            x: parseInt(groups.px),
            y: parseInt(groups.py),
            z: parseInt(groups.pz),
        }

        const velocity = {
            x: parseInt(groups.vx),
            y: parseInt(groups.vy),
            z: parseInt(groups.vz),
        }

        // do math
        const coefficientYasX = velocity.y / velocity.x
        const offsetYasX = position.y - position.x * velocity.y / velocity.x

        const coefficientZasX = velocity.z / velocity.x
        const offsetZasX = position.z - position.x * velocity.z / velocity.x

        hailstones.push({
            position,
            velocity,
            yAsX: { coefficient: coefficientYasX, offset: offsetYasX },
            zAsX: { coefficient: coefficientZasX, offset: offsetZasX }
        })
    }

    type GradientSource = {
        h1: number,
        h2: number,
        t1: number,
        t2: number,
    }

    type GradientMap = {
        [gradient in number]: {
            [intercept in string]: Set<number>
        }
    }

    const dydxMap: GradientMap = {}
    const dzdxMap: GradientMap = {}

    type Coordinate = {
        x: number,
        y: number,
        z: number
    }

    function setGradient({ t1, t2, h1, h2 }: { t1: number, t2: number, h1: number, h2: number }, h1Coordinate: Coordinate, h2Coordinate: Coordinate) {
        const dydx = (h2Coordinate.y - h1Coordinate.y) / (h2Coordinate.x - h1Coordinate.x)
        const dzdx = (h2Coordinate.z - h1Coordinate.z) / (h2Coordinate.x - h1Coordinate.x)
        const intercept: Coordinate = {
            x: h1Coordinate.x - t1 * (h2Coordinate.x - h1Coordinate.x) / (t2 - t1),
            y: h1Coordinate.y - t1 * (h2Coordinate.y - h1Coordinate.y) / (t2 - t1),
            z: h1Coordinate.z - t1 * (h2Coordinate.z - h1Coordinate.z) / (t2 - t1),
        }
        const interceptString = `(${intercept.x}, ${intercept.y}, ${intercept.z})`

        dydxMap[dydx] = dydxMap[dydx] || {}
        // dydxMap[dydx][interceptString] = dydxMap[dydx][interceptString] || []
        // dydxMap[dydx][interceptString].push({ h1, h2, t1, t2 })
        dydxMap[dydx][interceptString] = dydxMap[dydx][interceptString] ?? new Set<number>()
        dydxMap[dydx][interceptString].add(h1)
        dydxMap[dydx][interceptString].add(h2)

        dzdxMap[dzdx] = dzdxMap[dzdx] || {}
        dzdxMap[dzdx][interceptString] = dzdxMap[dzdx][interceptString] ?? new Set<number>()
        // dzdxMap[dzdx][interceptString] = dzdxMap[dzdx][interceptString] || []
        // dzdxMap[dzdx][interceptString].push({ h1, h2, t1, t2 })
        dzdxMap[dzdx][interceptString].add(h1)
        dzdxMap[dzdx][interceptString].add(h2)
    }

    function renderGradients(name: string, g: GradientMap): string {
        let output = `For ${name}:`

        for (const gradientAmount in g) {
            output += `[${gradientAmount}]:\n`
            for (const interceptString in g[gradientAmount]) {
                const hailstonesMatching = g[gradientAmount][interceptString]
                output += `  ${interceptString}: ${[...hailstonesMatching]}\n`
                // for (const source of g[gradientAmount][interceptString]) {
                //     // output += `  Hailstone ${source.h1} @ t=${ansiColors.whiteBright(source.t1.toString())} => Hailstone ${source.h2} @ t=${ansiColors.whiteBright(source.t2.toString())}\n`
                // }

            }
            output += '\n'
        }

        return output
    }

    function findSolutions(name: string, g: GradientMap) {
        for (const gradientAmount in g) {
            for (const interceptString in g[gradientAmount]) {
                const hailstonesMatching = g[gradientAmount][interceptString]
                if (hailstonesMatching.size === 3) {
                    console.log(`For ${name}, found a solution with gradient ${gradientAmount} at intercept ${interceptString}`)
                }
            }
        }
    }

    const TIME_OFFSET = 0
    const TIME_LIMIT = 1000
    const TIME_INTERVAL = 1

    for (let h1 = 0; h1 < hailstones.length; h1 += 1) {
        for (let h2 = h1 + 1; h2 < hailstones.length; h2 += 1) {
            const A = hailstones[h1]
            const B = hailstones[h2]
            for (let t1 = TIME_OFFSET; t1 < TIME_LIMIT; t1 += TIME_INTERVAL) {
                for (let t2 = TIME_OFFSET; t2 < TIME_LIMIT; t2 += TIME_INTERVAL) {
                    setGradient({ t1, t2, h1, h2 }, {
                        x: A.position.x + A.velocity.x * t1,
                        y: A.position.y + A.velocity.y * t1,
                        z: A.position.z + A.velocity.z * t1
                    }, {
                        x: B.position.x + B.velocity.x * t2,
                        y: B.position.y + B.velocity.y * t2,
                        z: B.position.z + B.velocity.z * t2
                    })
                }

            }
        }
    }

    // console.log(renderGradients('dydx', dydxMap))
    // console.log(renderGradients('dzdx', dzdxMap))
    findSolutions('dydx', dydxMap)
    findSolutions('dzdx', dzdxMap)

    // once the map is created, find any combination where the graidents match across all combinations of hailstones


    return 'TBD'
}
