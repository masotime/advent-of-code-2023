import input from './input';

const REGEX = /^^.*?(?<start>1|one|2|two|3|three|4|four|5|five|6|six|7|seven|8|eight|9|nine).+(?<end>1|one|2|two|3|three|4|four|5|five|6|six|7|seven|8|eight|9|nine)?.*?$$/

const possibilities = [
    ['one', 1],
    ['two', 2],
    ['three', 3],
    ['four', 4],
    ['five', 5],
    ['six', 6],
    ['seven', 7],
    ['eight', 8],
    ['nine', 9]
] as const

function getNumber(input: string): number | undefined {
    for (const [word, digit] of possibilities) {
        if (input === word) return digit
    }
    return undefined
}

export default () => {
    const lines = input.split('\n');
    const firstAndLast = lines.map(line => {
        const result = REGEX.exec(line)
        if (!result || !result.groups) {
            throw new Error(`failed to extract from ${line}`)
        }

        const first = getNumber(result.groups.start) ?? parseInt(result.groups.start,10)
        let last = getNumber(result.groups.end) || parseInt(result.groups.end, 10)
        
        if (isNaN(last)) {
            last = first
        }

        return first * 10 + last
    })
    console.log({ firstAndLast })
    const sum = firstAndLast.reduce((acc, num) => acc + num, 0)
    return sum;

}
