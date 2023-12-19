export type Category = 'x' | 'm' | 'a' | 's'
export type Part = {
    [c in Category]: number
}
export type Comparator = '<' | '>'

export type Condition = {
    category: Category,
    comparator: Comparator,
    value: number
}

export type Rule = {
    condition?: Condition,
    destination: string
}

export type Workflow = {
    name: string,
    rules: Rule[]
}

export type WorkflowMap = {
    [name in string]: Workflow
}

export function parse(input: string): {
    workflows: WorkflowMap, parts: Part[]
} {
    const [workflowsInput, partsInput] = input.split('\n\n')
    const workflows: {
        [name in string]: Workflow
    } = {}
    const parts: Part[] = []

    for (const workflowInput of workflowsInput.split('\n')) {
        const { groups } = /^(?<name>[a-z]+)\{(?<ruleString>.*)\}$/.exec(workflowInput) || {}
        if (!groups?.name || !groups.ruleString) {
            throw new Error(`Could not parse ${workflowInput}`)
        }

        const ruleParts = groups.ruleString.split(',')
        const rules: Rule[] = []

        for (const rulePart of ruleParts) {
            const ruleBits = rulePart.split(':')
            if (ruleBits.length === 1) {
                rules.push({ destination: ruleBits[0] })
            } else {
                const { groups: conditionGroups } = /^(?<name>[xmas])(?<comparator>[\<\>])(?<valueStr>[0-9]+)$/.exec(ruleBits[0]) || {}
                if (!conditionGroups?.name || !conditionGroups.comparator || !conditionGroups.valueStr) {
                    throw new Error(`Could not parse ${ruleBits[0]}`)
                }

                rules.push({
                    condition: {
                        category: conditionGroups.name as Category,
                        comparator: conditionGroups.comparator as Comparator,
                        value: parseInt(conditionGroups.valueStr, 10)
                    },
                    destination: ruleBits[1]
                })
            }
        }

        workflows[groups.name] = {
            name: groups.name,
            rules
        }
    }

    for (const partInput of partsInput.split('\n')) {
        const { groups } = /^\{(?<partData>.*)\}$/.exec(partInput) || {}
        if (!groups?.partData) {
            throw new Error(`Could not parse ${partInput}`)
        }

        const partSpecs = groups.partData.split(',')
        const part: Partial<Part> = {}
        for (const partSpec of partSpecs) {
            const [category, valueStr] = partSpec.split('=')
            part[category as Category] = parseInt(valueStr, 10)
        }

        parts.push(part as Part)
    }

    return { workflows, parts }
}
