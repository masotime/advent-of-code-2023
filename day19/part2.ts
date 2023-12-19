import input from './input';
import { parse } from './parsing';
import type { Category, WorkflowMap } from './parsing'

type Boundary = {
    [c in Category]: {
        lower: number,
        upper: number
    }
}

function solve(workflowName: string, conditions: Boundary, workflows: WorkflowMap): Boundary[] {
    const boundaries: Boundary[] = []
    const workflow = workflows[workflowName]

    let remainingBoundary = { ...conditions }

    for (const rule of workflow.rules) {
        if (rule.condition) {
            // create a new boundary for success
            let conditionSatisfiedBoundary: Boundary = JSON.parse(JSON.stringify(conditions)) // deep copy needed
            const { category, comparator, value } = rule.condition
            const { lower, upper } = conditionSatisfiedBoundary[category]
            let boundaryExists = false

            if (comparator === '<' && lower < value) {
                // possible to generate condition
                conditionSatisfiedBoundary[category] = {
                    lower,
                    upper: value - 1 // narrow the range
                }
                boundaryExists = true
            } else if (comparator === '>' && upper > value) {
                conditionSatisfiedBoundary[category] = {
                    lower: value + 1,
                    upper
                }
                boundaryExists = true
            }

            if (boundaryExists) {
                if (rule.destination === 'A') {
                    boundaries.push(conditionSatisfiedBoundary)
                } else if (rule.destination !== 'R') {
                    boundaries.push(...solve(rule.destination, conditionSatisfiedBoundary, workflows))
                }
            }

            // otherwise, just set the remaining boundary for the next rule            
            if (comparator === '<') {
                remainingBoundary[category].lower = value // i.e. at least value, so fails < value
                if (remainingBoundary[category].lower > remainingBoundary[category].upper) {
                    break; // impossible, no point searching
                }
            } else {
                remainingBoundary[category].upper = value // i.e. at most value, so fails > value
                if (remainingBoundary[category].upper < remainingBoundary[category].lower) {
                    break; // impossible, no point searching
                }
            }
        } else {
            // no condition
            if (rule.destination === 'A') {
                boundaries.push(remainingBoundary)
                break;
            } else if (rule.destination !== 'R') {
                boundaries.push(...solve(rule.destination, remainingBoundary, workflows))
            }
        }

    }

    return boundaries
}

function renderBoundaries(boundary: Boundary): string {
    const { x, m, a, s } = boundary
    return `x: ${x.lower} - ${x.upper}, m: ${m.lower} - ${m.upper}, a: ${a.lower} - ${a.upper}, s: ${s.lower} - ${s.upper}`

}

export default () => {
    const { workflows } = parse(input)

    const initial: Boundary = {
        x: { lower: 1, upper: 4000 },
        m: { lower: 1, upper: 4000 },
        a: { lower: 1, upper: 4000 },
        s: { lower: 1, upper: 4000 },
    }

    const acceptedBoundaries = solve('in', initial, workflows)
    console.log(acceptedBoundaries.map(renderBoundaries).join('\n'))

    let totalPossibilities = 0
    for (const boundary of acceptedBoundaries) {
        let product = 1
        for (const category of ['x', 'm', 'a', 's'] as const) {
            product *= (boundary[category].upper - boundary[category].lower + 1)
        }

        totalPossibilities += product
    }

    return totalPossibilities
}
