import input from './input';

type Card = 'A' | 'K' | 'Q' | 'J' | 'T' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2'
type Hand = [Card, Card, Card, Card, Card]
type Player = {
    hand: Hand
    bid: number
}
type CardMap = {
    [c in Card]?: number
}

type HandType = 'FiveK' | 'FourK' | 'FullH' | 'ThreeK' | 'TwoP' | 'OneP' | 'HighC'

const cardStrength: { [c in Card]: number} = {    
    'A': 13,
    'K': 12,
    'Q': 11,
    'J': 10,
    'T': 9,
    '9': 8,
    '8': 7,
    '7': 6,
    '6': 5,
    '5': 4,
    '4': 3,
    '3': 2,
    '2': 1
}

const handStrength: { [H in HandType]: number } = {
    'FiveK': 7,
    'FourK': 6,
    'FullH': 5,
    'ThreeK': 4,
    'TwoP': 3,
    'OneP': 2,
    'HighC': 1
}

function handSort(lhs: Hand, rhs: Hand): number {
    const leftStrength = handStrength[getHandType(lhs)]
    const rightStrength = handStrength[getHandType(rhs)]
    if (leftStrength !== rightStrength) {
        return leftStrength - rightStrength
    }

    // strength are the same, go through each card until the strengths don't match
    for (let cIdx = 0; cIdx < 5; cIdx += 1) {
        const leftCardStrength = cardStrength[lhs[cIdx]]
        const rightCardStrength = cardStrength[rhs[cIdx]]
        if (leftCardStrength !== rightCardStrength) {
            return leftCardStrength - rightCardStrength
        }
    }

    return 0;
}

function getHandType(hand: Hand): HandType {
    let cardMap: CardMap = {}

    for (const card of hand) {
        cardMap[card] = cardMap[card] || 0
        cardMap[card]! += 1
    }

    const distinctCards = Object.keys(cardMap).length
    switch (distinctCards) {
        case 5:
            return 'HighC';
        case 4: 
            return  'OneP';
        case 3: {
            // could be three of a kind or two pair            
            const [first, second, third] = Object.keys(cardMap) as Card[]
            if (cardMap[first] === 2 && cardMap[second] === 2 || 
                cardMap[first] === 2 && cardMap[third] === 2 ||
                cardMap[second] === 2 && cardMap[third] === 2) {
                return 'TwoP';                
            }
            return 'ThreeK';           
        }
        case 2: {
            // could be full house or four of a kind
            const [first] = Object.keys(cardMap) as Card[]
            if (cardMap[first] === 4 || cardMap[first] === 1) {
                return 'FourK';               
            }
            return 'FullH';            
        }
        case 1:
            return 'FiveK';
            break;
        default:
            throw new Error(`Couldn't determine hand type of ${hand}`)
    }
}

type World = Player[]

export default () => {
    const world: World = []
    for (const line of input.split('\n')) {
        const [handStr, bidStr] = line.split(' ')
        world.push({
            hand: handStr.split('') as Hand,
            bid: parseInt(bidStr, 10)
        })
    }

    for (const player of world) {
        console.log(player.hand.join(''), getHandType(player.hand))
    }

    // now sort the players by hand strength
    world.sort((player1, player2) => handSort(player1.hand, player2.hand))    

    let winnings = 0;
    console.log('Sorted:')

    for (let p = 0; p < world.length; p += 1) {
        const player = world[p]
        const hand = player.hand.join('')
        const bid = player.bid
        const rank = p+1
        console.log(`${rank} | ${hand} | ${bid}`)
        winnings += bid * rank
    }
    
    return winnings
}
