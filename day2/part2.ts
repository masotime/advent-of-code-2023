import { product, sum } from '../utils';
import input from './input';
import { parse } from './parser';

export default () => {
    const games = parse(input)

    // for each game, determine the minimum colors needed and the resulting power of the minimum set
    let gamePowers: number[] = []
    for (const game of games) {
        const minimum = {
            red: 0,
            green: 0,
            blue: 0
        }
        for (const draw of game.draws) {
            minimum.red = Math.max(draw.red ?? 0, minimum.red)
            minimum.green = Math.max(draw.green ?? 0, minimum.green)
            minimum.blue = Math.max(draw.blue ?? 0, minimum.blue)
        }

        gamePowers.push(product([minimum.red, minimum.green, minimum.blue]))
    }

    console.log(gamePowers)
    return sum(gamePowers)
}
