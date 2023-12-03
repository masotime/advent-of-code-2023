const GAME_REGEX = /^Game (?<id>[0-9]+):(?<game>.*)$/

type Color = 'red' | 'green' | 'blue'
type Draw = {
    [color in 'red'|'green'|'blue']?: number
}
type Game = {
    id: number,
    draws: Draw[]
}

export function parse(input: string): Game[] {
    const lines = input.split('\n');
    const games: Game[] = []
    for (const line of lines) {
        const gameAndId = GAME_REGEX.exec(line)
        if (!gameAndId?.groups?.id || !gameAndId?.groups?.game) {
            throw new Error(`Failed to parse ${line}`)
        }

        const { id, game } = gameAndId.groups
        const drawsStrings = game.split(';')
        const draws = []
        for (const drawStr of drawsStrings) {
            const re = /(([0-9]+) (red|blue|green))/g
            const draw: Draw = {}
            for (const match of drawStr.matchAll(re)) {
                const count = parseInt(match[2], 10)
                const color = match[3] as Color
                draw[color] = count
            }

            draws.push(draw)
        }

        games.push({ id: parseInt(id, 10), draws })
    }

    return games;
}