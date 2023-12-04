import input from './input';

type Card = {
    id: number,
    winning: number[],
    yours: number[]
}

// number of each type of card
type Accumulator = {
    [cardId in number]: number
}

type CardLookup = {[cardId in number]: Card }
type Iteration = {
    cardCount: number,
    cardsWon: number[],
    acc: Accumulator
}

const iterateCardsEarned = (cardId: number, lookup: CardLookup, acc: Accumulator): Iteration => {
    // first, figure out what you win for a single card
    const card = lookup[cardId]
    let nextId = cardId + 1
    let cardsWon = []

    for (const yourNum of card.yours) {
        if (card.winning.includes(yourNum)) {
            cardsWon.push(nextId)
            nextId += 1
        }
    }

    // console.log({ cardsWon })

    // check how many of cardId you have and append the winnings
    const cardCount = acc[cardId]
    const copiesWon: Accumulator = {}
    for (const nextCardId of cardsWon) {
        copiesWon[nextCardId] = cardCount
        acc[nextCardId] += cardCount
    }

    return { cardCount, cardsWon, acc }
}

export default () => {    
    const lines = input.split('\n')
    const cards: Card[] = []
    const cardLookup: CardLookup = {}

    for (const line of lines) {
        const parts = /Card\s+(?<id>[0-9]+):\s+(?<winning>[^\|]+)\|(?<yours>[^\|]+)/.exec(line)

        if (!parts?.groups?.id || !parts?.groups?.winning || !parts?.groups?.yours) {
            throw new Error(`Could not process ${line}`)
        }
        
        const id = parseInt(parts.groups.id, 10)
        cardLookup[id] = {
            id,
            winning: parts.groups.winning.split(' ').map(item => parseInt(item, 10)).filter(item => item),
            yours: parts.groups.yours.split(' ').map(item => parseInt(item, 10)).filter(item => item)
        }
    }

    // initialize the accumulator
    let acc: Accumulator = {}
    for (const id in cardLookup) {
        acc[id] = 1
    }

    // simulate iterating over the cards won
    for (const id in acc) {
        const originalInstances = acc[id]
        const { cardsWon, cardCount } = iterateCardsEarned(parseInt(id, 10), cardLookup, acc)
        console.log(`Card ${id}: You have ${originalInstances} instances of this. It has ${cardsWon.length} matching numbers, so you win one copy each of the next cards: ${cardsWon.join(',')}`)
        for (let i = 0; i < Object.keys(acc).length; i += 5) {
            let row = ''
            for (let c = i; c < i+5 && c < Object.keys(acc).length ; c += 1) {
                row += ` Card ${String(c+1).padStart(5)}:${String(acc[c+1]).padStart(10)} |`
            }
            console.log(row)
            
        }
    }

    let sum = 0;
    for (const id in acc) {
        sum += acc[id]
    }
    
    return sum
}
