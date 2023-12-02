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

    // for each game, determine the minimum colors needed and the resulting power of the minimum set
    let gamePowers: number[] = []
    for (const game of games) {
        const minimum = {
            red: 0,
            green: 0,
            blue: 0
        }
        for (const draw of game.draws) {
            if (draw.red) {
                minimum.red = Math.max(draw.red, minimum.red)
            }
            if (draw.green) {
                minimum.green = Math.max(draw.green, minimum.green)
            }
            if (draw.blue) {
                minimum.blue = Math.max(draw.blue, minimum.blue)
            }
        }

        // apparently this can be 0
        gamePowers.push(minimum.red * minimum.green * minimum.blue)
    }

    console.log(gamePowers)

    return gamePowers.reduce((acc, val) => acc + val, 0)
}
