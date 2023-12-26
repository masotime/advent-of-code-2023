import input from './input';

type Node = {
    name: string,
    links: string[]
}

type Graph = {
    [nodeName in string]: Node
}

function renderAsDot(g: Graph): string {
    let output = ''
    console.log(Object.keys(g))
    for (const key in g) {
        const links = g[key]?.links
        if (links) {
            output += `${key} -- { ${links.join(' ')} }`
        }
        output += '\n'

    }
    return output
}

export default () => {
    const graph: Graph = {}
    let start: string = ''
    for (const line of input.split('\n')) {
        const { groups } = /^(?<component>[a-z]+): (?<others>.*)$/.exec(line) ?? {}

        if (!groups?.component || !groups.others) {
            throw new Error(`Could not parse ${line}`)
        }

        if (start === '') {
            start = groups.component
        }

        const node: Node = graph[groups.component] || {
            name: groups.component,
            links: []
        }
        graph[groups.component] = node

        // link the nodes if present, otherwise, create them
        const otherNodes = groups.others.split(' ')

        for (const otherNode of otherNodes) {
            if (!(graph[otherNode])) {
                graph[otherNode] = {
                    name: otherNode,
                    links: [groups.component]
                }
            } else {
                graph[otherNode].links.push(groups.component)
            }

            node.links.push(otherNode)
        }
    }

    console.log(renderAsDot(graph))

    type CandidatePath = {
        links: string[]
    }

    const candidates: CandidatePath[] = [{ links: ['xhk'] }]
    const solutions: CandidatePath[] = []

    while (candidates.length > 0) {
        const candidate = candidates.shift()!
        const currentLinks = candidate.links
        const lastLink = currentLinks[currentLinks.length - 1]

        // find all adjacents, etc. that haven't appeared yet
        // console.log(`checking ${lastLink}`)
        const nextPaths = graph[lastLink].links.filter(candidateLink => !currentLinks.some(onPathLink => candidateLink === onPathLink))

        if (nextPaths.length === 0) {
            solutions.push(candidate)
        } else {
            for (const nextPath of nextPaths) {
                candidates.push({
                    links: [...currentLinks, nextPath]
                })
            }
        }
    }

    // console.log(JSON.stringify(solutions, null, 2))

    // find the links that appear the most often (these are likely candidates for removal)
    const linkCount: {
        [link in string]: number
    } = {}

    for (const sol of solutions) {
        for (let i = 0; i < sol.links.length - 1; i += 1) {
            const pair = [sol.links[i], sol.links[i + 1]].sort().join('-')
            linkCount[pair] = (linkCount[pair] || 0) + 1
        }
    }

    const linkCountArray = Object.entries(linkCount).sort((a, b) => a[1] - b[1])

    console.log(Object.fromEntries(linkCountArray))



    return 'TBD'
}
