import input from './sample';

type ConditionRow = {
    row: string,
    groups: number[]
}

type World = ConditionRow[]

const permutationMemo: {
    [pattern in string]: string[]
} = {}

// could be optimized
function generatePermutations(pattern: string): string[] {
    if (permutationMemo[pattern]) {
        return permutationMemo[pattern]
    }

    const questionIdx = pattern.indexOf('?')
    if (questionIdx === -1) {
        permutationMemo[pattern] = [pattern]
        return permutationMemo[pattern]
    }

    const before = pattern.slice(0, questionIdx)
    const afterPermutations = generatePermutations(pattern.slice(questionIdx + 1))

    const set1 = afterPermutations.map(p => `${before}#${p}`)
    const set2 = afterPermutations.map(p => `${before}.${p}`)

    permutationMemo[pattern] = set1.concat(set2)
    return permutationMemo[pattern]
}

// pattern must be some combination of # and ?
function betterPermuter(pattern: string, requiredLength: number): string[] {
    let permutations: string[] = []
    // console.log(pattern)

    // use a sliding window
    let start = 0
    let windowLocked = false

    do {
        if (pattern[start] === '#') {
            windowLocked = true
        }

        if (start + requiredLength > pattern.length) {
            break;
        }

        const beforeWindow = new Array(start).fill('.').join('')
        const window = new Array(requiredLength).fill('#').join('')
        const afterWindow = pattern[start + requiredLength]

        let validPrefix = beforeWindow + window
        // console.log({ beforeWindow, window, afterWindow, validPrefix, windowLocked })
        if (afterWindow !== '#') {
            if (afterWindow === '?') {
                // can be valid, but have to terminate with '.'
                validPrefix += '.'
            }

            permutations.push(validPrefix + pattern.slice(validPrefix.length))
        }
        if (windowLocked) {
            break
        }
        start += 1
    } while (start + requiredLength <= pattern.length)

    // in case there are no solutions, use a permutation where every '?' is set to '.'
    // if (permutations.length === 0) {
    permutations.push(pattern.replaceAll('?', '.'))
    // }

    // dedupe
    return Array.from(new Set<string>(permutations))
}

type Cache = {
    [key in string]: string[]
}

function getKey(c: ConditionRow): string {
    const earlierPart = c.row.replaceAll(/^\.+/g, '')
    return `${earlierPart}|${c.groups.join(',')}`
}

function solveFolded(start: ConditionRow, iterations: number): string[] {
    const cache: Cache = {}

    let cycleSolutions: string[] = []
    for (let i = 1; i <= iterations; i += 1) {
        const cycle: ConditionRow = {
            row: new Array(i).fill(start.row).join('?'),
            groups: new Array(i).fill(start.groups).flat()
        }
        cycleSolutions = solve(cycle, cache)
    }

    return cycleSolutions
}

