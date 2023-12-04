import input from './input';

type Card = {
    id: number,
    winning: number[],
    yours: number[]
}

const calculateScore = (card: Card): number => {
    let matches = 0
    for (const yourNum of card.yours) {
        if (card.winning.includes(yourNum)) {
            matches += 1
        }
    }
    return matches ? Math.pow(2, matches - 1) : 0
}

export default () => {    
    const lines = input.split('\n')
    const cards: Card[] = []

    for (const line of lines) {
        const parts = /Card\s+(?<id>[0-9]+):\s+(?<winning>[^\|]+)\|(?<yours>[^\|]+)/.exec(line)

        if (!parts?.groups?.id || !parts?.groups?.winning || !parts?.groups?.yours) {
            throw new Error(`Could not process ${line}`)
        }

        cards.push({
            id: parseInt(parts.groups.id, 10),
            winning: parts.groups.winning.split(' ').map(item => parseInt(item, 10)).filter(item => item),
            yours: parts.groups.yours.split(' ').map(item => parseInt(item, 10)).filter(item => item)
        })
    }

    let sum = 0;
    for (const card of cards) {
        const score = calculateScore(card)
        console.log(`Card 1: ${card.winning.join(',')} | ${card.yours.join(',')} | ${score}`)
        sum += score
    }

    return sum
}
