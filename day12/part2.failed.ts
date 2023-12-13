import input from './input';

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
    const altWorld: World = []
    const altWorld2: World = []
    const comboWorld: World = []
    for (const line of input.split('\n')) {
        const [row, groupsStr] = line.split(' ')
        const group = groupsStr.split(',').map(str => parseInt(str, 10))
        world.push({
            row: row,
            groups: group
        })

        altWorld.push({
            row: `${row}?`,
            groups: group
        })

        altWorld2.push({
            row: `?${row}`,
            groups: group
        })

        comboWorld.push({
            row: `${row}?${row}?`,
            groups: [...group, ...group]
        })
    }

    console.log(world)

    let sum = 0
    let index = 0;
    for (let index = 0; index < world.length; index += 1) {
        const row = world[index]
        const altRow = altWorld[index]
        const altRow2 = altWorld2[index]
        // console.log('🔥', index + 1, row.row, row.groups)
        const solutions = solve(row)
        const qAtEndSolutions = solve(altRow)
        const qAtStartSolutions = solve(altRow2)

        // validateSolutions(solutions, row.groups)
        // if (solutions.length === 0) {
        console.log(`#${index + 1}: Pattern               : ${row.row} | ${row.groups}`)
        console.log(`#${index + 1}: Regular case solutions: ${solutions.length}: ${solutions.join('|')}`)
        console.log(`#${index + 1}: ?at end case solutions: ${qAtEndSolutions.length}: ${qAtEndSolutions.join('|')}`)
        console.log(`#${index + 1}: ?at sta case solutions: ${qAtStartSolutions.length}: ${qAtStartSolutions.join('|')}`)

        const combinations = [["A", "XA", "XA", "XA", "XA"], ["AX", "A", "XA", "XA", "XA"], ["AX", "AX", "A", "XA", "XA"], ["AX", "AX", "AX", "A", "XA"], ["AX", "AX",
            "AX", "AX", "A"]]

        // let aggregates: number[] = []
        // for (let c = 0; c < combinations.length; c += 1) {
        //     aggregates[c] = 1

        // }

        let aggregate = 0
        if (row.row.startsWith('?') && row.row.endsWith('?')) {
            aggregate = Math.pow(qAtEndSolutions.length, 4) * solutions.length
        } else {
            for (const solution of solutions) {
                if (solution.endsWith('#')) {
                    aggregate += Math.pow(solutions.length, 4)
                } else {
                    aggregate += Math.pow(qAtStartSolutions.length, 4)
                }
            }
        }


        console.log('❓', aggregate)
        // console.log(solutions, solutions.length)
        // console.log('🔥', index + 1, altRow.row, altRow.groups)
        // console.log(altSolutions, altSolutions.length)
        // console.log('💡', index + 1, solutions.length * Math.pow(altSolutions.length, 4))
        // }
        sum += aggregate
        // index += 1

    }

    console.log('special mode!')
    const BASE_PATTERN = '...????.????.????'
    const BASE_GROUPS = [1, 3]

    for (let i = 1; i <= 5; i += 1) {
        const special: ConditionRow = {
            row: new Array(i).fill(BASE_PATTERN).join('?'),
            groups: new Array(i).fill(BASE_GROUPS).flat()
        }
        console.log(`# Special: Pattern               : ${special.row} | ${special.groups}`)
        const specialSolutions = solve(special)
        console.log(`# Special: Regular case solutions: ${specialSolutions.length}`)
    }

    return sum

    // const groupToTest = 982
    // console.log(world[groupToTest - 1].row, world[groupToTest - 1].groups)
    // const solutions = solve(world[groupToTest - 1])
    // console.log(solutions)
    // validateSolutions(solutions, world[groupToTest - 1].groups)

}
