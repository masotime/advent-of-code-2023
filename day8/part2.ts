import input from './input';
import { lcmArray } from '../utils'

type Node = {
    name: string,
    left: string,
    right: string,
    sequenceEnd?: string,
    stepsToEnd: number
}

type Map = {
    [name in string]: Node
}

const NODE_REGEX = /(?<name>[A-Z1-9]+) = \((?<left>[A-Z1-9]+), (?<right>[A-Z1-9]+)\)/

function visualizeMap(map: Map): string {
    let output = ''
    for (const nodeName in map) {
        const node = map[nodeName]
        output += `${nodeName} (${node.left}, ${node.right}) sequenceEnd: ${node.sequenceEnd} stepsToEnd: ${node.stepsToEnd}\n`
    }
    return output
}

type WalkResult = {
    type: 'normal',
    end: string
} | {
    type: 'finishes',
    end: string
    steps: number
}

function initialWalk(map: Map, nodeName: string, sequence: string[]): WalkResult {
    let position = map[nodeName]

    let steps = 0;
    for (const instruction of sequence) {
        const direction = instruction === 'L' ? 'left' : 'right'
        const nextNodeName = position[direction]
        position = map[nextNodeName]
        steps += 1;
        if (nextNodeName.endsWith('Z')) {
            return {
                type: 'finishes', 
                end: nextNodeName,                   
                steps
            }
        }
    }

    return {
        type: 'normal',
        end: position.name
    }
}

// leverage existing walks to calculate subsequent destinations
function repeatedWalk(map: Map, nodeName: string, sequence: string[]) {
    let position = map[nodeName]

    if (!position.sequenceEnd) {
        throw new Error(`can't do a repeated walk if the initial walk is not done on ${nodeName}`)
    }

    if (nodeName.endsWith('Z') || position.sequenceEnd.endsWith('Z')) {
        // do nothing, this is a destination node or ends at a destination
        return;
    }

    const destination = position.sequenceEnd
    const destEnd = map[destination].sequenceEnd

    if (!destEnd) {
        throw new Error(`the destination of ${nodeName}, ${destination} doesn't have a sequenceEnd???`)
    }

    // If the destination ends with ZZZ, then set the position's steps to sequenceLength + stepsToEnd
    if (destEnd.endsWith('Z')) {
        position.stepsToEnd = map[destination].stepsToEnd + sequence.length
        position.sequenceEnd = destEnd
    }
}

function mapComplete(map: Map): number {
    const incomplete: string[] = []
    let steps = 0
    for (const nodeName in map) {
        if (nodeName.endsWith('A')) {
            if (map[nodeName].sequenceEnd?.endsWith('Z')) {
                steps += map[nodeName].stepsToEnd
            } else {
                incomplete.push(nodeName)
            }
        }
    }

    if (incomplete.length > 0) {
        console.log(`The following nodes still have no conclusion: ${incomplete}`)
        return 0
    }

    return steps
}


export default () => {
    const [instructions,, ...nodes] = input.split('\n')

    const map: Map = {}

    for (const node of nodes) {
        const { groups } = NODE_REGEX.exec(node) ?? {}

        if (!groups?.name || !groups.left || !groups.right) {
            throw new Error(`Could not parse ${node}`)
        }

        map[groups.name] = {
            name: groups.name,
            left: groups.left,
            right: groups.right,
            stepsToEnd: -1,
        }
    }

    const sequence = instructions.split('')

    // instead of walking the entire thing, for each node on the map,
    // calculate where you will end up if you follow the sequence first.
    for (const nodeName in map) {
        const result = initialWalk(map, nodeName, sequence)
        if (result.type === 'normal') {
            map[nodeName].sequenceEnd = result.end
        } else {
            map[nodeName].sequenceEnd = result.end
            map[nodeName].stepsToEnd = result.steps            
        }
    }

    console.log(sequence.length)
    console.log('After initial walk')
    console.log(visualizeMap(map)) 
    
    while(mapComplete(map) === 0) {
        console.log('going for a walk')
        for (const nodeName in map) {
            repeatedWalk(map, nodeName, sequence)
        }
        console.log('After a repeated walk')
        console.log(visualizeMap(map))
    }

    const numbers = []
    for (const nodeName in map) {
        if (nodeName.endsWith('A')) {
            numbers.push(map[nodeName].stepsToEnd)
        }
    }
    
    return lcmArray(numbers)
}
