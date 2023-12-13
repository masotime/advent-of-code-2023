import input from './input';

type ConditionRow = {
    row: string,
    groups: number[]
}

type World = ConditionRow[]

type Cache = {
    [key in string]: number
}

const getKey = (input: string, groups: number[]): string => {
    return `${input}|${groups.join(',')}`
}

function solve(input: string, groups: number[], cache: Cache): number {
    const key = getKey(input, groups)
    if (cache[key]) {
        return cache[key]
    }

    // tree pruning - important
    const minCharsNeeded = groups.reduce((acc, size) => acc + size, 0) + groups.length - 1
    if (input.length < minCharsNeeded) {
        cache[key] = 0
        return cache[key];
    }

    cache[key] = 0

    if (groups.length === 0) {
        // no more groups, the rest of the string must not have #
        const noHash = input.indexOf('#') === -1
        cache[key] = noHash ? 1 : 0
        // if (cache[key] === 1) {
        //     console.log(`solved input:[${input}] groups:[${groups.join(',')}]`)
        // }
    } else {
        // at least one group left
        const firstChar = input[0]
        const [firstGroup] = groups

        // const solutionRequired = new Array(firstGroup).fill('#').join('')
        if (firstChar === '?' || firstChar === '.') {
            // we can either choose to ignore it, or see if the next groupSize chars are all # or ?

            // ignore case (set to '.')
            cache[key] += solve(input.slice(1), groups, cache)
        }

        if (firstChar === '?' || firstChar === '#') {
            // don't ignore it, try and make it part of the current group. last char + 1 cannot be #
            // to make it a distinct group fo the right size.
            if (input.slice(0, firstGroup).indexOf('.') === -1 && input[firstGroup] !== '#') {
                // firstGroup + 1 is important
                cache[key] += solve(input.slice(firstGroup + 1), groups.slice(1), cache)
            }
        }

    }

    return cache[key]

}


export default () => {
    const world: World = []
    for (const line of input.split('\n')) {
        const [row, groupsStr] = line.split(' ')
        const rowX5 = new Array(5).fill(row).join('?')
        const groups = groupsStr.split(',').map(str => parseInt(str, 10))
        const groupsX5 = new Array(5).fill(groups).flat()

        world.push({
            row: row,
            groups: groups
        })
    }

    let cache: Cache = {}
    let finalSum = 0;
    for (let iter = 5; iter <= 5; iter += 1) {
        let sum = 0
        let index = 0;
        console.log('Number of iterations', iter)
        console.log('Cache size', Object.keys(cache).length)
        for (let w = 0; w < world.length; w += 1) {
            const { row, groups } = world[w]
            const rowX = new Array(iter).fill(row).join('?')
            const groupsX = new Array(iter).fill(groups).flat()
            const solutions = solve(rowX, groupsX, cache)
            console.log(`#${w + 1}: `, row, groups, '|', solutions)
            sum += solutions
            index += 1
        }
        console.log(`🚨 For ${iter} iteration(s), sum = ${sum}`)
        finalSum = sum
    }



    return finalSum
}
