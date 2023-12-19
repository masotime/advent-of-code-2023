import input from './input';
import { parse } from './parsing';

export default () => {
    const { workflows, parts } = parse(input)

    // now that parsing is done, process the parts
    let total = 0
    for (const part of parts) {
        console.log(`Considering ${JSON.stringify(part)}`)
        let destination = 'in'
        while (!(['A', 'R'].includes(destination))) {
            // run the workflow at the destination
            const workflow = workflows[destination]
            for (const rule of workflow.rules) {
                // if there is no condition
                if (!rule.condition) {
                    destination = rule.destination
                    break
                }

                // test the condition
                const { category, comparator, value } = rule.condition
                const passesCondition = comparator === '<' ? part[category] < value : part[category] > value
                if (passesCondition) {
                    destination = rule.destination
                    break
                }
            }

            console.log('  destination:', destination)
        }

        console.log(`part ${JSON.stringify(part)} reached a destination of ${destination}`)
        if (destination === 'A') {
            const sum = part.x + part.m + part.a + part.s
            console.log(`> Adding ${sum}`)
            total += sum
        }
    }

    return total
}
