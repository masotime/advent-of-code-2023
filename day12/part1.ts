import input from './sample';

type ConditionRow = {
    row: string,
    groups: number[]
}

type World = ConditionRow[]

type Candidate = {
    currRow: string,
    restRow: string,
    remainingGroups: number[]
}

// could be optimized
function generatePermutations(pattern: string): string[] {
    const questionIdx = pattern.indexOf('?')
    if (questionIdx === -1) return [pattern]

    const before = pattern.slice(0, questionIdx)
    const afterPermutations = generatePermutations(pattern.slice(questionIdx + 1))

    const set1 = afterPermutations.map(p => `${before}#${p}`)
    const set2 = afterPermutations.map(p => `${before}.${p}`)

    return set1.concat(set2)
}

function solve(start: ConditionRow): string[] {
    // console.log('begin', start.row)
    const candidates: Candidate[] = [{
        currRow: '',
        restRow: start.row,
        remainingGroups: start.groups
    }]

    const solutions: Candidate[] = []

    while (candidates.length > 0) {
        const candidate = candidates.shift()!

        // find the first # or ? group
        const search = /[#\?]+/g.exec(candidate.restRow)
        const group = search?.[0]
        const minSize = candidate.remainingGroups[0]

        // if we have a success, log it then continue
        if (candidate.remainingGroups.length === 0 && candidate.restRow.indexOf('#') === -1) {
            // console.log(`🚨 Solution: ${candidate.currRow} | ${candidate.restRow} | ${candidate.remainingGroups}`)
            candidate.restRow = candidate.restRow.replaceAll('?', '.')
            solutions.push(candidate)
            continue;
        } else if (!group || group.length > 0 && candidate.remainingGroups.length === 0) {
            // don't bother, we have failed
            // console.log('failed at', candidate)
            continue
        }

        // now we have to consider all permutations that fit given this group
        const permutations = generatePermutations(group)
        const hashMatch = new RegExp(`^[\\.]*[#]{${minSize}}(\\.|$)`)

        for (const permutation of permutations) {
            const beforePermutation = candidate.restRow.slice(0, candidate.restRow.indexOf(group))
            const afterPermutation = candidate.restRow.slice(beforePermutation.length + permutation.length)
            const fullRemainder = beforePermutation + permutation + afterPermutation
            // console.log('considering', `${beforePermutation} | ${permutation} | ${afterPermutation} |`, candidate.remainingGroups)
            // console.log(`Match ${fullRemainder}`)
            const groupMatch = hashMatch.exec(fullRemainder)
            const groupMatchIdx = groupMatch ? fullRemainder.indexOf(groupMatch[0]) : -1
            if (groupMatchIdx === -1) {
                if (permutation.indexOf('#') === -1) {
                    // this can still be a combination, just that we don't subtract the remaining groups
                    const currRow = candidate.currRow + beforePermutation + permutation
                    const restRow = afterPermutation
                    candidates.push({
                        currRow,
                        restRow,
                        remainingGroups: [...candidate.remainingGroups]
                    })
                }
            } else {
                // valid permutation
                const currRow = candidate.currRow + fullRemainder.slice(0, groupMatchIdx + groupMatch![0].length)
                const restRow = fullRemainder.slice(groupMatchIdx + groupMatch![0].length)
                const remainingGroups = candidate.remainingGroups.slice(1)
                candidates.push({
                    currRow,
                    restRow,
                    remainingGroups
                })
                // if (currRow.startsWith('#.###')) {
                // console.log(`generated candidate with permutation [${permutation}]`, `[${currRow}] + [${restRow}] | ${remainingGroups} `)
                // }

            }
        }
    }

    return solutions.map(solution => solution.currRow + solution.restRow)
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

function validateSolution(solution: string, groups: number[]) {
    const matches = solution.split(/.+/)
    let isValid = true
    if (groups.length !== matches.length) return false
    for (let i = 0; i < groups.length; i += 1) {
        if (groups[i] !== matches[i][0].length) {
            isValid = false
            break
        }
    }

    return isValid
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
    for (const row of world) {
        const solutions = solve(row)
        validateSolutions(solutions, row.groups)
        console.log(`#${index + 1}:`, row.row, row.groups, '|', solutions.length, solutions)
        sum += solutions.length
        index += 1
    }


    return sum

    // const groupToTest = 982
    // console.log(world[groupToTest - 1].row, world[groupToTest - 1].groups)
    // const solutions = solve(world[groupToTest - 1])
    // console.log(solutions)
    // validateSolutions(solutions, world[groupToTest - 1].groups)

}
