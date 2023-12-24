import ansiColors from 'ansi-colors';
import input from './input';

type Vector = {
    x: number,
    y: number,
    z: number
}

type Hailstone = {
    position: Vector,
    velocity: Vector,
    coefficientX: number,
    offsetX: number
}

const renderHailstone = (h: Hailstone): string => {
    return `${h.position.x}, ${h.position.y}, ${h.position.z} @ ${h.velocity.x}, ${h.velocity.y}, ${h.velocity.z}, y = ${h.coefficientX}x + ${h.offsetX}`
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
        const coefficientX = velocity.y / velocity.x
        const offsetX = position.y - position.x * velocity.y / velocity.x

        hailstones.push({
            position, velocity, coefficientX, offsetX
        })
    }

    // for (const hailstone of hailstones) {
    //     console.log(renderHailstone(hailstone))
    // }

    const MIN = 200000000000000
    const MAX = 400000000000000

    let futureCrossed = 0

    for (let h1 = 0; h1 < hailstones.length; h1 += 1) {
        for (let h2 = h1 + 1; h2 < hailstones.length; h2 += 1) {
            const A = hailstones[h1]
            const B = hailstones[h2]
            const xIntersect = (B.offsetX - A.offsetX) / (A.coefficientX - B.coefficientX)
            const yIntersect = A.coefficientX * xIntersect + A.offsetX
            const timeIntersectA = (xIntersect - A.position.x) / A.velocity.x
            const timeIntersectB = (xIntersect - B.position.x) / B.velocity.x

            console.log(`Hailstone A: ${renderHailstone(A)}`)
            console.log(`Hailstone B: ${renderHailstone(B)}`)

            const xyString = renderXy(xIntersect, yIntersect)

            if (xIntersect === Infinity || yIntersect === Infinity) {
                console.log(`Hailstones' paths are parallel; they ${ansiColors.redBright('never')} intersect`)
            } else if (timeIntersectA < 0 && timeIntersectB < 0) {
                console.log(`Hailstones' paths crossed in the past for both hailstones.`)
            } else if (timeIntersectA < 0) {
                console.log(`Hailstones' paths crossed in the past for hailstone A.`)
            } else if (timeIntersectB < 0) {
                console.log(`Hailstones' paths crossed in the past for hailstone B.`)
            } else if (xIntersect >= MIN && xIntersect <= MAX && yIntersect >= MIN && yIntersect <= MAX) {
                futureCrossed += 1
                console.log(`Hailstones' paths will cross ${ansiColors.whiteBright('inside')} the test area ${xyString}`)
            } else {
                console.log(`Hailstones' paths will cross ${ansiColors.redBright('outside')} the test area ${xyString}`)
            }
            console.log('')
        }
    }

    return futureCrossed
}
