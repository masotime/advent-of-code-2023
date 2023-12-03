import input from './input';
import { parse } from './parser';
import { sum } from '../utils'

const MAX_POSSIBLE = {
    red: 12,
    green: 13,
    blue: 14
} as const

export default () => {
    const games = parse(input)

    // for each game, test the draws and see if they were possible
    let possibleGames: number[] = []
    for (const game of games) {
        let possible = true
        for (const draw of game.draws) {
            // lazy - no 0 so we are safe there
            const blueFails = draw.blue && draw.blue > MAX_POSSIBLE.blue
            const redFails = draw.red && draw.red > MAX_POSSIBLE.red
            const greenFails = draw.green && draw.green > MAX_POSSIBLE.green

            if (blueFails || redFails || greenFails) {
                possible = false
                break
            }
        }

        if (possible) {
            possibleGames.push(game.id)
        }
    }

    return sum(possibleGames)
}