let cacheHits = 0
function solve(candidate: ConditionRow, cache: Cache): string[] {
    const key = getKey(candidate)

    // cache
    if (cache[key]) {
        cacheHits += 1
        return cache[key]
    }

    // success base case
    if (candidate.groups.length === 0 && candidate.row.indexOf('#') === -1) {
        const solution = candidate.row.replaceAll('?', '.')
        cache[key] = [solution]
        // console.log(`🚨 solution ['${solution}']`)
        return cache[key]
    }

    // find the first # or ? group
    const search = /[#\?]+/g.exec(candidate.row)
    const group = search?.[0]
    const minSize = candidate.groups[0]

    const noMatch = !group
    const matchButShouldntHave = !noMatch && group.length === 0

    // failure base case
    if (noMatch || matchButShouldntHave) {
        cache[key] = []
        return cache[key]
    }

    // recursion case
    // now we have to consider all permutations that fit given this group
    // const permutations = generatePermutations(group)
    const permutations = betterPermuter(group, minSize)
    const hashMatch = new RegExp(`^[\\.]*[#]{${minSize}}(\\.|$)`)
    let accumulatedSolutions: string[] = []

    // console.log(candidate.row, minSize, group, permutations)

    for (const permutation of permutations) {
        const beforePermutation = candidate.row.slice(0, candidate.row.indexOf(group))
        const afterPermutation = candidate.row.slice(beforePermutation.length + permutation.length)
        const fullRemainder = beforePermutation + permutation + afterPermutation
        // console.log(`considering ${candidate.row} => ${fullRemainder} |`, candidate.groups)
        const groupMatch = hashMatch.exec(fullRemainder)
        const groupMatchIdx = groupMatch ? fullRemainder.indexOf(groupMatch[0]) : -1
        if (groupMatchIdx === -1) {
            if (permutation.indexOf('#') === -1) {
                // this can still be a combination, just that we don't subtract the remaining groups
                const prefix = beforePermutation + permutation
                const nextRow = afterPermutation
                const nextCandidate = { row: nextRow, groups: [...candidate.groups] }
                // console.log(`Empty permutation, [${prefix}] + solve([${nextRow}]) | [${candidate.groups}]`)
                const nextSolutions = solve(nextCandidate, cache)
                // console.log(`Empty permutation, [${prefix}] + solve([${nextRow}]) | [${candidate.groups}]: Solutions: ${nextSolutions}`)
                const prefixedNextSolutions = nextSolutions.map(sol => prefix + sol)
                accumulatedSolutions = accumulatedSolutions.concat(prefixedNextSolutions)

            }
        } else {
            // valid permutation
            const prefix = fullRemainder.slice(0, groupMatchIdx + groupMatch![0].length)
            const nextRow = fullRemainder.slice(groupMatchIdx + groupMatch![0].length)
            const nextCandidate = { row: nextRow, groups: candidate.groups.slice(1) }
            // console.log(`Regular permutation, [${prefix}] + solve([${nextRow}]) | [${candidate.groups.slice(1)}]`)
            const nextSolutions = solve(nextCandidate, cache)
            // console.log(`Regular permutation, [${prefix}] + solve([${nextRow}]) | [${candidate.groups.slice(1)}]: Solutions: ${nextSolutions}`)
            const prefixedNextSolutions = nextSolutions.map(sol => prefix + sol)
            accumulatedSolutions = accumulatedSolutions.concat(prefixedNextSolutions)
        }
    }

    // console.log(`🚨 aggregated solutions for ${candidate.row}`, accumulatedSolutions)
    cache[key] = accumulatedSolutions

    return cache[key]
}

function validateSolutions(solutions: string[], groups: number[]) {
    for (const solution of solutions) {
        const matches = solution.split(/\.+/).filter(_ => _)

        for (let i = 0; i < groups.length; i += 1) {
            if (groups[i] !== matches[i].length) {
                console.log(`❌ ${solution} does not satisfy ${groups} `)
            }
        }

    }
}

export default () => {
    const world: World = []
    for (const line of input.split('\n')) {
        const [row, groupsStr] = line.split(' ')
        world.push({
            row,
            groups: groupsStr.split(',').map(str => parseInt(str, 10))
        })
    }

    let sum = 0
    let index = 0;

    for (let w = 0; w < world.length; w += 1) {
        // if (w === 992) {
        const row = world[w]
        const solutions = solveFolded(row, 5)
        validateSolutions(solutions, row.groups)
        console.log(`#${w + 1}: `, row.row, row.groups, '|', solutions.length)
        sum += solutions.length
        index += 1
        // }

    }

    // console.log(Object.keys(permutationMemo).length)
    // console.log(betterPermuter('????###??', 5))
    console.log(cacheHits)
    return sum

    // const groupToTest = 982
    // console.log(world[groupToTest - 1].row, world[groupToTest - 1].groups)
    // const solutions = solve(world[groupToTest - 1])
    // console.log(solutions)
    // validateSolutions(solutions, world[groupToTest - 1].groups)

}
