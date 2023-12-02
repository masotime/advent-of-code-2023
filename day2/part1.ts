import input from './input';

const GAME_REGEX = /^Game (?<id>[0-9]+):(?<game>.*)$/

type Color = 'red' | 'green' | 'blue'
type Draw = {
    [color in 'red'|'green'|'blue']?: number
}
type Game = {
    id: number,
    draws: Draw[]
}

const MAX_POSSIBLE = {
    red: 12,
    green: 13,
    blue: 14
} as const

export default () => {
    const lines = input.split('\n');
    const games: Game[] = []
    for (const line of lines) {
        const phase1 = GAME_REGEX.exec(line)
        if (!phase1 || !phase1.groups || !phase1.groups.id || !phase1.groups.game) {
            throw new Error(`Failed to parse ${line}`)
        }

        const { id, game } = phase1.groups
        const drawsStrings = game.split(';')
        const draws = []
        for (const drawStr of drawsStrings) {
            const re = /(([0-9]+) (red|blue|green))/g
            const draw: Draw = {}
            let match
            while (match = re.exec(drawStr)) {
                const count = parseInt(match[2], 10)
                const color = match[3] as Color
                draw[color] = count
            }

            draws.push(draw)
        }

        games.push({ id: parseInt(id, 10), draws })
    }

    console.log(JSON.stringify(games, null, 2))

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

    console.log(possibleGames)

    return possibleGames.reduce((acc, val) => acc + val, 0)
}
